import { redirect } from "next/navigation";
import { requireSesion, puedeAdministrarIglesias } from "@/lib/authz";
import { IglesiaForm } from "../iglesia-form";

export default async function NuevaIglesiaPage() {
  const sesion = await requireSesion();
  if (!puedeAdministrarIglesias(sesion)) redirect("/dashboard");

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-lg font-semibold text-slate-900">Nueva iglesia</h1>
      <IglesiaForm modo="crear" />
    </div>
  );
}
