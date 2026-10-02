import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSesion, filtroIglesia, puedeConsultarActas } from "@/lib/authz";
import { TIPO_ACTA_LABEL, TIPOS_ACTA, esTipoActaValido } from "@/lib/tipos-acta";
import { formatearFecha } from "@/lib/fecha";
import type { Prisma } from "@prisma/client";

const POR_PAGINA = 50;

/** `new Date("abc")` es un Invalid Date que Prisma rechaza con un 500. */
function fechaValida(valor: string | undefined) {
  if (!valor) return null;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

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
    pagina?: string;
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
      {
        bautizo: {
          nombreCompleto: { contains: params.q, mode: "insensitive" },
        },
      },
      {
        primeraComunion: {
          nombre: { contains: params.q, mode: "insensitive" },
        },
      },
      {
        primeraComunion: {
          apellidos: { contains: params.q, mode: "insensitive" },
        },
      },
      {
        confirmacion: {
          nombreCompleto: { contains: params.q, mode: "insensitive" },
        },
      },
      {
        matrimonio: {
          nombreEsposo: { contains: params.q, mode: "insensitive" },
        },
      },
      {
        matrimonio: {
          nombreEsposa: { contains: params.q, mode: "insensitive" },
        },
      },
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
  // Una fecha mal formada (?desde=abc) llegaba como Invalid Date a Prisma y
  // tumbaba la página con un 500 en vez de ignorarse.
  const desde = fechaValida(params.desde);
  const hasta = fechaValida(params.hasta);
  if (desde || hasta) {
    where.fecha = {
      ...(desde ? { gte: desde } : {}),
      ...(hasta ? { lte: hasta } : {}),
    };
  }

  const total = await prisma.acta.count({ where });
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  // Se acota a la última página real: ?pagina=99 con 3 páginas mostraba
  // "4901-126 de 126" y una tabla vacía.
  const paginaPedida = Number(params.pagina);
  const pagina =
    Number.isInteger(paginaPedida) && paginaPedida > 0 ? Math.min(paginaPedida, totalPaginas) : 1;

  const actas = await prisma.acta.findMany({
    where,
    orderBy: [{ fecha: "desc" }, { id: "desc" }],
    skip: (pagina - 1) * POR_PAGINA,
    take: POR_PAGINA,
    // Del sacramento solo se necesita el nombre para la tabla; traer las
    // cuatro relaciones completas de cada fila era puro peso muerto.
    select: {
      id: true,
      tipo: true,
      libro: true,
      foja: true,
      numeroActa: true,
      fecha: true,
      anulada: true,
      iglesia: { select: { nombre: true } },
      bautizo: { select: { nombreCompleto: true } },
      primeraComunion: { select: { nombre: true, apellidos: true } },
      confirmacion: { select: { nombreCompleto: true } },
      matrimonio: { select: { nombreEsposo: true, nombreEsposa: true } },
    },
  });

  const primero = total === 0 ? 0 : (pagina - 1) * POR_PAGINA + 1;
  const ultimo = Math.min(pagina * POR_PAGINA, total);

  /** Conserva los filtros actuales al cambiar de página. */
  function enlacePagina(n: number) {
    const qs = new URLSearchParams();
    for (const [clave, valor] of Object.entries(params)) {
      if (clave !== "pagina" && valor) qs.set(clave, valor);
    }
    if (n > 1) qs.set("pagina", String(n));
    const cadena = qs.toString();
    return cadena ? `/actas?${cadena}` : "/actas";
  }

  function nombrePrincipal(acta: (typeof actas)[number]) {
    if (acta.bautizo) return acta.bautizo.nombreCompleto;
    if (acta.primeraComunion)
      return `${acta.primeraComunion.nombre} ${acta.primeraComunion.apellidos}`;
    if (acta.confirmacion) return acta.confirmacion.nombreCompleto;
    if (acta.matrimonio) return `${acta.matrimonio.nombreEsposo} & ${acta.matrimonio.nombreEsposa}`;
    return "-";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
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
                    <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">
                      Anulada
                    </span>
                  ) : (
                    <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">
                      Vigente
                    </span>
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          {total === 0
            ? "Sin resultados"
            : `Mostrando ${primero}\u2013${ultimo} de ${total} acta${total === 1 ? "" : "s"}`}
        </p>
        {totalPaginas > 1 && (
          <div className="flex items-center gap-2">
            {pagina > 1 ? (
              <Link
                href={enlacePagina(pagina - 1)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Anterior
              </Link>
            ) : (
              <span className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-300">
                Anterior
              </span>
            )}
            <span className="text-sm text-slate-500">
              Página {pagina} de {totalPaginas}
            </span>
            {pagina < totalPaginas ? (
              <Link
                href={enlacePagina(pagina + 1)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Siguiente
              </Link>
            ) : (
              <span className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-300">
                Siguiente
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
