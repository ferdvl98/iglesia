import { redirect } from "next/navigation";
import { requireSesion, puedeAdministrarRoles } from "@/lib/authz";
import { crearRol } from "../actions";
import { RolForm } from "../rol-form";

export default async function NuevoRolPage() {
  const sesion = await requireSesion();
  if (!puedeAdministrarRoles(sesion)) redirect("/dashboard");

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-lg font-semibold text-slate-900">Nuevo rol</h1>
      <RolForm action={crearRol} textoBoton="Crear rol" />
    </div>
  );
}
