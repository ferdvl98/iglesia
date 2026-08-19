import { redirect } from "next/navigation";
import { requireSesion, puedeAdministrarCatalogo } from "@/lib/authz";
import { ProductoForm } from "../producto-form";

export default async function NuevoProductoPage({
  searchParams,
}: {
  searchParams: Promise<{ iglesiaId?: string }>;
}) {
  const sesion = await requireSesion();
  if (!puedeAdministrarCatalogo(sesion)) redirect("/dashboard");

  const params = await searchParams;
  if (sesion.esSuperAdmin && !params.iglesiaId) redirect("/catalogo");

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-lg font-semibold text-slate-900">Nuevo producto o servicio</h1>
      <ProductoForm modo="crear" iglesiaId={sesion.esSuperAdmin ? params.iglesiaId : undefined} />
    </div>
  );
}
