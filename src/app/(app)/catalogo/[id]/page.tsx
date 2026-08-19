import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSesion, puedeAdministrarCatalogo } from "@/lib/authz";
import { ProductoForm } from "../producto-form";

export default async function EditarProductoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ iglesiaId?: string }>;
}) {
  const sesion = await requireSesion();
  if (!puedeAdministrarCatalogo(sesion)) redirect("/dashboard");

  const { id } = await params;
  const sp = await searchParams;
  const producto = await prisma.producto.findUnique({ where: { id } });
  if (!producto) notFound();
  if (!sesion.esSuperAdmin && producto.iglesiaId !== sesion.iglesiaId) notFound();

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-lg font-semibold text-slate-900">{producto.nombre}</h1>
      <ProductoForm
        modo="editar"
        producto={producto}
        iglesiaId={sesion.esSuperAdmin ? sp.iglesiaId : undefined}
      />
    </div>
  );
}
