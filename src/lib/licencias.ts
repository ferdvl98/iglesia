import { prisma } from "@/lib/prisma";

/**
 * Licencias de usuario contratadas por el cliente de esta instalación.
 *
 * Cada cliente corre su propia instancia con su propia base, así que el cupo
 * vive en una variable de entorno de Vercel: el administrador de la parroquia
 * no tiene acceso al panel de despliegue y por tanto no puede ampliárselo
 * desde la aplicación.
 *
 * Sin la variable no hay tope. Es deliberado: una instalación de desarrollo o
 * una anterior a esta función no debe quedarse sin poder crear usuarios.
 */
export function licenciasContratadas(): number | null {
  const crudo = process.env.LICENCIAS_USUARIOS?.trim();
  if (!crudo) return null;
  const valor = Number(crudo);
  if (!Number.isInteger(valor) || valor <= 0) {
    // Falla abierto a propósito: un error de dedo en la variable no debe dejar
    // al cliente sin poder crear usuarios. Pero se registra, porque si no, un
    // "1O" en vez de "10" dejaría la instalación sin tope en silencio.
    console.warn(
      `LICENCIAS_USUARIOS tiene un valor inválido (${JSON.stringify(crudo)}); se ignora el tope.`,
    );
    return null;
  }
  return valor;
}

export type EstadoLicencias = {
  tope: number | null;
  enUso: number;
  /** Quedan asientos libres (siempre cierto si no hay tope). */
  hayCupo: boolean;
};

/**
 * Se cuentan los usuarios **activos**: desactivar a alguien libera su asiento,
 * que es lo que un administrador espera al dar de baja a quien ya no trabaja
 * en la parroquia.
 */
export async function estadoLicencias(): Promise<EstadoLicencias> {
  const tope = licenciasContratadas();
  const enUso = await prisma.usuario.count({ where: { activo: true } });
  return { tope, enUso, hayCupo: tope === null || enUso < tope };
}

export const MENSAJE_SIN_CUPO =
  "Alcanzaste el número de usuarios contratados. Desactiva a un usuario que ya no use el sistema, o contrata más licencias.";
