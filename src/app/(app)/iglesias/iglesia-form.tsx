"use client";

import { useActionState } from "react";
import { crearIglesia, actualizarIglesia } from "./actions";
import { Campo } from "@/components/form-fields";
import type { Iglesia } from "@prisma/client";

export function IglesiaForm({
  modo,
  iglesia,
}: {
  modo: "crear" | "editar";
  iglesia?: Iglesia;
}) {
  const [estado, formAction, pending] = useActionState(
    modo === "crear" ? crearIglesia : actualizarIglesia,
    null,
  );

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      {modo === "editar" && iglesia && (
        <input type="hidden" name="iglesiaId" value={iglesia.id} />
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="Nombre" name="nombre" required defaultValue={iglesia?.nombre} />
        <Campo label="Diócesis" name="diocesis" defaultValue={iglesia?.diocesis ?? undefined} />
        <Campo label="Dirección" name="direccion" defaultValue={iglesia?.direccion ?? undefined} />
        <Campo label="Ciudad" name="ciudad" defaultValue={iglesia?.ciudad ?? undefined} />
        <Campo label="Estado" name="estado" defaultValue={iglesia?.estado ?? undefined} />
        <Campo label="Teléfono" name="telefono" defaultValue={iglesia?.telefono ?? undefined} />
        <Campo label="Correo" name="email" type="email" defaultValue={iglesia?.email ?? undefined} />
      </div>
      {modo === "editar" && (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="activa" defaultChecked={iglesia?.activa ?? true} />
          Iglesia activa
        </label>
      )}
      {estado?.error && <p className="text-sm text-red-600">{estado.error}</p>}
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
