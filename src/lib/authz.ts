import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Destino del usuario cuyo token ya no corresponde a una cuenta válida.
 * El middleware deja pasar /login con este parámetro aunque la cookie siga
 * presente; sin esa excepción se produciría un bucle de redirecciones.
 */
export const RUTA_SESION_INVALIDA = "/login?motivo=sesion";

export type { SesionActiva } from "@/lib/permisos";
export * from "@/lib/permisos";
import type { SesionActiva } from "@/lib/permisos";

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
    debeCambiarPassword: usuario.debeCambiarPassword,
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

