import type { Prisma } from "@prisma/client";
import { filtroIglesia, type SesionActiva } from "@/lib/authz";
import { esTipoActaValido } from "@/lib/tipos-acta";
import { normalizar } from "@/lib/busqueda";

export type ParametrosActas = {
  q?: string;
  numeroActa?: string;
  libro?: string;
  foja?: string;
  tipo?: string;
  desde?: string;
  hasta?: string;
};

/** `new Date("abc")` es un Invalid Date que Prisma rechaza con un 500. */
function fechaValida(valor: string | undefined) {
  if (!valor) return null;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

/**
 * Filtro de actas a partir de los parámetros de la búsqueda.
 *
 * Lo comparten el listado y la exportación: si cada uno armara el suyo,
 * descargarías un archivo que no corresponde a lo que estás viendo en
 * pantalla, que es la peor forma de equivocarse en una exportación.
 *
 * Empieza siempre por `filtroIglesia`, de modo que el aislamiento entre
 * parroquias no depende de acordarse de añadirlo en cada consulta.
 */
export function construirFiltroActas(
  sesion: SesionActiva,
  params: ParametrosActas,
): Prisma.ActaWhereInput {
  const where: Prisma.ActaWhereInput = { ...filtroIglesia(sesion) };

  if (params.tipo && esTipoActaValido(params.tipo)) {
    where.tipo = params.tipo;
  }
  if (params.q) {
    // Una sola columna normalizada en vez de seis condiciones OR: encuentra
    // sin acentos y también por padres, padrinos o testigos.
    where.textoBusqueda = { contains: normalizar(params.q) };
  }
  if (params.numeroActa && /^\d+$/.test(params.numeroActa)) {
    where.numeroActa = Number(params.numeroActa);
  }
  if (params.libro) {
    where.libro = { equals: params.libro, mode: "insensitive" };
  }
  if (params.foja && /^\d+$/.test(params.foja)) {
    where.foja = Number(params.foja);
  }
  const desde = fechaValida(params.desde);
  const hasta = fechaValida(params.hasta);
  if (desde || hasta) {
    where.fecha = {
      ...(desde ? { gte: desde } : {}),
      ...(hasta ? { lte: hasta } : {}),
    };
  }
  return where;
}
