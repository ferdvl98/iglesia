"use client";

import { useActionState } from "react";
import { Campo } from "@/components/form-fields";
import type { Ministro } from "@prisma/client";

type EstadoFormulario = { error: string } | null;

export function MinistroForm({
  action,
  ministro,
  iglesiaId,
  textoBoton,
}: {
  action: (prevState: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
  ministro?: Ministro;
  iglesiaId?: string;
  textoBoton: string;
}) {
  const [estado, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      {ministro && <input type="hidden" name="ministroId" value={ministro.id} />}
      {iglesiaId && <input type="hidden" name="iglesiaId" value={iglesiaId} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="Nombre completo" name="nombre" defaultValue={ministro?.nombre} required />
        <Campo
          label="Título"
          name="titulo"
          defaultValue={ministro?.titulo ?? undefined}
          hint='Ej. "Pbro.", "Mons.", "P.", "Obispo"'
        />
        <Campo label="Teléfono" name="telefono" defaultValue={ministro?.telefono ?? undefined} />
        <Campo label="Correo" name="email" type="email" defaultValue={ministro?.email ?? undefined} />
        <div className="sm:col-span-2">
          <Campo
            label="Dirección"
            name="direccion"
            defaultValue={ministro?.direccion ?? undefined}
            hint="Complétalo solo si no es el párroco de esta iglesia (p.ej. un celebrante visitante)."
          />
        </div>
      </div>

      {estado?.error && <p className="text-sm text-red-600">{estado.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Guardando..." : textoBoton}
      </button>
    </form>
  );
}
