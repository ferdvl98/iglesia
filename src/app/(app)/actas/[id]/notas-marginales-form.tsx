"use client";

import { useActionState } from "react";
import { actualizarNotasMarginalesAction } from "../actions";

export function NotasMarginalesForm({
  actaId,
  notasActuales,
}: {
  actaId: string;
  notasActuales: string | null;
}) {
  const [estado, formAction, pending] = useActionState(actualizarNotasMarginalesAction, null);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="actaId" value={actaId} />
      <textarea
        name="notasMarginales"
        rows={3}
        defaultValue={notasActuales ?? ""}
        placeholder='Ej. "Se confirmó en la Catedral de Puebla el 12 de mayo de 2030. Contrajo matrimonio el 20 de agosto de 2045, Libro 3, Acta 45."'
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {pending ? "Guardando..." : "Guardar notas marginales"}
        </button>
        {estado?.error && <p className="text-sm text-red-600">{estado.error}</p>}
      </div>
    </form>
  );
}
