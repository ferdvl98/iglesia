import type { Permiso } from "@prisma/client";
import { moduloPuntoDeVentaActivo } from "@/lib/modulos";

/**
 * Quién es y qué puede hacer: lógica pura, sin NextAuth ni base de datos.
 *
 * Vive aparte de `authz.ts` para poder comprobarse con pruebas. Mezclada con
 * la carga de la sesión, cualquier prueba arrastraba NextAuth entero.
 */
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
  debeCambiarPassword: boolean;
};


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

/**
 * Punto de venta y catálogo son un módulo aparte. Si el cliente no lo
 * contrató, ningún permiso lo abre —ni siquiera para el SUPERADMIN—, y como
 * todas las pantallas y acciones de ese módulo pasan por estas dos funciones,
 * apagarlo aquí lo apaga entero.
 */
export function puedeUsarPuntoDeVenta(sesion: SesionActiva) {
  if (!moduloPuntoDeVentaActivo()) return false;
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
  if (!moduloPuntoDeVentaActivo()) return false;
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
