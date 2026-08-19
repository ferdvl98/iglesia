import { redirect } from "next/navigation";
import { requireSesion, puedeUsarPuntoDeVenta } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { PosClient } from "./pos-client";

export default async function PuntoDeVentaPage({
  searchParams,
}: {
  searchParams: Promise<{ iglesiaId?: string }>;
}) {
  const sesion = await requireSesion();
  if (!puedeUsarPuntoDeVenta(sesion)) redirect("/dashboard");

  if (sesion.esSuperAdmin) {
    const params = await searchParams;
    const iglesias = await prisma.iglesia.findMany({
      where: { activa: true },
      orderBy: { nombre: "asc" },
    });

    if (!params.iglesiaId) {
      return (
        <div className="max-w-md space-y-4">
          <h1 className="text-lg font-semibold text-slate-900">Punto de venta</h1>
          <p className="text-sm text-slate-500">Selecciona la iglesia en la que vas a vender.</p>
          <form className="rounded-lg border border-slate-200 bg-white p-4">
            <label className="block text-xs font-medium text-slate-600">Iglesia</label>
            <select
              name="iglesiaId"
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {iglesias.map((iglesia) => (
                <option key={iglesia.id} value={iglesia.id}>
                  {iglesia.nombre}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Continuar
            </button>
          </form>
        </div>
      );
    }

    const iglesia = iglesias.find((i) => i.id === params.iglesiaId);
    if (!iglesia) redirect("/punto-de-venta");

    const productos = await prisma.producto.findMany({
      where: { iglesiaId: iglesia.id, activo: true },
      orderBy: { nombre: "asc" },
    });

    return (
      <PosClient productos={productos} iglesiaId={iglesia.id} tituloIglesia={iglesia.nombre} />
    );
  }

  const productos = await prisma.producto.findMany({
    where: { iglesiaId: sesion.iglesiaId!, activo: true },
    orderBy: { nombre: "asc" },
  });

  return <PosClient productos={productos} />;
}
