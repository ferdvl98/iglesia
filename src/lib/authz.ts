import { auth } from "@/auth";
import type { Permiso } from "@prisma/client";

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

export async function requireSesion(): Promise<SesionActiva> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("No autenticado");
  }
  return {
    id: session.user.id,
    esSuperAdmin: session.user.esSuperAdmin,
    esAdministrador: session.user.esSuperAdmin || session.user.esAdministrador,
    rolId: session.user.rolId,
    rolNombre: session.user.rolNombre,
    permisos: session.user.permisos,
    iglesiaId: session.user.iglesiaId,
    iglesiaNombre: session.user.iglesiaNombre,
    nombre: session.user.name ?? null,
    email: session.user.email ?? null,
  };
}

function tienePermiso(sesion: SesionActiva, permiso: Permiso) {
  return sesion.esSuperAdmin || sesion.permisos.includes(permiso);
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

export function puedeConfigurar(sesion: SesionActiva) {
  return tienePermiso(sesion, "CONFIGURAR");
}

/** El catálogo de productos/servicios (incl. ajuste y transferencia de inventario). */
export function puedeAdministrarCatalogo(sesion: SesionActiva) {
  return tienePermiso(sesion, "ADMINISTRAR_CATALOGO");
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
