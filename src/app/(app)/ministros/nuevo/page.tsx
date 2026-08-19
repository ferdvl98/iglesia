import { redirect } from "next/navigation";
import { requireSesion, puedeAdministrarMinistros } from "@/lib/authz";
import { crearMinistro } from "../actions";
import { MinistroForm } from "../ministro-form";

export default async function NuevoMinistroPage({
  searchParams,
}: {
  searchParams: Promise<{ iglesiaId?: string }>;
}) {
  const sesion = await requireSesion();
  if (!puedeAdministrarMinistros(sesion)) redirect("/dashboard");

  const params = await searchParams;
  if (sesion.esSuperAdmin && !params.iglesiaId) redirect("/ministros");

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-lg font-semibold text-slate-900">Nuevo sacerdote / ministro</h1>
      <MinistroForm
        action={crearMinistro}
        iglesiaId={sesion.esSuperAdmin ? params.iglesiaId : undefined}
        textoBoton="Crear registro"
      />
    </div>
  );
}
