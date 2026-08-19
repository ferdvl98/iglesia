"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSesion, puedeAdministrarUsuarios } from "@/lib/authz";

export type EstadoFormulario = { error: string } | null;

export async function crearUsuario(
  _prevState: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const sesion = await requireSesion();
  if (!puedeAdministrarUsuarios(sesion)) return { error: "No tienes permiso." };

  const nombre = (formData.get("nombre") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const esSuperAdmin = sesion.esSuperAdmin && formData.get("esSuperAdmin") === "on";
  const rolId = (formData.get("rolId") as string) || null;

  if (!nombre || !email || !password) return { error: "Todos los campos son obligatorios." };
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };

  let iglesiaId: string | null = null;
  if (!esSuperAdmin) {
    if (!rolId) return { error: "Selecciona un rol para este usuario." };
    const rol = await prisma.rol.findUnique({ where: { id: rolId } });
    if (!rol) return { error: "El rol seleccionado no es válido." };

    if (sesion.esSuperAdmin) {
      if (!formData.get("iglesiaId")) return { error: "Selecciona una iglesia para este usuario." };
      iglesiaId = formData.get("iglesiaId") as string;
    } else {
      if (!sesion.iglesiaId) return { error: "Tu usuario no tiene una iglesia asignada." };
      iglesiaId = sesion.iglesiaId;
    }
  }

  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente) return { error: "Ya existe un usuario con ese correo." };

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.usuario.create({
    data: {
      nombre,
      email,
      passwordHash,
      esSuperAdmin,
      rolId: esSuperAdmin ? null : rolId,
      iglesiaId,
    },
  });

  revalidatePath("/usuarios");
  redirect("/usuarios");
}

export async function cambiarEstadoUsuario(usuarioId: string, activo: boolean) {
  const sesion = await requireSesion();
  if (!puedeAdministrarUsuarios(sesion)) throw new Error("No tienes permiso.");

  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario) throw new Error("Usuario no encontrado.");
  if (!sesion.esSuperAdmin && usuario.iglesiaId !== sesion.iglesiaId) {
    throw new Error("No tienes acceso a este usuario.");
  }

  await prisma.usuario.update({ where: { id: usuarioId }, data: { activo } });
  revalidatePath("/usuarios");
}

export async function cambiarRolUsuario(usuarioId: string, rolId: string) {
  const sesion = await requireSesion();
  if (!puedeAdministrarUsuarios(sesion)) throw new Error("No tienes permiso.");

  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario) throw new Error("Usuario no encontrado.");
  if (usuario.esSuperAdmin) throw new Error("No puedes cambiar el rol de un SUPERADMIN.");
  if (!sesion.esSuperAdmin && usuario.iglesiaId !== sesion.iglesiaId) {
    throw new Error("No tienes acceso a este usuario.");
  }

  const rol = await prisma.rol.findUnique({ where: { id: rolId } });
  if (!rol) throw new Error("El rol seleccionado no es válido.");

  await prisma.usuario.update({ where: { id: usuarioId }, data: { rolId } });
  revalidatePath("/usuarios");
}
