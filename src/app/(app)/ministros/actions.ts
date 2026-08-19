"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSesion, puedeAdministrarMinistros } from "@/lib/authz";

export type EstadoFormulario = { error: string } | null;

function limpiar(valor: FormDataEntryValue | null) {
  if (typeof valor !== "string") return null;
  const v = valor.trim();
  return v === "" ? null : v;
}

async function resolverIglesiaId(
  sesion: Awaited<ReturnType<typeof requireSesion>>,
  formData: FormData,
) {
  if (sesion.esSuperAdmin) {
    const iglesiaId = formData.get("iglesiaId");
    if (!iglesiaId || typeof iglesiaId !== "string") {
      throw new Error("Selecciona una iglesia.");
    }
    return iglesiaId;
  }
  if (!sesion.iglesiaId) throw new Error("Tu usuario no tiene una iglesia asignada.");
  return sesion.iglesiaId;
}

export async function crearMinistro(
  _prevState: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const sesion = await requireSesion();
  if (!puedeAdministrarMinistros(sesion)) return { error: "No tienes permiso para esto." };

  const nombre = (formData.get("nombre") as string)?.trim();
  if (!nombre) return { error: "El nombre es obligatorio." };

  let iglesiaId: string;
  try {
    iglesiaId = await resolverIglesiaId(sesion, formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Iglesia inválida." };
  }

  await prisma.ministro.create({
    data: {
      nombre,
      titulo: limpiar(formData.get("titulo")),
      telefono: limpiar(formData.get("telefono")),
      email: limpiar(formData.get("email")),
      direccion: limpiar(formData.get("direccion")),
      iglesiaId,
    },
  });

  revalidatePath("/ministros");
  redirect("/ministros");
}

export async function actualizarMinistro(
  _prevState: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const sesion = await requireSesion();
  if (!puedeAdministrarMinistros(sesion)) return { error: "No tienes permiso para esto." };

  const ministroId = formData.get("ministroId") as string;
  const ministro = await prisma.ministro.findUnique({ where: { id: ministroId } });
  if (!ministro) return { error: "Sacerdote no encontrado." };
  if (!sesion.esSuperAdmin && ministro.iglesiaId !== sesion.iglesiaId) {
    return { error: "No tienes acceso a este registro." };
  }

  const nombre = (formData.get("nombre") as string)?.trim();
  if (!nombre) return { error: "El nombre es obligatorio." };

  await prisma.ministro.update({
    where: { id: ministroId },
    data: {
      nombre,
      titulo: limpiar(formData.get("titulo")),
      telefono: limpiar(formData.get("telefono")),
      email: limpiar(formData.get("email")),
      direccion: limpiar(formData.get("direccion")),
    },
  });

  revalidatePath("/ministros");
  redirect("/ministros");
}

export async function cambiarEstadoMinistro(ministroId: string, activo: boolean) {
  const sesion = await requireSesion();
  if (!puedeAdministrarMinistros(sesion)) throw new Error("No tienes permiso para esto.");

  const ministro = await prisma.ministro.findUnique({ where: { id: ministroId } });
  if (!ministro) throw new Error("Sacerdote no encontrado.");
  if (!sesion.esSuperAdmin && ministro.iglesiaId !== sesion.iglesiaId) {
    throw new Error("No tienes acceso a este registro.");
  }

  await prisma.ministro.update({ where: { id: ministroId }, data: { activo } });
  revalidatePath("/ministros");
}
