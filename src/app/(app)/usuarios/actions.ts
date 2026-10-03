"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { estadoLicencias, MENSAJE_SIN_CUPO } from "@/lib/licencias";
import { requireSesion, puedeAdministrarUsuarios, puedeAsignarRol } from "@/lib/authz";

const MENSAJE_SESION_INVALIDA =
  "Tu sesión quedó desactualizada. Cierra sesión (arriba a la derecha) y vuelve a iniciarla.";

function esErrorDeUsuarioInvalido(e: unknown) {
  const codigo = e && typeof e === "object" && "code" in e ? (e as { code?: string }).code : null;
  return codigo === "P2003" || codigo === "P2025";
}

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
    // Antes bastaba con que el rol existiera: el administrador de una parroquia
    // podía asignar un rol de otra, con los permisos que esa otra le hubiera puesto.
    if (!puedeAsignarRol(sesion, rol)) {
      return { error: "Ese rol no está disponible para tu parroquia." };
    }

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

  if (!(await estadoLicencias()).hayCupo) return { error: MENSAJE_SIN_CUPO };

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.usuario.create({
    data: {
      nombre,
      email,
      passwordHash,
      esSuperAdmin,
      rolId: esSuperAdmin ? null : rolId,
      iglesiaId,
      // La contraseña del alta es temporal: el usuario elige la suya al entrar.
      debeCambiarPassword: true,
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

  // Reactivar vuelve a ocupar un asiento; sin esta comprobación se evadiría el
  // tope desactivando, creando y reactivando.
  if (activo && !usuario.activo && !(await estadoLicencias()).hayCupo) {
    throw new Error(MENSAJE_SIN_CUPO);
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
  if (!puedeAsignarRol(sesion, rol)) {
    throw new Error("Ese rol no está disponible para tu parroquia.");
  }

  await prisma.usuario.update({ where: { id: usuarioId }, data: { rolId } });
  revalidatePath("/usuarios");
}

/**
 * Restablece la contraseña de un usuario a una temporal que el administrador
 * le entrega. El usuario tendrá que cambiarla al entrar, y el restablecimiento
 * levanta cualquier bloqueo por intentos fallidos.
 */
export async function restablecerPassword(usuarioId: string, passwordTemporal: string) {
  const sesion = await requireSesion();
  if (!puedeAdministrarUsuarios(sesion)) throw new Error("No tienes permiso.");

  if (!passwordTemporal || passwordTemporal.length < 8) {
    throw new Error("La contraseña temporal debe tener al menos 8 caracteres.");
  }

  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario) throw new Error("Usuario no encontrado.");
  if (!sesion.esSuperAdmin && usuario.iglesiaId !== sesion.iglesiaId) {
    throw new Error("No tienes acceso a este usuario.");
  }
  // Un SUPERADMIN solo puede ser restablecido por otro SUPERADMIN.
  if (usuario.esSuperAdmin && !sesion.esSuperAdmin) {
    throw new Error("No puedes restablecer la contraseña de un SUPERADMIN.");
  }

  await prisma.usuario.update({
    where: { id: usuarioId },
    data: {
      passwordHash: await bcrypt.hash(passwordTemporal, 10),
      debeCambiarPassword: true,
      intentosFallidos: 0,
      bloqueadoHasta: null,
    },
  });

  revalidatePath("/usuarios");
}

/**
 * Edita los datos de un usuario: nombre, correo, rol y, para el SUPERADMIN,
 * su parroquia.
 *
 * La contraseña no se toca aquí: para eso está "Restablecer contraseña", que
 * además la marca como temporal. Mezclarlas haría que editar un apellido
 * pudiera cambiar la contraseña de alguien sin querer.
 */
export async function actualizarUsuario(
  _prevState: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const sesion = await requireSesion();
  if (!puedeAdministrarUsuarios(sesion)) return { error: "No tienes permiso." };

  const usuarioId = formData.get("usuarioId");
  if (typeof usuarioId !== "string") return { error: "Usuario inválido." };

  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario) return { error: "Usuario no encontrado." };
  if (!sesion.esSuperAdmin && usuario.iglesiaId !== sesion.iglesiaId) {
    return { error: "No tienes acceso a este usuario." };
  }
  // Un administrador de parroquia no edita a quien está por encima de él.
  if (usuario.esSuperAdmin && !sesion.esSuperAdmin) {
    return { error: "No puedes editar a un SUPERADMIN." };
  }

  const nombre = (formData.get("nombre") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!nombre || !email) return { error: "El nombre y el correo son obligatorios." };

  const otro = await prisma.usuario.findUnique({ where: { email } });
  if (otro && otro.id !== usuarioId) {
    return { error: "Ya existe otro usuario con ese correo." };
  }

  const datos: Prisma.UsuarioUpdateInput = { nombre, email };

  if (usuario.esSuperAdmin) {
    // Un SUPERADMIN no lleva rol ni parroquia: los ve todos.
    datos.rol = { disconnect: true };
    datos.iglesia = { disconnect: true };
  } else {
    const rolId = (formData.get("rolId") as string) || null;
    if (!rolId) return { error: "Selecciona un rol para este usuario." };
    const rol = await prisma.rol.findUnique({ where: { id: rolId } });
    if (!rol) return { error: "El rol seleccionado no es válido." };
    if (!puedeAsignarRol(sesion, rol)) {
      return { error: "Ese rol no está disponible para tu parroquia." };
    }
    datos.rol = { connect: { id: rolId } };

    if (sesion.esSuperAdmin) {
      const iglesiaId = formData.get("iglesiaId");
      if (typeof iglesiaId !== "string" || !iglesiaId) {
        return { error: "Selecciona una iglesia para este usuario." };
      }
      datos.iglesia = { connect: { id: iglesiaId } };
    }
    // Un administrador de parroquia no puede mover a nadie fuera de la suya:
    // simplemente no se toca el campo.
  }

  try {
    await prisma.usuario.update({ where: { id: usuarioId }, data: datos });
  } catch (e) {
    if (esErrorDeUsuarioInvalido(e)) return { error: MENSAJE_SESION_INVALIDA };
    throw e;
  }

  revalidatePath("/usuarios");
  redirect("/usuarios");
}
