"use client";

import { useActionState } from "react";
import { anularActaAction } from "../actions";

export function AnularActaForm({ actaId }: { actaId: string }) {
  const [estado, formAction, pending] = useActionState(anularActaAction, null);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="actaId" value={actaId} />
      <div className="flex-1 min-w-[200px]">
        <label htmlFor="motivo" className="block text-xs font-medium text-slate-600">
          Motivo de anulación
        </label>
        <input
          id="motivo"
          name="motivo"
          type="text"
          required
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
      >
        {pending ? "Anulando..." : "Anular acta"}
      </button>
      {estado?.error && <p className="w-full text-sm text-red-600">{estado.error}</p>}
    </form>
  );
}
