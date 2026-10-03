import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSesion, puedeAdministrarUsuarios, filtroRoles } from "@/lib/authz";
import { EditarUsuarioForm } from "./editar-form";

export default async function EditarUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sesion = await requireSesion();
  if (!puedeAdministrarUsuarios(sesion)) redirect("/dashboard");

  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario) notFound();
  // Mismas reglas que la acción: la UI no debe abrir lo que el servidor rechaza.
  if (!sesion.esSuperAdmin && usuario.iglesiaId !== sesion.iglesiaId) notFound();
  if (usuario.esSuperAdmin && !sesion.esSuperAdmin) notFound();

  const [roles, iglesias] = await Promise.all([
    prisma.rol.findMany({ where: filtroRoles(sesion), orderBy: { nombre: "asc" } }),
    sesion.esSuperAdmin
      ? prisma.iglesia.findMany({ where: { activa: true }, orderBy: { nombre: "asc" } })
      : Promise.resolve([]),
  ]);

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Editar usuario</h1>
        <p className="mt-1 text-sm text-slate-500">
          La contraseña no se cambia aquí: usa &quot;Restablecer contraseña&quot; en el listado,
          que además obliga a la persona a elegir una propia al entrar.
        </p>
      </div>

      <EditarUsuarioForm
        usuario={usuario}
        roles={roles}
        iglesias={iglesias}
        esSuperadmin={sesion.esSuperAdmin}
      />

      <Link href="/usuarios" className="text-sm text-slate-500 hover:underline">
        ← Volver a usuarios
      </Link>
    </div>
  );
}
