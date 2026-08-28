import { prisma } from "@/lib/prisma";
import { TIPOS_ACTA, type TipoActa } from "@/lib/tipos-acta";
import type { Prisma } from "@prisma/client";

export type IngresoMes = {
  clave: string; // "2026-08"
  etiqueta: string; // "ago 2026"
  porTipo: Record<TipoActa, number>;
  total: number;
};

export type ParametrosPeriodo = { preset?: string; desde?: string; hasta?: string };

export type VentaMes = { clave: string; etiqueta: string; total: number };

export type ProductoVendido = { nombre: string; cantidad: number; subtotal: number };

// Paleta categórica validada (orden fijo, nunca ciclada) — ver skill de dataviz.
export const COLOR_TIPO_ACTA: Record<TipoActa, string> = {
  BAUTIZO: "#2a78d6",
  PRIMERA_COMUNION: "#eb6834",
  CONFIRMACION: "#1baf7a",
  MATRIMONIO: "#eda100",
};

export const PRESETS_PERIODO = [
  { valor: "3m", etiqueta: "Últimos 3 meses" },
  { valor: "6m", etiqueta: "Últimos 6 meses" },
  { valor: "12m", etiqueta: "Últimos 12 meses" },
  { valor: "ano", etiqueta: "Este año" },
  { valor: "ano-pasado", etiqueta: "Año pasado" },
] as const;

function claveMes(fecha: Date) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
}

function etiquetaMes(fecha: Date) {
  return fecha.toLocaleDateString("es-MX", { month: "short", year: "numeric" });
}

/** "2026-08" -> Date del primer día de ese mes. */
function parsearMes(valor: string, fallback: Date) {
  const m = /^(\d{4})-(\d{2})$/.exec(valor);
  if (!m) return fallback;
  return new Date(Number(m[1]), Number(m[2]) - 1, 1);
}

function primerDiaMes(anio: number, mes: number) {
  return new Date(anio, mes, 1);
}

/** Resuelve el rango [desde, hasta] (inclusive, por mes) a partir de los parámetros de la URL. */
export function resolverRangoMeses(params: ParametrosPeriodo): { desde: Date; hasta: Date } {
  const ahora = new Date();
  const inicioMesActual = primerDiaMes(ahora.getFullYear(), ahora.getMonth());

  if (params.desde || params.hasta) {
    const desde = params.desde ? parsearMes(params.desde, inicioMesActual) : inicioMesActual;
    const hasta = params.hasta ? parsearMes(params.hasta, inicioMesActual) : inicioMesActual;
    return desde <= hasta ? { desde, hasta } : { desde: hasta, hasta: desde };
  }

  switch (params.preset) {
    case "3m":
      return { desde: primerDiaMes(ahora.getFullYear(), ahora.getMonth() - 2), hasta: inicioMesActual };
    case "12m":
      return { desde: primerDiaMes(ahora.getFullYear(), ahora.getMonth() - 11), hasta: inicioMesActual };
    case "ano":
      return { desde: primerDiaMes(ahora.getFullYear(), 0), hasta: inicioMesActual };
    case "ano-pasado":
      return { desde: primerDiaMes(ahora.getFullYear() - 1, 0), hasta: primerDiaMes(ahora.getFullYear() - 1, 11) };
    case "6m":
    default:
      return { desde: primerDiaMes(ahora.getFullYear(), ahora.getMonth() - 5), hasta: inicioMesActual };
  }
}

