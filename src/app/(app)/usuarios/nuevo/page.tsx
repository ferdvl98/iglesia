import { redirect } from "next/navigation";
import { requireSesion, puedeAdministrarUsuarios } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { UsuarioForm } from "./usuario-form";

export default async function NuevoUsuarioPage() {
  const sesion = await requireSesion();
  if (!puedeAdministrarUsuarios(sesion)) redirect("/dashboard");

  const [iglesias, roles] = await Promise.all([
    sesion.esSuperAdmin
      ? prisma.iglesia.findMany({ where: { activa: true }, orderBy: { nombre: "asc" } })
      : Promise.resolve([]),
    prisma.rol.findMany({ orderBy: { nombre: "asc" } }),
  ]);

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-lg font-semibold text-slate-900">Nuevo usuario</h1>
      <UsuarioForm esSuperadmin={sesion.esSuperAdmin} iglesias={iglesias} roles={roles} />
    </div>
  );
}
