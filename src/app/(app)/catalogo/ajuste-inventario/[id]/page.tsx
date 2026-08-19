import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSesion, puedeAdministrarCatalogo } from "@/lib/authz";
import { formatearFecha } from "@/lib/fecha";

export default async function DetalleAjusteInventarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sesion = await requireSesion();
  if (!puedeAdministrarCatalogo(sesion)) redirect("/dashboard");

  const { id } = await params;
  const ajuste = await prisma.ajusteInventario.findUnique({
    where: { id },
    include: {
      iglesia: true,
      realizadoPor: true,
      items: { include: { producto: true } },
    },
  });

  if (!ajuste) notFound();
  if (!sesion.esSuperAdmin && ajuste.iglesiaId !== sesion.iglesiaId) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Ajuste de inventario</h1>
        <p className="text-sm text-slate-500">
          {ajuste.iglesia.nombre} — Fecha del lote: {formatearFecha(ajuste.fecha)}
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Realizado por
            </dt>
            <dd className="mt-0.5 text-sm text-slate-900">{ajuste.realizadoPor?.nombre ?? "-"}</dd>
          </div>
          <div className="col-span-2 sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Comentario
            </dt>
            <dd className="mt-0.5 text-sm text-slate-900">{ajuste.comentario ?? "-"}</dd>
          </div>
        </dl>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Producto</th>
              <th className="px-4 py-2">Precio de compra</th>
              <th className="px-4 py-2">Precio de venta</th>
              <th className="px-4 py-2">Cantidad agregada</th>
              <th className="px-4 py-2">Disponible en este lote</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ajuste.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-2 text-slate-900">{item.producto.nombre}</td>
                <td className="px-4 py-2">
                  {item.precioCompra != null
                    ? `$${item.precioCompra.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`
                    : "-"}
                </td>
                <td className="px-4 py-2">
                  {item.precioVenta != null
                    ? `$${item.precioVenta.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`
                    : "-"}
                </td>
                <td className="px-4 py-2">+{item.cantidad}</td>
                <td className="px-4 py-2 text-slate-600">{item.cantidadDisponible}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <Link href="/catalogo/ajuste-inventario" className="text-sm text-slate-500 hover:underline">
          ← Volver a ajustes de inventario
        </Link>
      </div>
    </div>
  );
}
