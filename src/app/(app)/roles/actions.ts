"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSesion, puedeAdministrarRoles } from "@/lib/authz";
import type { Permiso } from "@prisma/client";

const PERMISOS_VALIDOS: Permiso[] = [
  "REGISTRAR_ACTAS",
  "CONSULTAR_ACTAS",
  "PUNTO_DE_VENTA",
  "ADMINISTRAR_CATALOGO",
  "CONFIGURAR",
];

export type EstadoFormulario = { error: string } | null;

function parsearPermisos(formData: FormData): Permiso[] {
  return PERMISOS_VALIDOS.filter((p) => formData.get(`permiso_${p}`) === "on");
}

export async function crearRol(
  _prevState: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const sesion = await requireSesion();
  if (!puedeAdministrarRoles(sesion)) return { error: "No tienes permiso para esto." };

  const nombre = (formData.get("nombre") as string)?.trim();
  if (!nombre) return { error: "El nombre del rol es obligatorio." };

  const existente = await prisma.rol.findUnique({ where: { nombre } });
  if (existente) return { error: "Ya existe un rol con ese nombre." };

  const permisos = parsearPermisos(formData);

  await prisma.rol.create({ data: { nombre, permisos } });

  revalidatePath("/roles");
  redirect("/roles");
}

export async function actualizarRol(
  _prevState: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const sesion = await requireSesion();
  if (!puedeAdministrarRoles(sesion)) return { error: "No tienes permiso para esto." };

  const rolId = formData.get("rolId") as string;
  const rol = await prisma.rol.findUnique({ where: { id: rolId } });
  if (!rol) return { error: "Rol no encontrado." };
  if (rol.esAdministrador) {
    return { error: "El rol Administrador siempre tiene todos los permisos y no se puede modificar." };
  }

  const nombre = (formData.get("nombre") as string)?.trim();
  if (!nombre) return { error: "El nombre del rol es obligatorio." };

  const existente = await prisma.rol.findUnique({ where: { nombre } });
  if (existente && existente.id !== rolId) return { error: "Ya existe un rol con ese nombre." };

  const permisos = parsearPermisos(formData);

  await prisma.rol.update({ where: { id: rolId }, data: { nombre, permisos } });

  revalidatePath("/roles");
  redirect("/roles");
}

export async function eliminarRol(rolId: string) {
  const sesion = await requireSesion();
  if (!puedeAdministrarRoles(sesion)) throw new Error("No tienes permiso para esto.");

  const rol = await prisma.rol.findUnique({ where: { id: rolId }, include: { usuarios: true } });
  if (!rol) throw new Error("Rol no encontrado.");
  if (rol.esAdministrador) throw new Error("El rol Administrador no se puede eliminar.");
  if (rol.usuarios.length > 0) {
    throw new Error("No puedes eliminar un rol que tiene usuarios asignados. Reasígnalos primero.");
  }

  await prisma.rol.delete({ where: { id: rolId } });
  revalidatePath("/roles");
}
