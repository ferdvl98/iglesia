"use client";

import { useTransition } from "react";
import { cambiarEstadoMinistro } from "./actions";

export function EstadoMinistroToggle({ ministroId, activo }: { ministroId: string; activo: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => cambiarEstadoMinistro(ministroId, !activo))}
      className="text-sm text-slate-600 hover:underline disabled:opacity-60"
    >
      {activo ? "Desactivar" : "Activar"}
    </button>
  );
}
