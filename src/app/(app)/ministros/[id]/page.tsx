import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSesion, puedeAdministrarMinistros } from "@/lib/authz";
import { actualizarMinistro } from "../actions";
import { MinistroForm } from "../ministro-form";

export default async function EditarMinistroPage({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await requireSesion();
  if (!puedeAdministrarMinistros(sesion)) redirect("/dashboard");

  const { id } = await params;
  const ministro = await prisma.ministro.findUnique({ where: { id } });
  if (!ministro) notFound();
  if (!sesion.esSuperAdmin && ministro.iglesiaId !== sesion.iglesiaId) notFound();

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-lg font-semibold text-slate-900">Editar sacerdote / ministro</h1>
      <MinistroForm action={actualizarMinistro} ministro={ministro} textoBoton="Guardar cambios" />
    </div>
  );
}
