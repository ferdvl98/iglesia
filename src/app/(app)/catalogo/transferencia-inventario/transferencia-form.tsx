"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registrarTransferencia, type LoteSeleccionado } from "./actions";
import type { AjusteInventario, AjusteInventarioItem, Iglesia, Producto } from "@prisma/client";

type Lote = AjusteInventarioItem & { ajuste: AjusteInventario };
type ProductoConLotes = Producto & { ajustesInventarioItems: Lote[] };

type Linea = {
  productoOrigenId: string;
  productoDestinoId: string;
  cantidad: string;
  cantidadesPorLote: Record<string, string>;
};

function lineaVacia(): Linea {
  return { productoOrigenId: "", productoDestinoId: "", cantidad: "1", cantidadesPorLote: {} };
}

export function TransferenciaInventarioForm({
  iglesias,
  productos,
  iglesiaFija,
}: {
  iglesias: Iglesia[];
  productos: ProductoConLotes[];
  iglesiaFija?: string;
}) {
  const router = useRouter();
  const otraIglesia = iglesias.find((i) => i.id !== iglesiaFija)?.id ?? "";
  const [iglesiaOrigenId, setIglesiaOrigenId] = useState(iglesiaFija ?? iglesias[0]?.id ?? "");
  const [iglesiaDestinoId, setIglesiaDestinoId] = useState(otraIglesia);
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [comentario, setComentario] = useState("");
  const [lineas, setLineas] = useState<Linea[]>([lineaVacia()]);
  const [error, setError] = useState<string | null>(null);
  const [confirmacion, setConfirmacion] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const productosOrigen = useMemo(
    () => productos.filter((p) => p.iglesiaId === iglesiaOrigenId),
    [productos, iglesiaOrigenId],
  );
  const productosDestino = useMemo(
    () => productos.filter((p) => p.iglesiaId === iglesiaDestinoId),
    [productos, iglesiaDestinoId],
  );

  function actualizarLinea(index: number, cambios: Partial<Linea>) {
    setLineas((prev) => prev.map((l, i) => (i === index ? { ...l, ...cambios } : l)));
  }

  function agregarLinea() {
    setLineas((prev) => [...prev, lineaVacia()]);
  }

  function quitarLinea(index: number) {
    setLineas((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  function alSeleccionarProductoOrigen(index: number, productoOrigenId: string) {
    const origen = productosOrigen.find((p) => p.id === productoOrigenId);
    const destinoCoincidente = origen?.codigo
      ? productosDestino.find((p) => p.codigo === origen.codigo)
      : undefined;
    actualizarLinea(index, {
      productoOrigenId,
      productoDestinoId: destinoCoincidente?.id ?? "",
      cantidadesPorLote: {},
    });
  }

  function alCambiarCantidadLote(index: number, loteId: string, valor: string) {
    setLineas((prev) =>
      prev.map((l, i) =>
        i === index ? { ...l, cantidadesPorLote: { ...l.cantidadesPorLote, [loteId]: valor } } : l,
      ),
    );
  }

  function totalSeleccionadoEnLotes(linea: Linea) {
    return Object.values(linea.cantidadesPorLote).reduce((acc, v) => acc + (Number(v) || 0), 0);
  }

  function guardar() {
    setConfirmacion(null);
    if (!iglesiaOrigenId || !iglesiaDestinoId) {
      setError("Selecciona la iglesia de origen y la de destino.");
      return;
    }
    if (iglesiaOrigenId === iglesiaDestinoId) {
      setError("La iglesia de origen y destino deben ser distintas.");
      return;
    }

    const lineasValidas = lineas.filter((l) => l.productoOrigenId);
    if (lineasValidas.length === 0) {
      setError("Agrega al menos un producto a la transferencia.");
      return;
    }

    const partidas: {
      productoOrigenId: string;
      productoDestinoId: string;
      cantidad: number;
      lotes: LoteSeleccionado[];
    }[] = [];

    for (const linea of lineasValidas) {
      const origen = productosOrigen.find((p) => p.id === linea.productoOrigenId);
      if (!linea.productoDestinoId) {
        setError(`Selecciona el producto correspondiente en la iglesia destino para "${origen?.nombre}".`);
        return;
      }
      const cantidad = Number(linea.cantidad) || 0;
      const lotes = Object.entries(linea.cantidadesPorLote)
        .map(([loteOrigenId, cantidadStr]) => ({ loteOrigenId, cantidad: Number(cantidadStr) || 0 }))
        .filter((l) => l.cantidad > 0);
      const sumaLotes = lotes.reduce((acc, l) => acc + l.cantidad, 0);
      if (sumaLotes !== cantidad) {
        setError(
          `La suma de los lotes seleccionados de "${origen?.nombre}" (${sumaLotes}) debe ser igual a la cantidad a transferir (${cantidad}).`,
        );
        return;
      }
      partidas.push({
        productoOrigenId: linea.productoOrigenId,
        productoDestinoId: linea.productoDestinoId,
        cantidad,
        lotes,
      });
    }

    startTransition(async () => {
      const resultado = await registrarTransferencia(
        iglesiaOrigenId,
        iglesiaDestinoId,
        fecha,
        comentario.trim() || null,
        partidas,
      );
      if ("error" in resultado) {
        setError(resultado.error);
        return;
      }
      setError(null);
      setLineas([lineaVacia()]);
      setComentario("");
      setConfirmacion("Transferencia de inventario registrada.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div>
          <label className="block text-xs font-medium text-slate-600">
            Ubicación origen <span className="text-red-500">*</span>
          </label>
          <select
            value={iglesiaOrigenId}
            onChange={(e) => {
              setIglesiaOrigenId(e.target.value);
              setLineas([lineaVacia()]);
            }}
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {iglesias.map((iglesia) => (
              <option key={iglesia.id} value={iglesia.id}>
                {iglesia.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600">
            Ubicación destino <span className="text-red-500">*</span>
          </label>
          <select
            value={iglesiaDestinoId}
            onChange={(e) => {
              setIglesiaDestinoId(e.target.value);
              setLineas([lineaVacia()]);
            }}
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {iglesias.map((iglesia) => (
              <option key={iglesia.id} value={iglesia.id}>
                {iglesia.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600">
            Fecha <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600">Comentario</label>
          <input
            type="text"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Ej. traslado de excedente..."
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="space-y-3">
        {lineas.map((linea, index) => {
          const origen = productosOrigen.find((p) => p.id === linea.productoOrigenId);
          const destinoCoincidente = origen?.codigo
            ? productosDestino.find((p) => p.codigo === origen.codigo)
            : undefined;
          const seleccionado = totalSeleccionadoEnLotes(linea);
          const cantidad = Number(linea.cantidad) || 0;

          return (
            <div key={index} className="rounded-md border border-slate-200 p-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_2fr_1fr_auto]">
                <div>
                  <label className="block text-xs font-medium text-slate-600">Producto (origen)</label>
                  <select
                    value={linea.productoOrigenId}
                    onChange={(e) => alSeleccionarProductoOrigen(index, e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  >
                    <option value="">-- Selecciona --</option>
                    {productosOrigen.map((producto) => (
                      <option key={producto.id} value={producto.id}>
                        {producto.codigo ? `[${producto.codigo}] ` : ""}
                        {producto.nombre} (stock: {producto.stock ?? 0})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600">Producto (destino)</label>
                  {destinoCoincidente ? (
                    <p className="mt-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm text-slate-700">
                      {destinoCoincidente.nombre}
                    </p>
                  ) : origen ? (
                    <select
                      value={linea.productoDestinoId}
                      onChange={(e) => actualizarLinea(index, { productoDestinoId: e.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                    >
                      <option value="">-- No hay coincidencia, selecciona --</option>
                      {productosDestino.map((producto) => (
                        <option key={producto.id} value={producto.id}>
                          {producto.nombre}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="mt-1 text-sm text-slate-400">-</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600">Cantidad a transferir</label>
                  <input
                    type="number"
                    min={1}
                    step="1"
                    value={linea.cantidad}
                    onChange={(e) => actualizarLinea(index, { cantidad: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => quitarLinea(index)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Quitar
                  </button>
                </div>
              </div>

              {origen && (
                <div className="mt-3">
                  <p className="mb-1 text-xs font-medium text-slate-600">
                    Selecciona de qué lote(s) de origen se toma ({seleccionado}/{cantidad})
                  </p>
                  {origen.ajustesInventarioItems.length === 0 ? (
                    <p className="text-xs text-slate-400">No hay lotes con stock disponible para este producto.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-md border border-slate-200">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                          <tr>
                            <th className="px-3 py-1.5">Fecha del lote</th>
                            <th className="px-3 py-1.5">Precio de compra</th>
                            <th className="px-3 py-1.5">Disponible</th>
                            <th className="px-3 py-1.5">Cantidad a tomar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {origen.ajustesInventarioItems.map((lote) => (
                            <tr key={lote.id}>
                              <td className="px-3 py-1.5">
                                {new Date(lote.ajuste.fecha).toLocaleDateString("es-MX", { timeZone: "UTC" })}
                              </td>
                              <td className="px-3 py-1.5">
                                {lote.precioCompra != null
                                  ? `$${lote.precioCompra.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`
                                  : "-"}
                              </td>
                              <td className="px-3 py-1.5">{lote.cantidadDisponible}</td>
                              <td className="px-3 py-1.5">
                                <input
                                  type="number"
                                  min={0}
                                  max={lote.cantidadDisponible}
                                  step="1"
                                  value={linea.cantidadesPorLote[lote.id] ?? ""}
                                  onChange={(e) => alCambiarCantidadLote(index, lote.id, e.target.value)}
                                  className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={agregarLinea}
        className="text-sm font-medium text-slate-600 hover:underline"
      >
        + Agregar producto
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {confirmacion && <p className="text-sm text-green-700">{confirmacion}</p>}

      <div>
        <button
          type="button"
          onClick={guardar}
          disabled={pending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {pending ? "Guardando..." : "Guardar transferencia"}
        </button>
      </div>
    </div>
  );
}
