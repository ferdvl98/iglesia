"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSesion, puedeAdministrarCatalogo } from "@/lib/authz";

export type PartidaAjuste = {
  productoId: string;
  cantidad: number;
  precioCompra?: number | null;
  precioVenta?: number | null;
};

export type ResultadoAjuste = { error: string } | { ok: true; ajusteId: string };

export async function registrarAjusteInventario(
  iglesiaId: string,
  fecha: string,
  comentario: string | null,
  partidas: PartidaAjuste[],
): Promise<ResultadoAjuste> {
  const sesion = await requireSesion();
  if (!puedeAdministrarCatalogo(sesion)) return { error: "No tienes permiso para esto." };
  if (!sesion.esSuperAdmin && iglesiaId !== sesion.iglesiaId) {
    return { error: "No tienes acceso a esa iglesia." };
  }
  if (!iglesiaId) return { error: "Debes seleccionar la iglesia a la que se agregará el stock." };
  const fechaLote = new Date(fecha);
  if (Number.isNaN(fechaLote.getTime())) return { error: "La fecha del lote no es válida." };
  if (!partidas.length) return { error: "Agrega al menos un producto al ajuste." };

  const productos = await prisma.producto.findMany({
    where: { id: { in: partidas.map((p) => p.productoId) }, iglesiaId, tipo: "PRODUCTO" },
  });
  const productosPorId = new Map(productos.map((p) => [p.id, p]));

  for (const partida of partidas) {
    const producto = productosPorId.get(partida.productoId);
    if (!producto) {
      return {
        error: "Alguno de los productos seleccionados no es válido para esta iglesia o no es de tipo Producto.",
      };
    }
    if (!Number.isInteger(partida.cantidad) || partida.cantidad < 1) {
      return { error: `La cantidad a agregar de "${producto.nombre}" debe ser mayor a 0.` };
    }
    if (partida.precioCompra != null && (Number.isNaN(partida.precioCompra) || partida.precioCompra < 0)) {
      return { error: `El precio de compra de "${producto.nombre}" no es válido.` };
    }
    if (partida.precioVenta != null && (Number.isNaN(partida.precioVenta) || partida.precioVenta < 0)) {
      return { error: `El precio de venta de "${producto.nombre}" no es válido.` };
    }
  }

  const ajuste = await prisma.$transaction(async (tx) => {
    const creado = await tx.ajusteInventario.create({
      data: {
        iglesiaId,
        fecha: fechaLote,
        comentario,
        realizadoPorId: sesion.id,
        items: {
          create: partidas.map((p) => ({
            productoId: p.productoId,
            cantidad: p.cantidad,
            cantidadDisponible: p.cantidad,
            precioCompra: p.precioCompra ?? null,
            precioVenta: p.precioVenta ?? null,
          })),
        },
      },
    });

    for (const partida of partidas) {
      await tx.producto.update({
        where: { id: partida.productoId },
        data: {
          stock: { increment: partida.cantidad },
          ...(partida.precioVenta != null ? { precio: partida.precioVenta } : {}),
        },
      });
    }

    return creado;
  });

  revalidatePath("/catalogo");
  revalidatePath("/catalogo/ajuste-inventario");
  revalidatePath("/punto-de-venta");
  return { ok: true, ajusteId: ajuste.id };
}
