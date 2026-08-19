import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSesion, puedeAdministrarCatalogo } from "@/lib/authz";
import { formatearFecha } from "@/lib/fecha";
import { AjusteInventarioForm } from "./ajuste-form";

export default async function AjusteInventarioPage() {
  const sesion = await requireSesion();
  if (!puedeAdministrarCatalogo(sesion)) redirect("/dashboard");

  const iglesias =
    sesion.esSuperAdmin
      ? await prisma.iglesia.findMany({ where: { activa: true }, orderBy: { nombre: "asc" } })
      : [];

  const productos = await prisma.producto.findMany({
    where:
      sesion.esSuperAdmin
        ? { tipo: "PRODUCTO" }
        : { tipo: "PRODUCTO", iglesiaId: sesion.iglesiaId! },
    orderBy: { nombre: "asc" },
  });

  const ajustes = await prisma.ajusteInventario.findMany({
    where: sesion.esSuperAdmin ? {} : { iglesiaId: sesion.iglesiaId! },
    orderBy: { fecha: "desc" },
    take: 20,
    include: { iglesia: true, realizadoPor: true, items: true },
  });

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Ajuste de inventario</h1>
        <p className="text-sm text-slate-500">
          Registra entradas de almacén. Solo se puede agregar stock aquí; cada movimiento queda
          registrado con fecha y usuario.
        </p>
      </div>

      <AjusteInventarioForm
        iglesias={iglesias}
        productos={productos}
        iglesiaFija={sesion.esSuperAdmin ? undefined : sesion.iglesiaId!}
      />

      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-900">Ajustes recientes</h2>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Fecha del lote</th>
                {sesion.esSuperAdmin && <th className="px-4 py-2">Iglesia</th>}
                <th className="px-4 py-2">Partidas</th>
                <th className="px-4 py-2">Comentario</th>
                <th className="px-4 py-2">Realizado por</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ajustes.map((ajuste) => (
                <tr key={ajuste.id}>
                  <td className="px-4 py-2">{formatearFecha(ajuste.fecha)}</td>
                  {sesion.esSuperAdmin && (
                    <td className="px-4 py-2">{ajuste.iglesia.nombre}</td>
                  )}
                  <td className="px-4 py-2">{ajuste.items.length}</td>
                  <td className="px-4 py-2 text-slate-600">{ajuste.comentario ?? "-"}</td>
                  <td className="px-4 py-2">{ajuste.realizadoPor?.nombre ?? "-"}</td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/catalogo/ajuste-inventario/${ajuste.id}`}
                      className="text-slate-600 hover:underline"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
              {ajustes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    Aún no se han registrado ajustes de inventario.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
