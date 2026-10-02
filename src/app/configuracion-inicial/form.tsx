"use client";

import { useActionState } from "react";
import { crearPrimerSuperadmin } from "./actions";
import { Campo } from "@/components/form-fields";

export function PrimerSuperadminForm() {
  const [estado, formAction, pending] = useActionState(crearPrimerSuperadmin, null);

  return (
    <form action={formAction} className="mt-6 space-y-4 text-left">
      <Campo label="Nombre" name="nombre" required />
      <Campo label="Correo" name="email" type="email" required />
      <Campo
        label="Contraseña"
        name="password"
        type="password"
        required
        hint="Mínimo 8 caracteres. Esta será tu contraseña definitiva, no una temporal."
      />
      <Campo label="Repite la contraseña" name="confirmacion" type="password" required />

      {estado?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{estado.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Creando..." : "Crear administrador general"}
      </button>
    </form>
  );
}
