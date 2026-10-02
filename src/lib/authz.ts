import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Permiso } from "@prisma/client";

/**
 * Destino del usuario cuyo token ya no corresponde a una cuenta válida.
 * El middleware deja pasar /login con este parámetro aunque la cookie siga
 * presente; sin esa excepción se produciría un bucle de redirecciones.
 */
export const RUTA_SESION_INVALIDA = "/login?motivo=sesion";

export type SesionActiva = {
  id: string;
  esSuperAdmin: boolean;
  esAdministrador: boolean;
  rolId: string | null;
  rolNombre: string | null;
  permisos: Permiso[];
  iglesiaId: string | null;
  iglesiaNombre: string | null;
  nombre: string | null;
  email: string | null;
};

/**
 * Lee la sesión y la revalida contra la base de datos.
 *
 * El JWT de NextAuth congela rol, permisos e iglesia tal como estaban al
 * iniciar sesión y nunca se refresca. Sin esta lectura, desactivar a un
 * usuario, quitarle permisos, cambiarlo de rol o moverlo de parroquia no
 * surtiría efecto hasta que su token expirara. `cache` garantiza una sola
 * consulta por petición aunque se llame desde el layout y la página.
 */
const cargarSesion = cache(async (): Promise<SesionActiva | null> => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  const usuario = await prisma.usuario.findUnique({
    where: { id },
    include: { rol: true, iglesia: true },
  });
  if (!usuario || !usuario.activo) return null;

  return {
    id: usuario.id,
    esSuperAdmin: usuario.esSuperAdmin,
    esAdministrador: usuario.esSuperAdmin || (usuario.rol?.esAdministrador ?? false),
    rolId: usuario.rolId,
    rolNombre: usuario.rol?.nombre ?? null,
    permisos: usuario.rol?.permisos ?? [],
    iglesiaId: usuario.iglesiaId,
    iglesiaNombre: usuario.iglesia?.nombre ?? null,
    nombre: usuario.nombre,
    email: usuario.email,
  };
});

/** Para rutas de API, que responden 401 en vez de redirigir. */
export async function obtenerSesion(): Promise<SesionActiva | null> {
  return cargarSesion();
}

export async function requireSesion(): Promise<SesionActiva> {
  const sesion = await cargarSesion();
  if (!sesion) redirect(RUTA_SESION_INVALIDA);
  return sesion;
}

function tienePermiso(sesion: SesionActiva, permiso: Permiso) {
  // El rol Administrador (fijo) siempre tiene todos los permisos, sin
  // depender de que su lista de permisos guardada esté sincronizada con
  // los que existan hoy en el enum Permiso.
  return sesion.esSuperAdmin || sesion.esAdministrador || sesion.permisos.includes(permiso);
}

export function puedeEscribir(sesion: SesionActiva) {
  return tienePermiso(sesion, "REGISTRAR_ACTAS");
}

export function puedeConsultarActas(sesion: SesionActiva) {
  return tienePermiso(sesion, "CONSULTAR_ACTAS");
}

export function puedeUsarPuntoDeVenta(sesion: SesionActiva) {
  return tienePermiso(sesion, "PUNTO_DE_VENTA");
}

/** Reportes de ingresos del dashboard y sus descargas (PDF/Excel). */
export function puedeVerIngresos(sesion: SesionActiva) {
  return tienePermiso(sesion, "VER_INGRESOS");
}

export function puedeConfigurar(sesion: SesionActiva) {
  return tienePermiso(sesion, "CONFIGURAR");
}

/** El catálogo de productos/servicios (incl. ajuste y transferencia de inventario). */
export function puedeAdministrarCatalogo(sesion: SesionActiva) {
  return tienePermiso(sesion, "ADMINISTRAR_CATALOGO");
}

/** Catálogo de sacerdotes/ministros usado al registrar actas. */
export function puedeAdministrarMinistros(sesion: SesionActiva) {
  return tienePermiso(sesion, "ADMINISTRAR_MINISTROS");
}

/** Administrar iglesias es un nivel de diócesis, no delegable por roles. */
export function puedeAdministrarIglesias(sesion: SesionActiva) {
  return sesion.esSuperAdmin;
}

/** Crear/editar usuarios y crear/asignar/editar roles solo lo puede hacer
 * el rol Administrador (fijo) o SUPERADMIN. No es un permiso delegable. */
export function puedeAdministrarUsuarios(sesion: SesionActiva) {
  return sesion.esSuperAdmin || sesion.esAdministrador;
}

export function puedeAdministrarRoles(sesion: SesionActiva) {
  return sesion.esSuperAdmin || sesion.esAdministrador;
}

/**
 * Qué roles puede ver un usuario: los de su parroquia más las plantillas
 * globales de la diócesis. El SUPERADMIN los ve todos.
 */
export function filtroRoles(sesion: SesionActiva) {
  if (sesion.esSuperAdmin) return {};
  return { OR: [{ iglesiaId: sesion.iglesiaId }, { iglesiaId: null }] };
}

/**
 * Si puede *modificar* ese rol (editarlo, borrarlo o asignárselo a alguien).
 * Las plantillas globales son de solo lectura fuera del SUPERADMIN: antes, el
 * administrador de una parroquia podía editar el rol que usaba otra.
 */
export function puedeEditarRol(
  sesion: SesionActiva,
  rol: { iglesiaId: string | null },
) {
  if (sesion.esSuperAdmin) return true;
  return rol.iglesiaId !== null && rol.iglesiaId === sesion.iglesiaId;
}

/** Si puede asignar ese rol a un usuario (incluye las plantillas globales). */
export function puedeAsignarRol(
  sesion: SesionActiva,
  rol: { iglesiaId: string | null },
) {
  if (sesion.esSuperAdmin) return true;
  return rol.iglesiaId === null || rol.iglesiaId === sesion.iglesiaId;
}

/** Devuelve el filtro de iglesia a aplicar en consultas Prisma según el rol. */
export function filtroIglesia(sesion: SesionActiva, iglesiaIdSolicitada?: string) {
  if (sesion.esSuperAdmin) {
    return iglesiaIdSolicitada ? { iglesiaId: iglesiaIdSolicitada } : {};
  }
  if (!sesion.iglesiaId) {
    throw new Error("El usuario no tiene una iglesia asignada");
  }
  return { iglesiaId: sesion.iglesiaId };
}
