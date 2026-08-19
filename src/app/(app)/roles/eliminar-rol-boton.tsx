"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { eliminarRol } from "./actions";

export function EliminarRolBoton({ rolId }: { rolId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function eliminar() {
    setError(null);
    if (!confirm("¿Eliminar este rol?")) return;
    startTransition(async () => {
      try {
        await eliminarRol(rolId);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo eliminar el rol.");
      }
    });
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={eliminar}
        disabled={pending}
        className="text-sm text-red-600 hover:underline disabled:opacity-60"
      >
        Eliminar
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
