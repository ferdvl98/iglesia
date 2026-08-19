"use client";

import { useTransition } from "react";
import { cambiarEstadoUsuario } from "./actions";

export function EstadoUsuarioToggle({ usuarioId, activo }: { usuarioId: string; activo: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => cambiarEstadoUsuario(usuarioId, !activo))}
      className="text-sm text-slate-600 hover:underline disabled:opacity-60"
    >
      {activo ? "Desactivar" : "Activar"}
    </button>
  );
}
