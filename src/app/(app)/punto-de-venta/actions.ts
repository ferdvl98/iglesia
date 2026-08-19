"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSesion, puedeUsarPuntoDeVenta } from "@/lib/authz";
import type { MetodoPago, Prisma } from "@prisma/client";

export type ItemVenta = { productoId: string; cantidad: number; comentario?: string };
export type ResultadoVenta = { error: string } | { ok: true; ventaId: string; total: number };

/**
 * Consume el stock de un producto de sus lotes más antiguos primero (FIFO,
 * por la fecha del ajuste). Devuelve el detalle de qué lote(s) se usaron y a
 * qué costo, para dejar registro de costos reales por venta.
 */
async function consumirLotesFifo(
  tx: Prisma.TransactionClient,
  productoId: string,
  cantidadNecesaria: number,
) {
  const lotes = await tx.ajusteInventarioItem.findMany({
    where: { productoId, cantidadDisponible: { gt: 0 } },
    orderBy: [{ ajuste: { fecha: "asc" } }, { ajuste: { createdAt: "asc" } }, { id: "asc" }],
  });

  let restante = cantidadNecesaria;
  const consumos: { loteId: string; cantidad: number; costoUnitario: number | null }[] = [];

  for (const lote of lotes) {
    if (restante <= 0) break;
    const tomar = Math.min(lote.cantidadDisponible, restante);
    await tx.ajusteInventarioItem.update({
      where: { id: lote.id },
      data: { cantidadDisponible: { decrement: tomar } },
    });
    consumos.push({ loteId: lote.id, cantidad: tomar, costoUnitario: lote.precioCompra });
    restante -= tomar;
  }

  if (restante > 0) {
    // No debería pasar si el stock cacheado en Producto está sincronizado,
    // pero se protege por si los lotes quedaron desalineados.
    throw new Error("No hay suficientes lotes de inventario disponibles para completar la venta.");
  }

  return consumos;
}

async function resolverIglesiaVenta(
  sesion: Awaited<ReturnType<typeof requireSesion>>,
  iglesiaIdSolicitada?: string,
) {
  if (sesion.esSuperAdmin) {
    if (!iglesiaIdSolicitada) throw new Error("Debes seleccionar una iglesia.");
    return iglesiaIdSolicitada;
  }
  if (!sesion.iglesiaId) throw new Error("Tu usuario no tiene una iglesia asignada.");
  return sesion.iglesiaId;
}

export async function registrarVenta(
  items: ItemVenta[],
  metodoPago: MetodoPago,
  iglesiaIdSolicitada?: string,
): Promise<ResultadoVenta> {
  const sesion = await requireSesion();
  if (!puedeUsarPuntoDeVenta(sesion)) return { error: "No tienes permiso para vender." };

  let iglesiaId: string;
  try {
    iglesiaId = await resolverIglesiaVenta(sesion, iglesiaIdSolicitada);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Iglesia inválida." };
  }

  if (!items.length) return { error: "Agrega al menos un producto o servicio." };

  const productos = await prisma.producto.findMany({
    where: { id: { in: items.map((i) => i.productoId) }, iglesiaId, activo: true },
  });
  const productosPorId = new Map(productos.map((p) => [p.id, p]));

  const detalles: {
    productoId: string;
    nombreProducto: string;
    precioUnitario: number;
    cantidad: number;
    subtotal: number;
    comentario: string | null;
  }[] = [];
  let total = 0;

  for (const item of items) {
    const producto = productosPorId.get(item.productoId);
    if (!producto) {
      return { error: "Alguno de los productos ya no está disponible. Actualiza la página e intenta de nuevo." };
    }
    const comentario = item.comentario?.trim() || null;
    if (producto.requiereComentario && !comentario) {
      return { error: `"${producto.nombre}" requiere un comentario antes de venderse.` };
    }
    const cantidad = Math.max(1, Math.floor(item.cantidad));
    if (producto.tipo === "PRODUCTO" && (producto.stock ?? 0) < cantidad) {
      return {
        error: `No hay suficiente stock de "${producto.nombre}" (disponible: ${producto.stock ?? 0}).`,
      };
    }
    const subtotal = producto.precio * cantidad;
    total += subtotal;
    detalles.push({
      productoId: producto.id,
      nombreProducto: producto.nombre,
      precioUnitario: producto.precio,
      cantidad,
      subtotal,
      comentario,
    });
  }

  const detallesProducto = detalles.filter(
    (d) => productosPorId.get(d.productoId)?.tipo === "PRODUCTO",
  );

  try {
    const venta = await prisma.$transaction(async (tx) => {
      for (const detalle of detallesProducto) {
        const actualizados = await tx.producto.updateMany({
          where: { id: detalle.productoId, stock: { gte: detalle.cantidad } },
          data: { stock: { decrement: detalle.cantidad } },
        });
        if (actualizados.count === 0) {
          throw new Error(`No hay suficiente stock de "${detalle.nombreProducto}".`);
        }
      }

      const creada = await tx.venta.create({
        data: {
          iglesiaId,
          total,
          metodo: metodoPago,
          vendidoPorId: sesion.id,
          items: { create: detalles },
        },
        include: { items: true },
      });

      // Los renglones se crean en el mismo orden que `detalles`, así que se
      // pueden emparejar por índice para saber qué VentaItem corresponde a
      // cada producto vendido.
      for (let i = 0; i < detalles.length; i++) {
        const detalle = detalles[i];
        const esProducto = productosPorId.get(detalle.productoId)?.tipo === "PRODUCTO";
        if (!esProducto) continue;

        const consumos = await consumirLotesFifo(tx, detalle.productoId, detalle.cantidad);
        await tx.ventaItemLote.createMany({
          data: consumos.map((c) => ({
            ventaItemId: creada.items[i].id,
            loteId: c.loteId,
            cantidad: c.cantidad,
            costoUnitario: c.costoUnitario,
          })),
        });
      }

      return creada;
    });

    revalidatePath("/punto-de-venta");
    return { ok: true, ventaId: venta.id, total };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo registrar la venta." };
  }
}
