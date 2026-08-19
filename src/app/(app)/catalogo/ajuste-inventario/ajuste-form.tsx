"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registrarAjusteInventario } from "./actions";
import type { Iglesia, Producto } from "@prisma/client";

type Fila = {
  productoId: string;
  precioCompra: string;
  precioVenta: string;
  cantidad: string;
};

function filaVacia(): Fila {
  return { productoId: "", precioCompra: "", precioVenta: "", cantidad: "1" };
}

export function AjusteInventarioForm({
  iglesias,
  productos,
  iglesiaFija,
}: {
  iglesias: Iglesia[];
  productos: Producto[];
  iglesiaFija?: string;
}) {
  const router = useRouter();
  const [iglesiaId, setIglesiaId] = useState(iglesiaFija ?? iglesias[0]?.id ?? "");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [comentario, setComentario] = useState("");
  const [filas, setFilas] = useState<Fila[]>([filaVacia()]);
  const [error, setError] = useState<string | null>(null);
  const [confirmacion, setConfirmacion] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const productosDisponibles = productos.filter((p) => p.iglesiaId === iglesiaId);

  function actualizarFila(index: number, cambios: Partial<Fila>) {
    setFilas((prev) => prev.map((f, i) => (i === index ? { ...f, ...cambios } : f)));
  }

  function agregarFila() {
    setFilas((prev) => [...prev, filaVacia()]);
  }

  function quitarFila(index: number) {
    setFilas((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  function alSeleccionarProducto(index: number, productoId: string) {
    const producto = productosDisponibles.find((p) => p.id === productoId);
    actualizarFila(index, {
      productoId,
      precioVenta: producto ? String(producto.precio) : "",
    });
  }

  function guardar() {
    setConfirmacion(null);
    if (!iglesiaId) {
      setError("Selecciona la iglesia a la que se agregará el stock.");
      return;
    }
    const filasValidas = filas.filter((f) => f.productoId);
    if (filasValidas.length === 0) {
      setError("Agrega al menos un producto al ajuste.");
      return;
    }

    const partidas = filasValidas.map((f) => ({
      productoId: f.productoId,
      cantidad: Number(f.cantidad) || 0,
      precioCompra: f.precioCompra.trim() === "" ? null : Number(f.precioCompra),
      precioVenta: f.precioVenta.trim() === "" ? null : Number(f.precioVenta),
    }));

    startTransition(async () => {
      const resultado = await registrarAjusteInventario(
        iglesiaId,
        fecha,
        comentario.trim() || null,
        partidas,
      );
      if ("error" in resultado) {
        setError(resultado.error);
        return;
      }
      setError(null);
      setFilas([filaVacia()]);
      setComentario("");
      setConfirmacion("Ajuste de inventario registrado.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-medium text-slate-600">
            Iglesia <span className="text-red-500">*</span>
          </label>
          {iglesiaFija ? (
            <p className="mt-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {iglesias.find((i) => i.id === iglesiaFija)?.nombre ?? "Tu iglesia"}
            </p>
          ) : (
            <select
              value={iglesiaId}
              onChange={(e) => {
                setIglesiaId(e.target.value);
                setFilas([filaVacia()]);
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
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600">
            Fecha del lote <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-slate-500">
            Determina el orden en que se consume este lote (FIFO) al vender.
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600">Comentario</label>
          <input
            type="text"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Ej. compra a proveedor, donativo..."
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Producto</th>
              <th className="px-3 py-2">Precio de compra</th>
              <th className="px-3 py-2">Precio de venta</th>
              <th className="px-3 py-2">Stock a agregar</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filas.map((fila, index) => (
              <tr key={index}>
                <td className="px-3 py-2">
                  <select
                    value={fila.productoId}
                    onChange={(e) => alSeleccionarProducto(index, e.target.value)}
                    className="w-full min-w-[10rem] rounded-md border border-slate-300 px-2 py-1 text-sm"
                  >
                    <option value="">-- Selecciona --</option>
                    {productosDisponibles.map((producto) => (
                      <option key={producto.id} value={producto.id}>
                        {producto.codigo ? `[${producto.codigo}] ` : ""}
                        {producto.nombre} (stock: {producto.stock ?? 0})
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={fila.precioCompra}
                    onChange={(e) => actualizarFila(index, { precioCompra: e.target.value })}
                    placeholder="0.00"
                    className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={fila.precioVenta}
                    onChange={(e) => actualizarFila(index, { precioVenta: e.target.value })}
                    placeholder="0.00"
                    className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={1}
                    step="1"
                    value={fila.cantidad}
                    onChange={(e) => actualizarFila(index, { cantidad: e.target.value })}
                    className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => quitarFila(index)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Quitar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={agregarFila}
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
          {pending ? "Guardando..." : "Guardar ajuste"}
        </button>
      </div>
    </div>
  );
}
