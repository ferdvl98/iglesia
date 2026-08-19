"use client";

import { useState } from "react";
import Link from "next/link";
import { useActionState } from "react";
import { crearProducto, actualizarProducto } from "./actions";
import { Campo } from "@/components/form-fields";
import type { Producto } from "@prisma/client";

export function ProductoForm({
  modo,
  producto,
  iglesiaId,
}: {
  modo: "crear" | "editar";
  producto?: Producto;
  iglesiaId?: string;
}) {
  const [estado, formAction, pending] = useActionState(
    modo === "crear" ? crearProducto : actualizarProducto,
    null,
  );
  const [tipo, setTipo] = useState(producto?.tipo ?? "SERVICIO");

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      {iglesiaId && <input type="hidden" name="iglesiaId" value={iglesiaId} />}
      {modo === "editar" && producto && (
        <input type="hidden" name="productoId" value={producto.id} />
      )}

      <div>
        <label className="block text-xs font-medium text-slate-600">
          Tipo {modo === "crear" && <span className="text-red-500">*</span>}
        </label>
        {modo === "crear" ? (
          <select
            name="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as "PRODUCTO" | "SERVICIO")}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm sm:w-64"
          >
            <option value="SERVICIO">Servicio (sin inventario, ej. misas)</option>
            <option value="PRODUCTO">Producto (con inventario)</option>
          </select>
        ) : (
          <p className="mt-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 sm:w-64">
            {tipo === "PRODUCTO" ? "Producto (con inventario)" : "Servicio (sin inventario)"}
            <span className="ml-2 text-xs text-slate-400">no se puede cambiar</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="Nombre" name="nombre" required defaultValue={producto?.nombre} />
        <Campo
          label="Código"
          name="codigo"
          hint="Opcional. Útil para buscarlo rápido en el punto de venta."
          defaultValue={producto?.codigo ?? undefined}
        />
      </div>

      <div>
        <label htmlFor="descripcion" className="block text-xs font-medium text-slate-600">
          Descripción
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={3}
          defaultValue={producto?.descripcion ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo
          label="Precio"
          name="precio"
          type="number"
          step="0.01"
          min="0"
          required
          defaultValue={producto ? String(producto.precio) : undefined}
        />

        {tipo === "PRODUCTO" &&
          (modo === "crear" ? (
            <Campo
              label="Stock inicial"
              name="stock"
              type="number"
              step="1"
              min="0"
              required
              defaultValue="0"
              hint="Después de crearlo, solo se puede aumentar con un ajuste de inventario."
            />
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-600">Stock actual</label>
              <p className="mt-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {producto?.stock ?? 0} unidades
              </p>
              <Link
                href="/catalogo/ajuste-inventario"
                className="mt-1 inline-block text-xs text-slate-600 hover:underline"
              >
                Ir a Ajuste de inventario →
              </Link>
            </div>
          ))}
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="requiereComentario"
          defaultChecked={producto?.requiereComentario ?? false}
        />
        Requiere un comentario al venderse (ej. a nombre de quién se ofrece la misa)
      </label>

      {modo === "editar" && (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="activo" defaultChecked={producto?.activo ?? true} />
          Producto activo (disponible en el punto de venta)
        </label>
      )}

      {estado && "error" in estado && <p className="text-sm text-red-600">{estado.error}</p>}
      {estado && "ok" in estado && <p className="text-sm text-green-700">Guardado.</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Guardar"}
      </button>
    </form>
  );
}
