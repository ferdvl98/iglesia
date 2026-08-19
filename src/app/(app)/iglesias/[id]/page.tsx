import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSesion, puedeAdministrarIglesias } from "@/lib/authz";
import { IglesiaForm } from "../iglesia-form";

export default async function EditarIglesiaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sesion = await requireSesion();
  if (!puedeAdministrarIglesias(sesion)) redirect("/dashboard");

  const { id } = await params;
  const iglesia = await prisma.iglesia.findUnique({ where: { id } });
  if (!iglesia) notFound();

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-lg font-semibold text-slate-900">{iglesia.nombre}</h1>
      <IglesiaForm modo="editar" iglesia={iglesia} />
    </div>
  );
}
