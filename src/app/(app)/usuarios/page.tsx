import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSesion, puedeAdministrarUsuarios, filtroIglesia, filtroRoles } from "@/lib/authz";
import { EstadoUsuarioToggle } from "./estado-toggle";
import { RolSelect } from "./rol-select";
import { RestablecerPassword } from "./restablecer-password";
import { estadoLicencias } from "@/lib/licencias";

export default async function UsuariosPage() {
  const sesion = await requireSesion();
  if (!puedeAdministrarUsuarios(sesion)) redirect("/dashboard");

  const where = sesion.esSuperAdmin ? {} : filtroIglesia(sesion);

  const [usuarios, roles] = await Promise.all([
    prisma.usuario.findMany({
      where,
      orderBy: { nombre: "asc" },
      include: { iglesia: true, rol: true },
    }),
    prisma.rol.findMany({ where: filtroRoles(sesion), orderBy: { nombre: "asc" } }),
  ]);
  const licencias = await estadoLicencias();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Usuarios</h1>
          <p className="text-sm text-slate-500">Administra quién puede registrar y consultar actas.</p>
          {licencias.tope !== null && (
            <p className="mt-1 text-sm text-slate-500">
              <span className="font-medium text-slate-700">
                {licencias.enUso} de {licencias.tope}
              </span>{" "}
              usuarios activos
              {!licencias.hayCupo && (
                <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                  Sin cupo
                </span>
              )}
            </p>
          )}
        </div>
        {licencias.hayCupo ? (
          <Link
            href="/usuarios/nuevo"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Nuevo usuario
          </Link>
        ) : (
          <span
            title="Desactiva a un usuario o contrata más licencias"
            className="cursor-not-allowed rounded-md bg-slate-200 px-4 py-2 text-sm font-medium text-slate-400"
          >
            Nuevo usuario
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Correo</th>
              <th className="px-4 py-2">Rol</th>
              {sesion.esSuperAdmin && <th className="px-4 py-2">Iglesia</th>}
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usuarios.map((usuario) => (
              <tr key={usuario.id}>
                <td className="px-4 py-2 font-medium text-slate-900">{usuario.nombre}</td>
                <td className="px-4 py-2">{usuario.email}</td>
                <td className="px-4 py-2">
                  {usuario.esSuperAdmin ? (
                    "SUPERADMIN"
                  ) : (
                    <RolSelect usuarioId={usuario.id} rolId={usuario.rolId} roles={roles} />
                  )}
                </td>
                {sesion.esSuperAdmin && (
                  <td className="px-4 py-2">{usuario.iglesia?.nombre ?? "-"}</td>
                )}
                <td className="px-4 py-2">
                  {usuario.activo ? (
                    <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">Activo</span>
                  ) : (
                    <span className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-600">Inactivo</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  {usuario.id !== sesion.id && (
                    <div className="flex flex-col items-end gap-2">
                      <RestablecerPassword usuarioId={usuario.id} nombre={usuario.nombre} />
                      <EstadoUsuarioToggle usuarioId={usuario.id} activo={usuario.activo} />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
