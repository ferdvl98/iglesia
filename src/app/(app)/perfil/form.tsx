"use client";

import { useActionState } from "react";
import { actualizarMiPerfil } from "./actions";
import { Campo } from "@/components/form-fields";

export function PerfilForm({ nombre, email }: { nombre: string; email: string }) {
  const [estado, formAction, pending] = useActionState(actualizarMiPerfil, null);

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <Campo label="Nombre" name="nombre" required defaultValue={nombre} />
      <Campo
        label="Correo"
        name="email"
        type="email"
        required
        defaultValue={email}
        hint="Es el correo con el que inicias sesión."
      />

      {estado && "error" in estado && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{estado.error}</p>
      )}
      {estado && "ok" in estado && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
          Tus datos quedaron guardados.
        </p>
      )}

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
