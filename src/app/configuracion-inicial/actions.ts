"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export type EstadoFormulario = { error: string } | null;

/** Mínimo de la contraseña, igual que al dar de alta usuarios. */
const LARGO_MINIMO = 8;

/**
 * Crea el primer SUPERADMIN del sistema.
 *
 * Esta acción es pública por necesidad —no hay con qué autenticarse todavía—
 * así que su única defensa es que el sistema esté vacío. La comprobación va
 * dentro de una transacción: si dos peticiones llegaran a la vez, la segunda
 * ve el usuario que creó la primera y se rechaza.
 */
export async function crearPrimerSuperadmin(
  _prevState: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const nombre = (formData.get("nombre") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const confirmacion = formData.get("confirmacion") as string;

  if (!nombre || !email || !password) {
    return { error: "Completa todos los campos." };
  }
  if (password.length < LARGO_MINIMO) {
    return { error: `La contraseña debe tener al menos ${LARGO_MINIMO} caracteres.` };
  }
  if (password !== confirmacion) {
    return { error: "Las dos contraseñas no coinciden." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await prisma.$transaction(async (tx) => {
      if ((await tx.usuario.count()) > 0) {
        throw new Error("YA_CONFIGURADO");
      }
      await tx.usuario.create({
        data: {
          nombre,
          email,
          passwordHash,
          esSuperAdmin: true,
          activo: true,
          // El superadmin elige su propia contraseña aquí, no es temporal.
          debeCambiarPassword: false,
        },
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "YA_CONFIGURADO") {
      return { error: "El sistema ya tiene usuarios. Inicia sesión." };
    }
    throw e;
  }

  redirect("/login?motivo=configurado");
}
