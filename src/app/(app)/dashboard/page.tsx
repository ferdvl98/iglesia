import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSesion, filtroIglesia } from "@/lib/authz";
import { TIPO_ACTA_LABEL, TIPOS_ACTA } from "@/lib/tipos-acta";
import { formatearFecha } from "@/lib/fecha";

export default async function DashboardPage() {
  const sesion = await requireSesion();
  const where = filtroIglesia(sesion);

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

  const ultimasActas = await prisma.acta.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { iglesia: true },
  });

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

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Últimas actas registradas
        </h2>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Tipo</th>
                <th className="px-4 py-2">No. Acta</th>
                <th className="px-4 py-2">Fecha</th>
                {sesion.esSuperAdmin && <th className="px-4 py-2">Iglesia</th>}
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ultimasActas.map((acta) => (
                <tr key={acta.id}>
                  <td className="px-4 py-2">{TIPO_ACTA_LABEL[acta.tipo]}</td>
                  <td className="px-4 py-2">{acta.numeroActa}</td>
                  <td className="px-4 py-2">
                    {formatearFecha(acta.fecha)}
                  </td>
                  {sesion.esSuperAdmin && (
                    <td className="px-4 py-2">{acta.iglesia.nombre}</td>
                  )}
                  <td className="px-4 py-2 text-right">
                    <Link href={`/actas/${acta.id}`} className="text-slate-600 hover:underline">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
              {ultimasActas.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    Aún no hay actas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
