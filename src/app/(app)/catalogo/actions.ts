"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSesion, puedeAdministrarCatalogo } from "@/lib/authz";

export type EstadoFormulario = { error: string } | { ok: true } | null;

function precioValido(valor: FormDataEntryValue | null) {
  if (typeof valor !== "string" || valor.trim() === "") return undefined;
  const n = Number(valor);
  if (Number.isNaN(n) || n < 0) return undefined;
  return n;
}

function enteroValido(valor: FormDataEntryValue | null) {
  if (typeof valor !== "string" || valor.trim() === "") return undefined;
  const n = Number(valor);
  if (!Number.isInteger(n) || n < 0) return undefined;
  return n;
}

async function resolverIglesiaId(sesion: Awaited<ReturnType<typeof requireSesion>>, formData: FormData) {
  if (sesion.esSuperAdmin) {
    const iglesiaId = formData.get("iglesiaId");
    if (!iglesiaId || typeof iglesiaId !== "string") {
      throw new Error("Debes seleccionar una iglesia");
    }
    return iglesiaId;
  }
  if (!sesion.iglesiaId) throw new Error("Tu usuario no tiene una iglesia asignada");
  return sesion.iglesiaId;
}

export async function crearProducto(
  _prevState: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const sesion = await requireSesion();
  if (!puedeAdministrarCatalogo(sesion)) return { error: "No tienes permiso para esto." };

  let iglesiaId: string;
  try {
    iglesiaId = await resolverIglesiaId(sesion, formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Iglesia inválida." };
  }

  const nombre = (formData.get("nombre") as string)?.trim();
  if (!nombre) return { error: "El nombre es obligatorio." };

  const precio = precioValido(formData.get("precio"));
  if (precio === undefined) return { error: "El precio debe ser un número válido." };

  const descripcion = (formData.get("descripcion") as string)?.trim() || null;
  const codigo = (formData.get("codigo") as string)?.trim() || null;
  const requiereComentario = formData.get("requiereComentario") === "on";

  const tipoTexto = formData.get("tipo");
  const tipo = tipoTexto === "PRODUCTO" ? "PRODUCTO" : "SERVICIO";
  let stock: number | null = null;
  if (tipo === "PRODUCTO") {
    const stockCapturado = enteroValido(formData.get("stock"));
    if (stockCapturado === undefined) {
      return { error: "El stock inicial debe ser un número entero válido (0 o más)." };
    }
    stock = stockCapturado;
  }

  try {
    await prisma.producto.create({
      data: {
        iglesiaId,
        nombre,
        descripcion,
        precio,
        codigo,
        requiereComentario,
        tipo,
        stock,
        // El stock inicial también se registra como su propio lote, para que
        // el consumo FIFO en ventas tenga siempre de dónde tomar existencias.
        ...(tipo === "PRODUCTO" && stock && stock > 0
          ? {
              ajustesInventarioItems: {
                create: [
                  {
                    cantidad: stock,
                    cantidadDisponible: stock,
                    precioVenta: precio,
                    ajuste: {
                      create: {
                        iglesiaId,
                        comentario: "Stock inicial al crear el producto",
                        realizadoPorId: sesion.id,
                      },
                    },
                  },
                ],
              },
            }
          : {}),
      },
    });
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2002") {
      return { error: "Ya existe un producto con ese código en esta iglesia." };
    }
    throw e;
  }

  revalidatePath("/catalogo");
  revalidatePath("/punto-de-venta");
  redirect(sesion.esSuperAdmin ? `/catalogo?iglesiaId=${iglesiaId}` : "/catalogo");
}

export async function actualizarProducto(
  _prevState: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const sesion = await requireSesion();
  if (!puedeAdministrarCatalogo(sesion)) return { error: "No tienes permiso para esto." };

  const productoId = formData.get("productoId");
  if (typeof productoId !== "string") return { error: "Producto inválido." };

  const producto = await prisma.producto.findUnique({ where: { id: productoId } });
  if (!producto) return { error: "Producto no encontrado." };
  if (!sesion.esSuperAdmin && producto.iglesiaId !== sesion.iglesiaId) {
    return { error: "No tienes acceso a este producto." };
  }

  const nombre = (formData.get("nombre") as string)?.trim();
  if (!nombre) return { error: "El nombre es obligatorio." };

  const precio = precioValido(formData.get("precio"));
  if (precio === undefined) return { error: "El precio debe ser un número válido." };

  const descripcion = (formData.get("descripcion") as string)?.trim() || null;
  const codigo = (formData.get("codigo") as string)?.trim() || null;
  const requiereComentario = formData.get("requiereComentario") === "on";
  const activo = formData.get("activo") === "on";

  // El tipo (Producto/Servicio) es fijo desde la creación y no se edita aquí.
  // El stock tampoco: solo cambia al vender o mediante un ajuste de inventario.

  try {
    await prisma.producto.update({
      where: { id: productoId },
      data: { nombre, descripcion, precio, codigo, requiereComentario, activo },
    });
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2002") {
      return { error: "Ya existe un producto con ese código en esta iglesia." };
    }
    throw e;
  }

  revalidatePath("/catalogo");
  revalidatePath("/punto-de-venta");
  return { ok: true };
}
