"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSesion, puedeAdministrarCatalogo } from "@/lib/authz";

export type LoteSeleccionado = { loteOrigenId: string; cantidad: number };
export type PartidaTransferencia = {
  productoOrigenId: string;
  productoDestinoId: string;
  cantidad: number;
  lotes: LoteSeleccionado[];
};

export type ResultadoTransferencia = { error: string } | { ok: true; transferenciaId: string };

export async function registrarTransferencia(
  iglesiaOrigenId: string,
  iglesiaDestinoId: string,
  fecha: string,
  comentario: string | null,
  partidas: PartidaTransferencia[],
): Promise<ResultadoTransferencia> {
  const sesion = await requireSesion();
  if (!puedeAdministrarCatalogo(sesion)) return { error: "No tienes permiso para esto." };

  if (!iglesiaOrigenId || !iglesiaDestinoId) {
    return { error: "Selecciona la iglesia de origen y la de destino." };
  }
  if (iglesiaOrigenId === iglesiaDestinoId) {
    return { error: "La iglesia de origen y destino deben ser distintas." };
  }
  if (
    !sesion.esSuperAdmin &&
    sesion.iglesiaId !== iglesiaOrigenId &&
    sesion.iglesiaId !== iglesiaDestinoId
  ) {
    return { error: "No tienes acceso a ninguna de esas iglesias." };
  }

  const fechaTransferencia = new Date(fecha);
  if (Number.isNaN(fechaTransferencia.getTime())) return { error: "La fecha no es válida." };
  if (!partidas.length) return { error: "Agrega al menos un producto a la transferencia." };

  const productoOrigenIds = partidas.map((p) => p.productoOrigenId);
  const productoDestinoIds = partidas.map((p) => p.productoDestinoId);

  const [productosOrigen, productosDestino] = await Promise.all([
    prisma.producto.findMany({
      where: { id: { in: productoOrigenIds }, iglesiaId: iglesiaOrigenId, tipo: "PRODUCTO" },
    }),
    prisma.producto.findMany({
      where: { id: { in: productoDestinoIds }, iglesiaId: iglesiaDestinoId, tipo: "PRODUCTO" },
    }),
  ]);
  const origenPorId = new Map(productosOrigen.map((p) => [p.id, p]));
  const destinoPorId = new Map(productosDestino.map((p) => [p.id, p]));

  const loteIds = partidas.flatMap((p) => p.lotes.map((l) => l.loteOrigenId));
  const lotes = await prisma.ajusteInventarioItem.findMany({ where: { id: { in: loteIds } } });
  const lotesPorId = new Map(lotes.map((l) => [l.id, l]));

  for (const partida of partidas) {
    const productoOrigen = origenPorId.get(partida.productoOrigenId);
    const productoDestino = destinoPorId.get(partida.productoDestinoId);
    if (!productoOrigen) {
      return { error: "Alguno de los productos de origen no es válido para esa iglesia." };
    }
    if (!productoDestino) {
      return { error: `"${productoOrigen.nombre}" no tiene un producto correspondiente en la iglesia destino.` };
    }
    if (!Number.isInteger(partida.cantidad) || partida.cantidad < 1) {
      return { error: `La cantidad a transferir de "${productoOrigen.nombre}" debe ser mayor a 0.` };
    }
    if (!partida.lotes.length) {
      return { error: `Selecciona de qué lote(s) se tomará "${productoOrigen.nombre}".` };
    }

    let sumaLotes = 0;
    for (const seleccion of partida.lotes) {
      const lote = lotesPorId.get(seleccion.loteOrigenId);
      if (!lote || lote.productoId !== partida.productoOrigenId) {
        return { error: `Uno de los lotes seleccionados para "${productoOrigen.nombre}" no es válido.` };
      }
      if (!Number.isInteger(seleccion.cantidad) || seleccion.cantidad < 1) {
        return { error: `La cantidad tomada de un lote de "${productoOrigen.nombre}" debe ser mayor a 0.` };
      }
      if (seleccion.cantidad > lote.cantidadDisponible) {
        return {
          error: `No hay suficiente disponible en el lote seleccionado de "${productoOrigen.nombre}" (disponible: ${lote.cantidadDisponible}).`,
        };
      }
      sumaLotes += seleccion.cantidad;
    }
    if (sumaLotes !== partida.cantidad) {
      return {
        error: `La suma de los lotes seleccionados de "${productoOrigen.nombre}" (${sumaLotes}) debe ser igual a la cantidad a transferir (${partida.cantidad}).`,
      };
    }
  }

  try {
    const transferencia = await prisma.$transaction(async (tx) => {
      const creada = await tx.transferenciaInventario.create({
        data: {
          iglesiaOrigenId,
          iglesiaDestinoId,
          fecha: fechaTransferencia,
          comentario,
          realizadoPorId: sesion.id,
        },
      });

      const iglesiaOrigen = await tx.iglesia.findUnique({ where: { id: iglesiaOrigenId } });
      const ajusteDestino = await tx.ajusteInventario.create({
        data: {
          iglesiaId: iglesiaDestinoId,
          fecha: fechaTransferencia,
          comentario: `Transferencia desde ${iglesiaOrigen?.nombre ?? "otra iglesia"}${comentario ? `: ${comentario}` : ""}`,
          realizadoPorId: sesion.id,
        },
      });

      for (const partida of partidas) {
        const productoOrigen = origenPorId.get(partida.productoOrigenId)!;
        const productoDestino = destinoPorId.get(partida.productoDestinoId)!;

        const item = await tx.transferenciaInventarioItem.create({
          data: {
            transferenciaId: creada.id,
            productoOrigenId: partida.productoOrigenId,
            productoDestinoId: partida.productoDestinoId,
            cantidad: partida.cantidad,
          },
        });

        for (const seleccion of partida.lotes) {
          const lote = lotesPorId.get(seleccion.loteOrigenId)!;

          const actualizado = await tx.ajusteInventarioItem.updateMany({
            where: { id: lote.id, cantidadDisponible: { gte: seleccion.cantidad } },
            data: { cantidadDisponible: { decrement: seleccion.cantidad } },
          });
          if (actualizado.count === 0) {
            throw new Error(
              `No hay suficiente disponible en el lote seleccionado de "${productoOrigen.nombre}".`,
            );
          }

          const loteDestino = await tx.ajusteInventarioItem.create({
            data: {
              ajusteId: ajusteDestino.id,
              productoId: partida.productoDestinoId,
              cantidad: seleccion.cantidad,
              cantidadDisponible: seleccion.cantidad,
              precioCompra: lote.precioCompra,
              precioVenta: productoDestino.precio,
            },
          });

          await tx.transferenciaLote.create({
            data: {
              itemId: item.id,
              loteOrigenId: lote.id,
              loteDestinoId: loteDestino.id,
              cantidad: seleccion.cantidad,
            },
          });
        }

        await tx.producto.update({
          where: { id: partida.productoOrigenId },
          data: { stock: { decrement: partida.cantidad } },
        });
        await tx.producto.update({
          where: { id: partida.productoDestinoId },
          data: { stock: { increment: partida.cantidad } },
        });
      }

      return creada;
    });

    revalidatePath("/catalogo");
    revalidatePath("/catalogo/ajuste-inventario");
    revalidatePath("/catalogo/transferencia-inventario");
    revalidatePath("/punto-de-venta");
    return { ok: true, transferenciaId: transferencia.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo registrar la transferencia." };
  }
}
