"use client";

import { useActionState } from "react";
import { cambiarMiPassword } from "./actions";
import { Campo } from "@/components/form-fields";

export function CambiarPasswordForm({ obligatorio }: { obligatorio: boolean }) {
  const [estado, formAction, pending] = useActionState(cambiarMiPassword, null);

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <Campo
        label={obligatorio ? "Contraseña temporal" : "Contraseña actual"}
        name="actual"
        type="password"
        required
      />
      <Campo
        label="Contraseña nueva"
        name="nueva"
        type="password"
        required
        hint="Mínimo 8 caracteres."
      />
      <Campo label="Repite la contraseña nueva" name="confirmacion" type="password" required />

      {estado?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{estado.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Cambiar contraseña"}
      </button>
    </form>
  );
}
