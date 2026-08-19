import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSesion, filtroIglesia, puedeConsultarActas } from "@/lib/authz";
import { TIPO_ACTA_LABEL, TIPOS_ACTA, esTipoActaValido } from "@/lib/tipos-acta";
import { formatearFecha } from "@/lib/fecha";
import type { Prisma } from "@prisma/client";

export default async function ActasPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    numeroActa?: string;
    libro?: string;
    foja?: string;
    tipo?: string;
    desde?: string;
    hasta?: string;
  }>;
}) {
  const sesion = await requireSesion();
  if (!puedeConsultarActas(sesion)) redirect("/dashboard");
  const params = await searchParams;

  const where: Prisma.ActaWhereInput = { ...filtroIglesia(sesion) };

  if (params.tipo && esTipoActaValido(params.tipo)) {
    where.tipo = params.tipo;
  }
  if (params.q) {
    where.OR = [
      { bautizo: { nombreCompleto: { contains: params.q, mode: "insensitive" } } },
      { primeraComunion: { nombreCompleto: { contains: params.q, mode: "insensitive" } } },
      { confirmacion: { nombreCompleto: { contains: params.q, mode: "insensitive" } } },
      { matrimonio: { nombreEsposo: { contains: params.q, mode: "insensitive" } } },
      { matrimonio: { nombreEsposa: { contains: params.q, mode: "insensitive" } } },
    ];
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
  if (params.desde || params.hasta) {
    where.fecha = {
      ...(params.desde ? { gte: new Date(params.desde) } : {}),
      ...(params.hasta ? { lte: new Date(params.hasta) } : {}),
    };
  }

  const actas = await prisma.acta.findMany({
    where,
    orderBy: { fecha: "desc" },
    take: 100,
    include: {
      iglesia: true,
      bautizo: true,
      primeraComunion: true,
      confirmacion: true,
      matrimonio: true,
    },
  });

  function nombrePrincipal(acta: (typeof actas)[number]) {
    if (acta.bautizo) return acta.bautizo.nombreCompleto;
    if (acta.primeraComunion) return acta.primeraComunion.nombreCompleto;
    if (acta.confirmacion) return acta.confirmacion.nombreCompleto;
    if (acta.matrimonio) return `${acta.matrimonio.nombreEsposo} & ${acta.matrimonio.nombreEsposa}`;
    return "-";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Actas</h1>
          <p className="text-sm text-slate-500">Consulta, filtra y reimprime actas registradas.</p>
        </div>
        <Link
          href="/actas/nueva"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Registrar nueva acta
        </Link>
      </div>

      <form className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-4">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-600">Buscar por nombre</label>
          <input
            type="text"
            name="q"
            defaultValue={params.q}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Nombre de la persona"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Tipo</label>
          <select
            name="tipo"
            defaultValue={params.tipo ?? ""}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            {TIPOS_ACTA.map((tipo) => (
              <option key={tipo} value={tipo}>
                {TIPO_ACTA_LABEL[tipo]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Libro</label>
          <input
            type="text"
            name="libro"
            defaultValue={params.libro}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Foja</label>
          <input
            type="number"
            min={1}
            name="foja"
            defaultValue={params.foja}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">No. de partida</label>
          <input
            type="number"
            min={1}
            name="numeroActa"
            defaultValue={params.numeroActa}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Desde</label>
          <input
            type="date"
            name="desde"
            defaultValue={params.desde}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Hasta</label>
          <input
            type="date"
            name="hasta"
            defaultValue={params.hasta}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="col-span-2 flex items-end gap-2 sm:col-span-4">
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Filtrar
          </button>
          <Link href="/actas" className="text-sm text-slate-500 hover:underline">
            Limpiar filtros
          </Link>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Tipo</th>
              <th className="px-4 py-2">Libro</th>
              <th className="px-4 py-2">Foja</th>
              <th className="px-4 py-2">No. Partida</th>
              <th className="px-4 py-2">Nombre(s)</th>
              <th className="px-4 py-2">Fecha</th>
              {sesion.esSuperAdmin && <th className="px-4 py-2">Iglesia</th>}
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {actas.map((acta) => (
              <tr key={acta.id}>
                <td className="px-4 py-2">{TIPO_ACTA_LABEL[acta.tipo]}</td>
                <td className="px-4 py-2">{acta.libro}</td>
                <td className="px-4 py-2">{acta.foja}</td>
                <td className="px-4 py-2">{acta.numeroActa}</td>
                <td className="px-4 py-2">{nombrePrincipal(acta)}</td>
                <td className="px-4 py-2">{formatearFecha(acta.fecha)}</td>
                {sesion.esSuperAdmin && <td className="px-4 py-2">{acta.iglesia.nombre}</td>}
                <td className="px-4 py-2">
                  {acta.anulada ? (
                    <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">Anulada</span>
                  ) : (
                    <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">Vigente</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/actas/${acta.id}`} className="text-slate-600 hover:underline">
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
            {actas.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-slate-400">
                  No se encontraron actas con esos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
