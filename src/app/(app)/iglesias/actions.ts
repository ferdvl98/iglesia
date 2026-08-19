"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSesion, puedeAdministrarIglesias } from "@/lib/authz";

export type EstadoFormulario = { error: string } | null;

export async function crearIglesia(
  _prevState: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const sesion = await requireSesion();
  if (!puedeAdministrarIglesias(sesion)) return { error: "No tienes permiso." };

  const nombre = (formData.get("nombre") as string)?.trim();
  if (!nombre) return { error: "El nombre es obligatorio." };

  const iglesia = await prisma.iglesia.create({
    data: {
      nombre,
      diocesis: (formData.get("diocesis") as string) || null,
      direccion: (formData.get("direccion") as string) || null,
      ciudad: (formData.get("ciudad") as string) || null,
      estado: (formData.get("estado") as string) || null,
      telefono: (formData.get("telefono") as string) || null,
      email: (formData.get("email") as string) || null,
    },
  });

  revalidatePath("/iglesias");
  redirect(`/iglesias/${iglesia.id}`);
}

export async function actualizarIglesia(
  _prevState: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const sesion = await requireSesion();
  if (!puedeAdministrarIglesias(sesion)) return { error: "No tienes permiso." };

  const iglesiaId = formData.get("iglesiaId");
  if (typeof iglesiaId !== "string") return { error: "Iglesia inválida." };

  const nombre = (formData.get("nombre") as string)?.trim();
  if (!nombre) return { error: "El nombre es obligatorio." };

  await prisma.iglesia.update({
    where: { id: iglesiaId },
    data: {
      nombre,
      diocesis: (formData.get("diocesis") as string) || null,
      direccion: (formData.get("direccion") as string) || null,
      ciudad: (formData.get("ciudad") as string) || null,
      estado: (formData.get("estado") as string) || null,
      telefono: (formData.get("telefono") as string) || null,
      email: (formData.get("email") as string) || null,
      activa: formData.get("activa") === "on",
    },
  });

  revalidatePath("/iglesias");
  revalidatePath(`/iglesias/${iglesiaId}`);
  return null;
}
