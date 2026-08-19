import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSesion, puedeAdministrarCatalogo } from "@/lib/authz";
import { formatearFecha } from "@/lib/fecha";

export default async function DetalleTransferenciaInventarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sesion = await requireSesion();
  if (!puedeAdministrarCatalogo(sesion)) redirect("/dashboard");

  const { id } = await params;
  const transferencia = await prisma.transferenciaInventario.findUnique({
    where: { id },
    include: {
      iglesiaOrigen: true,
      iglesiaDestino: true,
      realizadoPor: true,
      items: {
        include: {
          productoOrigen: true,
          productoDestino: true,
          lotes: { include: { loteOrigen: true } },
        },
      },
    },
  });

  if (!transferencia) notFound();
  if (
    !sesion.esSuperAdmin &&
    transferencia.iglesiaOrigenId !== sesion.iglesiaId &&
    transferencia.iglesiaDestinoId !== sesion.iglesiaId
  ) {
    notFound();
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Transferencia de inventario</h1>
        <p className="text-sm text-slate-500">
          {transferencia.iglesiaOrigen.nombre} → {transferencia.iglesiaDestino.nombre} — Fecha:{" "}
          {formatearFecha(transferencia.fecha)}
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Realizado por
            </dt>
            <dd className="mt-0.5 text-sm text-slate-900">
              {transferencia.realizadoPor?.nombre ?? "-"}
            </dd>
          </div>
          <div className="col-span-2 sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Comentario
            </dt>
            <dd className="mt-0.5 text-sm text-slate-900">{transferencia.comentario ?? "-"}</dd>
          </div>
        </dl>
      </div>

      <div className="space-y-4">
        {transferencia.items.map((item) => (
          <div key={item.id} className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-sm">
              <span className="font-medium text-slate-900">{item.productoOrigen.nombre}</span>
              <span className="text-slate-500"> → {item.productoDestino.nombre}</span>
              <span className="ml-2 text-slate-500">({item.cantidad} unidades)</span>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Lote de origen</th>
                  <th className="px-4 py-2">Precio de compra</th>
                  <th className="px-4 py-2">Cantidad tomada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {item.lotes.map((lote) => (
                  <tr key={lote.id}>
                    <td className="px-4 py-2 text-slate-600">Lote #{lote.loteOrigenId.slice(-6)}</td>
                    <td className="px-4 py-2">
                      {lote.loteOrigen.precioCompra != null
                        ? `$${lote.loteOrigen.precioCompra.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`
                        : "-"}
                    </td>
                    <td className="px-4 py-2">{lote.cantidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div>
        <Link href="/catalogo/transferencia-inventario" className="text-sm text-slate-500 hover:underline">
          ← Volver a transferencias de inventario
        </Link>
      </div>
    </div>
  );
}
