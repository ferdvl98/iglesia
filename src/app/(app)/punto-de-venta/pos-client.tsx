"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { registrarVenta } from "./actions";
import { CobroModal } from "@/components/cobro-modal";
import type { Producto, MetodoPago } from "@prisma/client";

type LineaCarrito = { producto: Producto; cantidad: number; comentario: string };

function formatoMoneda(valor: number) {
  return `$${valor.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
}

export function PosClient({
  productos,
  iglesiaId,
  tituloIglesia,
}: {
  productos: Producto[];
  iglesiaId?: string;
  tituloIglesia?: string;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [carrito, setCarrito] = useState<Record<string, { cantidad: number; comentario: string }>>(
    {},
  );
  const [mostrarCobro, setMostrarCobro] = useState(false);
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");
  const [error, setError] = useState<string | null>(null);
  const [confirmacion, setConfirmacion] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputBusquedaRef = useRef<HTMLInputElement>(null);

  const resultados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return [];
    return productos
      .filter(
        (p) =>
          p.codigo?.toLowerCase().includes(termino) ||
          p.nombre.toLowerCase().includes(termino) ||
          p.descripcion?.toLowerCase().includes(termino),
      )
      .slice(0, 8);
  }, [busqueda, productos]);

  const lineas: LineaCarrito[] = useMemo(
    () =>
      Object.entries(carrito)
        .map(([productoId, datos]) => {
          const producto = productos.find((p) => p.id === productoId);
          return producto ? { producto, cantidad: datos.cantidad, comentario: datos.comentario } : null;
        })
        .filter((l): l is LineaCarrito => l !== null),
    [carrito, productos],
  );

  const total = lineas.reduce((acc, l) => acc + l.producto.precio * l.cantidad, 0);
  const faltaComentario = lineas.some((l) => l.producto.requiereComentario && !l.comentario.trim());

  function agregar(producto: Producto) {
    const enCarrito = carrito[producto.id]?.cantidad ?? 0;
    if (producto.tipo === "PRODUCTO" && enCarrito + 1 > (producto.stock ?? 0)) {
      setError(`No hay suficiente stock de "${producto.nombre}" (disponible: ${producto.stock ?? 0}).`);
      return;
    }
    setError(null);
    setConfirmacion(null);
    setCarrito((prev) => ({
      ...prev,
      [producto.id]: {
        cantidad: enCarrito + 1,
        comentario: prev[producto.id]?.comentario ?? "",
      },
    }));
    setBusqueda("");
    inputBusquedaRef.current?.focus();
  }

  function cambiarCantidad(productoId: string, cantidad: number) {
    setCarrito((prev) => {
      if (cantidad <= 0) {
        return Object.fromEntries(Object.entries(prev).filter(([id]) => id !== productoId));
      }
      const producto = productos.find((p) => p.id === productoId);
      const tope =
        producto?.tipo === "PRODUCTO" ? Math.min(cantidad, producto.stock ?? 0) : cantidad;
      return { ...prev, [productoId]: { ...prev[productoId], cantidad: tope } };
    });
  }

  function cambiarComentario(productoId: string, comentario: string) {
    setCarrito((prev) => ({ ...prev, [productoId]: { ...prev[productoId], comentario } }));
  }

  function confirmarVenta() {
    if (faltaComentario) {
      setError("Completa el comentario de los productos que lo requieren antes de cobrar.");
      return;
    }
    const items = lineas.map((l) => ({
      productoId: l.producto.id,
      cantidad: l.cantidad,
      comentario: l.comentario,
    }));
    // Se abre la pestaña ya (dentro del gesto del usuario) para que el ticket
    // se pueda imprimir automáticamente al cobrar, sin que el navegador la bloquee.
    const ventana = window.open("", "_blank");
    startTransition(async () => {
      const resultado = await registrarVenta(items, metodoPago as MetodoPago, iglesiaId);
      if ("error" in resultado) {
        ventana?.close();
        setError(resultado.error);
        return;
      }
      setError(null);
      setMostrarCobro(false);
      setCarrito({});
      setConfirmacion(`Venta registrada por ${formatoMoneda(resultado.total)}.`);
      if (ventana) {
        ventana.location.href = `/api/ventas/${resultado.ventaId}/pdf`;
      } else {
        window.open(`/api/ventas/${resultado.ventaId}/pdf`, "_blank");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Punto de venta</h1>
        <p className="text-sm text-slate-500">
          {tituloIglesia ?? "Vende productos y servicios del catálogo."}
        </p>
      </div>

      {confirmacion && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {confirmacion}
        </div>
      )}

      <div className="relative max-w-lg">
        <label className="block text-xs font-medium text-slate-600">
          Buscar producto o servicio (por código, nombre o descripción)
        </label>
        <input
          ref={inputBusquedaRef}
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Ej. bautizo, XV años, o un código..."
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        {resultados.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg">
            {resultados.map((producto) => {
              const agotado = producto.tipo === "PRODUCTO" && (producto.stock ?? 0) <= 0;
              return (
                <li key={producto.id}>
                  <button
                    type="button"
                    disabled={agotado}
                    onClick={() => agregar(producto)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-slate-900">
                        {producto.codigo && (
                          <span className="mr-1 font-mono text-xs text-slate-400">
                            [{producto.codigo}]
                          </span>
                        )}
                        {producto.nombre}
                      </span>
                      {producto.descripcion && (
                        <span className="block truncate text-xs text-slate-500">
                          {producto.descripcion}
                        </span>
                      )}
                      {producto.tipo === "PRODUCTO" && (
                        <span className={`block text-xs ${agotado ? "text-red-600" : "text-slate-400"}`}>
                          {agotado ? "Agotado" : `Stock: ${producto.stock}`}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 font-medium text-slate-700">
                      {formatoMoneda(producto.precio)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {busqueda.trim() && resultados.length === 0 && (
          <p className="mt-1 text-xs text-slate-400">Sin resultados.</p>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Producto / servicio</th>
              <th className="px-4 py-2">Precio</th>
              <th className="px-4 py-2">Cantidad</th>
              <th className="px-4 py-2">Comentario</th>
              <th className="px-4 py-2 text-right">Subtotal</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lineas.map((linea) => (
              <tr key={linea.producto.id}>
                <td className="px-4 py-2 text-slate-900">{linea.producto.nombre}</td>
                <td className="px-4 py-2 text-slate-600">{formatoMoneda(linea.producto.precio)}</td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    min={1}
                    max={linea.producto.tipo === "PRODUCTO" ? (linea.producto.stock ?? 0) : undefined}
                    value={linea.cantidad}
                    onChange={(e) =>
                      cambiarCantidad(linea.producto.id, Number(e.target.value) || 0)
                    }
                    className="w-16 rounded-md border border-slate-300 px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-4 py-2">
                  {linea.producto.requiereComentario ? (
                    <input
                      type="text"
                      value={linea.comentario}
                      onChange={(e) => cambiarComentario(linea.producto.id, e.target.value)}
                      placeholder="Requerido..."
                      className={`w-full rounded-md border px-2 py-1 text-sm ${
                        linea.comentario.trim() ? "border-slate-300" : "border-red-400"
                      }`}
                    />
                  ) : (
                    <span className="text-slate-300">-</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right font-medium text-slate-900">
                  {formatoMoneda(linea.producto.precio * linea.cantidad)}
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => cambiarCantidad(linea.producto.id, 0)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Quitar
                  </button>
                </td>
              </tr>
            ))}
            {lineas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Busca arriba un producto o servicio para agregarlo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex max-w-sm flex-col items-end gap-3 self-end">
        <div className="flex w-full items-center justify-between border-t border-slate-200 pt-3">
          <span className="text-sm font-medium text-slate-600">Total</span>
          <span className="text-lg font-semibold text-slate-900">{formatoMoneda(total)}</span>
        </div>

        {error && !mostrarCobro && <p className="w-full text-sm text-red-600">{error}</p>}

        <button
          type="button"
          disabled={lineas.length === 0 || pending}
          onClick={() => {
            if (faltaComentario) {
              setError("Completa el comentario de los productos que lo requieren antes de cobrar.");
              return;
            }
            setError(null);
            setMostrarCobro(true);
          }}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          Cobrar
        </button>
      </div>

      {mostrarCobro && (
        <CobroModal
          titulo="Confirma el cobro de la venta"
          precio={total}
          metodoPago={metodoPago}
          onMetodoPagoChange={setMetodoPago}
          onCancelar={() => setMostrarCobro(false)}
          error={error}
          botonConfirmar={
            <button
              type="button"
              onClick={confirmarVenta}
              disabled={pending}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {pending ? "Cobrando..." : "Confirmar cobro"}
            </button>
          }
        />
      )}
    </div>
  );
}
