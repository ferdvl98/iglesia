"use client";

import { useState, useTransition } from "react";
import { restablecerPassword } from "./actions";

/**
 * Restablece la contraseña de un usuario a una temporal. El administrador la
 * elige, se la entrega en persona y el usuario tendrá que cambiarla al entrar.
 */
export function RestablecerPassword({
  usuarioId,
  nombre,
}: {
  usuarioId: string;
  nombre: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [temporal, setTemporal] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);
  const [pending, startTransition] = useTransition();

  function enviar() {
    setError(null);
    startTransition(async () => {
      try {
        await restablecerPassword(usuarioId, temporal);
        setListo(true);
        setAbierto(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo restablecer.");
      }
    });
  }

  if (listo) {
    return (
      <span className="text-sm text-green-700">
        Contraseña restablecida
      </span>
    );
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="text-sm text-slate-600 hover:underline"
      >
        Restablecer contraseña
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <p className="text-xs text-slate-500">
        Contraseña temporal para {nombre}
      </p>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={temporal}
          onChange={(e) => setTemporal(e.target.value)}
          placeholder="Mínimo 8 caracteres"
          className="w-48 rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
        />
        <button
          type="button"
          disabled={pending || temporal.length < 8}
          onClick={enviar}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "..." : "Guardar"}
        </button>
        <button
          type="button"
          onClick={() => {
            setAbierto(false);
            setTemporal("");
            setError(null);
          }}
          className="text-sm text-slate-500 hover:underline"
        >
          Cancelar
        </button>
      </div>
      <p className="text-xs text-slate-400">
        Se muestra en claro para que puedas dictársela. Tendrá que cambiarla al entrar.
      </p>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
