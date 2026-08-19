import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSesion, puedeAdministrarCatalogo } from "@/lib/authz";

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ iglesiaId?: string }>;
}) {
  const sesion = await requireSesion();
  if (!puedeAdministrarCatalogo(sesion)) redirect("/dashboard");

  if (sesion.esSuperAdmin) {
    const params = await searchParams;
    const iglesias = await prisma.iglesia.findMany({
      where: { activa: true },
      orderBy: { nombre: "asc" },
    });

    if (!params.iglesiaId) {
      return (
        <div className="max-w-md space-y-4">
          <h1 className="text-lg font-semibold text-slate-900">Catálogo</h1>
          <p className="text-sm text-slate-500">Selecciona la iglesia cuyo catálogo quieres administrar.</p>
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
    if (!iglesia) redirect("/catalogo");

    const productos = await prisma.producto.findMany({
      where: { iglesiaId: iglesia.id },
      orderBy: { nombre: "asc" },
    });

    return (
      <ListaCatalogo
        productos={productos}
        titulo={`Catálogo — ${iglesia.nombre}`}
        nuevoHref={`/catalogo/nuevo?iglesiaId=${iglesia.id}`}
        editarHref={(id) => `/catalogo/${id}?iglesiaId=${iglesia.id}`}
      />
    );
  }

  const productos = await prisma.producto.findMany({
    where: { iglesiaId: sesion.iglesiaId! },
    orderBy: { nombre: "asc" },
  });

  return (
    <ListaCatalogo
      productos={productos}
      titulo="Catálogo de productos y servicios"
      nuevoHref="/catalogo/nuevo"
      editarHref={(id) => `/catalogo/${id}`}
    />
  );
}

function ListaCatalogo({
  productos,
  titulo,
  nuevoHref,
  editarHref,
}: {
  productos: {
    id: string;
    codigo: string | null;
    nombre: string;
    descripcion: string | null;
    precio: number;
    tipo: string;
    stock: number | null;
    requiereComentario: boolean;
    activo: boolean;
  }[];
  titulo: string;
  nuevoHref: string;
  editarHref: (id: string) => string;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{titulo}</h1>
          <p className="text-sm text-slate-500">
            Productos y servicios disponibles para vender en el punto de venta.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/catalogo/ajuste-inventario"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Ajuste de inventario
          </Link>
          <Link
            href="/catalogo/transferencia-inventario"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Transferencia de inventario
          </Link>
          <Link
            href={nuevoHref}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Nuevo producto
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Código</th>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Tipo</th>
              <th className="px-4 py-2">Descripción</th>
              <th className="px-4 py-2">Precio</th>
              <th className="px-4 py-2">Stock</th>
              <th className="px-4 py-2">Comentario</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {productos.map((producto) => (
              <tr key={producto.id}>
                <td className="px-4 py-2 font-mono text-xs text-slate-600">{producto.codigo ?? "-"}</td>
                <td className="px-4 py-2 font-medium text-slate-900">{producto.nombre}</td>
                <td className="px-4 py-2">
                  {producto.tipo === "PRODUCTO" ? "Producto" : "Servicio"}
                </td>
                <td className="px-4 py-2 text-slate-600">{producto.descripcion ?? "-"}</td>
                <td className="px-4 py-2">
                  ${producto.precio.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-2">
                  {producto.tipo === "PRODUCTO" ? (
                    <span
                      className={
                        (producto.stock ?? 0) <= 0
                          ? "font-medium text-red-600"
                          : "text-slate-700"
                      }
                    >
                      {producto.stock ?? 0}
                    </span>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-4 py-2">{producto.requiereComentario ? "Sí" : "-"}</td>
                <td className="px-4 py-2">
                  {producto.activo ? (
                    <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">Activo</span>
                  ) : (
                    <span className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-600">Inactivo</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  <Link href={editarHref(producto.id)} className="text-slate-600 hover:underline">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {productos.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-slate-400">
                  Aún no hay productos ni servicios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
