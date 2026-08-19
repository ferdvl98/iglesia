import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSesion, puedeAdministrarIglesias } from "@/lib/authz";

export default async function IglesiasPage() {
  const sesion = await requireSesion();
  if (!puedeAdministrarIglesias(sesion)) redirect("/dashboard");

  const iglesias = await prisma.iglesia.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { actas: true, usuarios: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Iglesias</h1>
          <p className="text-sm text-slate-500">Administra las parroquias registradas en el sistema.</p>
        </div>
        <Link
          href="/iglesias/nueva"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Nueva iglesia
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Diócesis</th>
              <th className="px-4 py-2">Ciudad</th>
              <th className="px-4 py-2">Actas</th>
              <th className="px-4 py-2">Usuarios</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {iglesias.map((iglesia) => (
              <tr key={iglesia.id}>
                <td className="px-4 py-2 font-medium text-slate-900">{iglesia.nombre}</td>
                <td className="px-4 py-2">{iglesia.diocesis ?? "-"}</td>
                <td className="px-4 py-2">{iglesia.ciudad ?? "-"}</td>
                <td className="px-4 py-2">{iglesia._count.actas}</td>
                <td className="px-4 py-2">{iglesia._count.usuarios}</td>
                <td className="px-4 py-2">
                  {iglesia.activa ? (
                    <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">Activa</span>
                  ) : (
                    <span className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-600">Inactiva</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/iglesias/${iglesia.id}`} className="text-slate-600 hover:underline">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
