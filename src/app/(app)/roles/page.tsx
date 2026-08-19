import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSesion, puedeAdministrarRoles } from "@/lib/authz";
import { PERMISOS_LABEL } from "./rol-form";
import { EliminarRolBoton } from "./eliminar-rol-boton";

export default async function RolesPage() {
  const sesion = await requireSesion();
  if (!puedeAdministrarRoles(sesion)) redirect("/dashboard");

  const roles = await prisma.rol.findMany({
    orderBy: [{ esAdministrador: "desc" }, { nombre: "asc" }],
    include: { _count: { select: { usuarios: true } } },
  });

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Roles</h1>
          <p className="text-sm text-slate-500">
            Define qué puede hacer cada rol y asígnalo a los usuarios. El rol Administrador
            siempre existe y tiene todos los permisos.
          </p>
        </div>
        <Link
          href="/roles/nuevo"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Nuevo rol
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Permisos</th>
              <th className="px-4 py-2">Usuarios</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {roles.map((rol) => (
              <tr key={rol.id}>
                <td className="px-4 py-2 font-medium text-slate-900">
                  {rol.nombre}
                  {rol.esAdministrador && (
                    <span className="ml-2 rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                      Fijo
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-slate-600">
                  {rol.esAdministrador
                    ? "Todos los permisos"
                    : rol.permisos.map((p) => PERMISOS_LABEL[p]).join(", ") || "-"}
                </td>
                <td className="px-4 py-2">{rol._count.usuarios}</td>
                <td className="px-4 py-2 text-right">
                  <div className="flex items-center justify-end gap-3">
                    {!rol.esAdministrador && (
                      <>
                        <Link href={`/roles/${rol.id}`} className="text-slate-600 hover:underline">
                          Editar
                        </Link>
                        <EliminarRolBoton rolId={rol.id} />
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
