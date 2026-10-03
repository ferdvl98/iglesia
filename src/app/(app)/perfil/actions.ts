"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSesion } from "@/lib/authz";

export type EstadoFormulario = { error: string } | { ok: true } | null;

/**
 * Cada quien edita sus propios datos: nombre y correo.
 *
 * No toca rol ni parroquia —eso lo decide quien administra usuarios, no uno
 * mismo— ni la contraseña, que tiene su propia pantalla porque exige la
 * actual.
 */
export async function actualizarMiPerfil(
  _prevState: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const sesion = await requireSesion();

  const nombre = (formData.get("nombre") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!nombre || !email) return { error: "El nombre y el correo son obligatorios." };

  const otro = await prisma.usuario.findUnique({ where: { email } });
  if (otro && otro.id !== sesion.id) {
    return { error: "Ya existe otro usuario con ese correo." };
  }

  await prisma.usuario.update({ where: { id: sesion.id }, data: { nombre, email } });

  revalidatePath("/perfil");
  revalidatePath("/usuarios");
  return { ok: true };
}