function listaDeMeses(desde: Date, hasta: Date): IngresoMes[] {
  const meses: IngresoMes[] = [];
  const cursor = new Date(desde.getFullYear(), desde.getMonth(), 1);
  // límite de seguridad para no generar rangos absurdamente largos por un parámetro inválido
  for (let i = 0; i < 60 && cursor <= hasta; i++) {
    meses.push({
      clave: claveMes(cursor),
      etiqueta: etiquetaMes(cursor),
      porTipo: Object.fromEntries(TIPOS_ACTA.map((t) => [t, 0])) as Record<TipoActa, number>,
      total: 0,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return meses;
}

/** Ingresos (REGISTRO + REIMPRESION) agrupados por mes y tipo de acta, para el rango dado. */
export async function calcularIngresosPorMes(
  whereActa: Prisma.ActaWhereInput,
  desde: Date,
  hasta: Date,
): Promise<IngresoMes[]> {
  const finExclusivo = new Date(hasta.getFullYear(), hasta.getMonth() + 1, 1);
  const pagos = await prisma.pago.findMany({
    where: { acta: whereActa, createdAt: { gte: desde, lt: finExclusivo } },
    select: { monto: true, createdAt: true, acta: { select: { tipo: true } } },
  });

  const meses = listaDeMeses(desde, hasta);
  const porClave = new Map(meses.map((m) => [m.clave, m]));

  for (const pago of pagos) {
    const mes = porClave.get(claveMes(pago.createdAt));
    if (!mes) continue;
    mes.porTipo[pago.acta.tipo] += pago.monto;
  }
  for (const mes of meses) {
    mes.total = TIPOS_ACTA.reduce((acc, t) => acc + mes.porTipo[t], 0);
  }
  return meses;
}

/** Reimpresiones (conteo) por tipo de acta, para el rango dado. */
export async function calcularReimpresionesPorTipo(
  whereActa: Prisma.ActaWhereInput,
  desde: Date,
  hasta: Date,
): Promise<Record<TipoActa, number>> {
  const finExclusivo = new Date(hasta.getFullYear(), hasta.getMonth() + 1, 1);
  const pagos = await prisma.pago.findMany({
    where: { acta: whereActa, concepto: "REIMPRESION", createdAt: { gte: desde, lt: finExclusivo } },
    select: { acta: { select: { tipo: true } } },
  });
  const resultado = Object.fromEntries(TIPOS_ACTA.map((t) => [t, 0])) as Record<TipoActa, number>;
  for (const pago of pagos) resultado[pago.acta.tipo]++;
  return resultado;
}

/**
 * Ventas del punto de venta por mes (ingreso aparte de las actas — venta de
 * artículos/servicios, no cobro de sacramentos). Se muestra por separado,
 * sin desglose por tipo, para no mezclarlo con la gráfica de actas.
 */
export async function calcularVentasPorMes(
  whereIglesia: Prisma.VentaWhereInput,
  desde: Date,
  hasta: Date,
): Promise<VentaMes[]> {
  const finExclusivo = new Date(hasta.getFullYear(), hasta.getMonth() + 1, 1);
  const ventas = await prisma.venta.findMany({
    where: { ...whereIglesia, createdAt: { gte: desde, lt: finExclusivo } },
    select: { total: true, createdAt: true },
  });

  const meses = listaDeMeses(desde, hasta).map(({ clave, etiqueta }) => ({ clave, etiqueta, total: 0 }));
  const porClave = new Map(meses.map((m) => [m.clave, m]));
  for (const venta of ventas) {
    const mes = porClave.get(claveMes(venta.createdAt));
    if (mes) mes.total += venta.total;
  }
  return meses;
}

/** Productos más vendidos (por unidades) en el punto de venta, para el rango dado. */
export async function calcularProductosMasVendidos(
  whereIglesia: Prisma.VentaWhereInput,
  desde: Date,
  hasta: Date,
  limite = 5,
): Promise<ProductoVendido[]> {
  const finExclusivo = new Date(hasta.getFullYear(), hasta.getMonth() + 1, 1);
  const items = await prisma.ventaItem.findMany({
    where: { venta: { ...whereIglesia, createdAt: { gte: desde, lt: finExclusivo } } },
    select: { nombreProducto: true, cantidad: true, subtotal: true },
  });

  const porProducto = new Map<string, ProductoVendido>();
  for (const item of items) {
    const actual = porProducto.get(item.nombreProducto) ?? {
      nombre: item.nombreProducto,
      cantidad: 0,
      subtotal: 0,
    };
    actual.cantidad += item.cantidad;
    actual.subtotal += item.subtotal;
    porProducto.set(item.nombreProducto, actual);
  }

  return [...porProducto.values()].sort((a, b) => b.cantidad - a.cantidad).slice(0, limite);
}

/** Texto legible del periodo, para encabezados de reportes exportados. */
export function etiquetaPeriodo(desde: Date, hasta: Date) {
  const fmt = (d: Date) => d.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
  return desde.getTime() === hasta.getTime() ? fmt(desde) : `${fmt(desde)} — ${fmt(hasta)}`;
}
