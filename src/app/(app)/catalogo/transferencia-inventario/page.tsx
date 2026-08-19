import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSesion, puedeAdministrarCatalogo } from "@/lib/authz";
import { formatearFecha } from "@/lib/fecha";
import { TransferenciaInventarioForm } from "./transferencia-form";

export default async function TransferenciaInventarioPage() {
  const sesion = await requireSesion();
  if (!puedeAdministrarCatalogo(sesion)) redirect("/dashboard");

  const iglesias = await prisma.iglesia.findMany({
    where: { activa: true },
    orderBy: { nombre: "asc" },
  });

  const productos = await prisma.producto.findMany({
    where: { tipo: "PRODUCTO" },
    orderBy: { nombre: "asc" },
    include: {
      ajustesInventarioItems: {
        where: { cantidadDisponible: { gt: 0 } },
        orderBy: [{ ajuste: { fecha: "asc" } }],
        include: { ajuste: true },
      },
    },
  });

  const transferencias = await prisma.transferenciaInventario.findMany({
    where:
      sesion.esSuperAdmin
        ? {}
        : { OR: [{ iglesiaOrigenId: sesion.iglesiaId! }, { iglesiaDestinoId: sesion.iglesiaId! }] },
    orderBy: { fecha: "desc" },
    take: 20,
    include: { iglesiaOrigen: true, iglesiaDestino: true, realizadoPor: true, items: true },
  });

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Transferencia de inventario</h1>
        <p className="text-sm text-slate-500">
          Mueve stock de productos entre iglesias, seleccionando de qué lote(s) de origen se toma.
        </p>
      </div>

      <TransferenciaInventarioForm
        iglesias={iglesias}
        productos={productos}
        iglesiaFija={sesion.esSuperAdmin ? undefined : sesion.iglesiaId!}
      />

      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-900">Transferencias recientes</h2>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Origen</th>
                <th className="px-4 py-2">Destino</th>
                <th className="px-4 py-2">Partidas</th>
                <th className="px-4 py-2">Comentario</th>
                <th className="px-4 py-2">Realizado por</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transferencias.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-2">{formatearFecha(t.fecha)}</td>
                  <td className="px-4 py-2">{t.iglesiaOrigen.nombre}</td>
                  <td className="px-4 py-2">{t.iglesiaDestino.nombre}</td>
                  <td className="px-4 py-2">{t.items.length}</td>
                  <td className="px-4 py-2 text-slate-600">{t.comentario ?? "-"}</td>
                  <td className="px-4 py-2">{t.realizadoPor?.nombre ?? "-"}</td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/catalogo/transferencia-inventario/${t.id}`}
                      className="text-slate-600 hover:underline"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
              {transferencias.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                    Aún no se han registrado transferencias de inventario.
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
