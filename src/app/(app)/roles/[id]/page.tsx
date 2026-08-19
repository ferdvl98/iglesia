import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSesion, puedeAdministrarRoles } from "@/lib/authz";
import { actualizarRol } from "../actions";
import { RolForm } from "../rol-form";

export default async function EditarRolPage({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await requireSesion();
  if (!puedeAdministrarRoles(sesion)) redirect("/dashboard");

  const { id } = await params;
  const rol = await prisma.rol.findUnique({ where: { id } });
  if (!rol) notFound();
  if (rol.esAdministrador) redirect("/roles");

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-lg font-semibold text-slate-900">Editar rol</h1>
      <RolForm
        action={actualizarRol}
        rolId={rol.id}
        nombreInicial={rol.nombre}
        permisosIniciales={rol.permisos}
        textoBoton="Guardar cambios"
      />
    </div>
  );
}
