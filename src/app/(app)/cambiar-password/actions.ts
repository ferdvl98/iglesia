"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSesion } from "@/lib/authz";

export type EstadoFormulario = { error: string } | null;

// No se exporta: en un archivo "use server" solo pueden exportarse funciones async.
const LARGO_MINIMO = 8;

/** Cambia la contraseña del usuario de la sesión. Exige la actual. */
export async function cambiarMiPassword(
  _prevState: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const sesion = await requireSesion();

  const actual = formData.get("actual") as string;
  const nueva = formData.get("nueva") as string;
  const confirmacion = formData.get("confirmacion") as string;

  if (!actual || !nueva) return { error: "Completa todos los campos." };
  if (nueva.length < LARGO_MINIMO) {
    return { error: `La contraseña nueva debe tener al menos ${LARGO_MINIMO} caracteres.` };
  }
  if (nueva !== confirmacion) return { error: "Las dos contraseñas nuevas no coinciden." };

  const usuario = await prisma.usuario.findUnique({ where: { id: sesion.id } });
  if (!usuario) return { error: "Tu usuario ya no existe." };

  if (!(await bcrypt.compare(actual, usuario.passwordHash))) {
    return { error: "La contraseña actual no es correcta." };
  }
  if (await bcrypt.compare(nueva, usuario.passwordHash)) {
    return { error: "La contraseña nueva debe ser distinta de la actual." };
  }

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      passwordHash: await bcrypt.hash(nueva, 10),
      debeCambiarPassword: false,
      // Un cambio de contraseña limpia cualquier bloqueo por intentos fallidos.
      intentosFallidos: 0,
      bloqueadoHasta: null,
    },
  });

  redirect("/dashboard?password=cambiada");
}
