import Link from "next/link";
import { requireSesion, filtroIglesia } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { TIPO_ACTA_LABEL, TIPOS_ACTA } from "@/lib/tipos-acta";
import {
  resolverRangoMeses,
  calcularIngresosPorMes,
  calcularReimpresionesPorTipo,
  calcularVentasPorMes,
  calcularProductosMasVendidos,
} from "@/lib/ingresos";
import { IngresosChart, IngresosTabla, VentasResumen } from "./ingresos-chart";
import { FiltroPeriodo } from "./filtro-periodo";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; desde?: string; hasta?: string }>;
}) {
  const sesion = await requireSesion();
  const where = filtroIglesia(sesion);
  const params = await searchParams;

  const conteos = await prisma.acta.groupBy({
    by: ["tipo"],
    where: { ...where, anulada: false },
    _count: { _all: true },
  });

  const totalPorTipo = Object.fromEntries(
    TIPOS_ACTA.map((tipo) => [
      tipo,
      conteos.find((c) => c.tipo === tipo)?._count._all ?? 0,
    ]),
  );

  const { desde, hasta } = resolverRangoMeses(params);
  const [ingresosPorMes, reimpresionesPorTipo, ventasPorMes, productosMasVendidos] = await Promise.all([
    calcularIngresosPorMes(where, desde, hasta),
    calcularReimpresionesPorTipo(where, desde, hasta),
    calcularVentasPorMes(where, desde, hasta),
    calcularProductosMasVendidos(where, desde, hasta),
  ]);

  const totalGanadoPeriodo = ingresosPorMes.reduce((acc, m) => acc + m.total, 0);
  const totalReimpresiones = TIPOS_ACTA.reduce((acc, t) => acc + reimpresionesPorTipo[t], 0);

  const qsDescarga = new URLSearchParams();
  if (params.preset) qsDescarga.set("preset", params.preset);
  if (params.desde) qsDescarga.set("desde", params.desde);
  if (params.hasta) qsDescarga.set("hasta", params.hasta);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Resumen</h1>
        <p className="text-sm text-slate-500">
          Actas registradas por tipo de sacramento.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {TIPOS_ACTA.map((tipo) => (
          <div key={tipo} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {TIPO_ACTA_LABEL[tipo]}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {totalPorTipo[tipo]}
            </p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Link
          href="/actas/nueva"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Registrar nueva acta
        </Link>
        <Link
          href="/actas"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Consultar actas
        </Link>
      </div>

      <FiltroPeriodo presetActual={params.preset ?? "6m"} desdeActual={params.desde} hastaActual={params.hasta} />

      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Reimpresiones por tipo
          </h2>
          <p className="text-xs text-slate-500">{totalReimpresiones} en total en el período</p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {TIPOS_ACTA.map((tipo) => (
            <div key={tipo} className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {TIPO_ACTA_LABEL[tipo]}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {reimpresionesPorTipo[tipo]}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Ingresos por mes</h2>
          <div className="flex items-center gap-3">
            <p className="text-xs text-slate-500">
              Total del período{" "}
              {totalGanadoPeriodo.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 })}
            </p>
            <Link
              href={`/api/dashboard/ingresos/pdf?${qsDescarga.toString()}`}
              className="text-xs font-medium text-slate-600 underline hover:text-slate-900"
            >
              Descargar PDF
            </Link>
            <Link
              href={`/api/dashboard/ingresos/csv?${qsDescarga.toString()}`}
              className="text-xs font-medium text-slate-600 underline hover:text-slate-900"
            >
              Descargar Excel
            </Link>
          </div>
        </div>
        <IngresosChart meses={ingresosPorMes} />
        <div className="mt-4">
          <IngresosTabla meses={ingresosPorMes} />
        </div>
        <VentasResumen meses={ventasPorMes} productos={productosMasVendidos} />
      </div>
    </div>
  );
}
