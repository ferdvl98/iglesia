"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cambiarRolUsuario } from "./actions";
import type { Rol } from "@prisma/client";

export function RolSelect({
  usuarioId,
  rolId,
  roles,
}: {
  usuarioId: string;
  rolId: string | null;
  roles: Rol[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function cambiar(nuevoRolId: string) {
    setError(null);
    startTransition(async () => {
      try {
        await cambiarRolUsuario(usuarioId, nuevoRolId);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo cambiar el rol.");
      }
    });
  }

  return (
    <div>
      <select
        value={rolId ?? ""}
        onChange={(e) => cambiar(e.target.value)}
        disabled={pending}
        className="rounded-md border border-slate-300 px-2 py-1 text-sm disabled:opacity-60"
      >
        {roles.map((rol) => (
          <option key={rol.id} value={rol.id}>
            {rol.nombre}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
