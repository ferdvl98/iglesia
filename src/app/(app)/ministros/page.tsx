import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSesion, puedeEscribir } from "@/lib/authz";
import { EstadoMinistroToggle } from "./estado-toggle";

export default async function MinistrosPage({
  searchParams,
}: {
  searchParams: Promise<{ iglesiaId?: string }>;
}) {
  const sesion = await requireSesion();
  if (!puedeEscribir(sesion)) redirect("/dashboard");

  if (sesion.esSuperAdmin) {
    const params = await searchParams;
    const iglesias = await prisma.iglesia.findMany({
      where: { activa: true },
      orderBy: { nombre: "asc" },
    });

    if (!params.iglesiaId) {
      return (
        <div className="max-w-md space-y-4">
          <h1 className="text-lg font-semibold text-slate-900">Sacerdotes / ministros</h1>
          <p className="text-sm text-slate-500">Selecciona la iglesia cuyo catálogo quieres administrar.</p>
          <form className="rounded-lg border border-slate-200 bg-white p-4">
            <label className="block text-xs font-medium text-slate-600">Iglesia</label>
            <select
              name="iglesiaId"
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {iglesias.map((iglesia) => (
                <option key={iglesia.id} value={iglesia.id}>
                  {iglesia.nombre}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Continuar
            </button>
          </form>
        </div>
      );
    }

    const iglesia = iglesias.find((i) => i.id === params.iglesiaId);
    if (!iglesia) redirect("/ministros");

    const ministros = await prisma.ministro.findMany({
      where: { iglesiaId: iglesia.id },
      orderBy: { nombre: "asc" },
    });

    return (
      <ListaMinistros
        ministros={ministros}
        titulo={`Sacerdotes / ministros — ${iglesia.nombre}`}
        nuevoHref={`/ministros/nuevo?iglesiaId=${iglesia.id}`}
      />
    );
  }

  const ministros = await prisma.ministro.findMany({
    where: { iglesiaId: sesion.iglesiaId! },
    orderBy: { nombre: "asc" },
  });

  return (
    <ListaMinistros
      ministros={ministros}
      titulo="Sacerdotes / ministros"
      nuevoHref="/ministros/nuevo"
    />
  );
}

function ListaMinistros({
  ministros,
  titulo,
  nuevoHref,
}: {
  ministros: {
    id: string;
    nombre: string;
    titulo: string | null;
    telefono: string | null;
    email: string | null;
    direccion: string | null;
    activo: boolean;
  }[];
  titulo: string;
  nuevoHref: string;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{titulo}</h1>
          <p className="text-sm text-slate-500">
            Registro de sacerdotes y ministros disponibles para celebrar actas.
          </p>
        </div>
        <Link
          href={nuevoHref}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Nuevo sacerdote
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Título</th>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Teléfono</th>
              <th className="px-4 py-2">Correo</th>
              <th className="px-4 py-2">Dirección</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ministros.map((ministro) => (
              <tr key={ministro.id}>
                <td className="px-4 py-2 text-slate-600">{ministro.titulo ?? "-"}</td>
                <td className="px-4 py-2 font-medium text-slate-900">{ministro.nombre}</td>
                <td className="px-4 py-2">{ministro.telefono ?? "-"}</td>
                <td className="px-4 py-2">{ministro.email ?? "-"}</td>
                <td className="px-4 py-2 text-slate-600">{ministro.direccion ?? "-"}</td>
                <td className="px-4 py-2">
                  {ministro.activo ? (
                    <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">Activo</span>
                  ) : (
                    <span className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-600">Inactivo</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/ministros/${ministro.id}`} className="text-slate-600 hover:underline">
                      Editar
                    </Link>
                    <EstadoMinistroToggle ministroId={ministro.id} activo={ministro.activo} />
                  </div>
                </td>
              </tr>
            ))}
            {ministros.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  Aún no hay sacerdotes ni ministros registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
