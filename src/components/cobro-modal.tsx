"use client";

import { useEffect, useRef } from "react";

export function CobroModal({
  titulo,
  precio,
  metodoPago,
  onMetodoPagoChange,
  onCancelar,
  onConfirmar,
  puedeConfirmar = true,
  botonConfirmar,
  error,
}: {
  titulo: string;
  precio: number;
  metodoPago: string;
  onMetodoPagoChange: (valor: string) => void;
  onCancelar: () => void;
  /** Qué hace Enter. Sin esto, el teclado solo cancela. */
  onConfirmar?: () => void;
  /** Falso mientras se está guardando, para que Enter no dispare dos veces. */
  puedeConfirmar?: boolean;
  botonConfirmar: React.ReactNode;
  error?: string | null;
}) {
  const panel = useRef<HTMLDivElement>(null);

  // El cobro se confirma en medio de la captura, con las manos en el teclado:
  // Enter confirma y Escape cancela, sin tener que ir al ratón.
  useEffect(() => {
    function alTeclear(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancelar();
        return;
      }
      if (e.key !== "Enter" || e.repeat) return;
      // Dentro de un select abierto, Enter elige la opción: es del navegador.
      if ((e.target as HTMLElement)?.tagName === "SELECT") return;
      if (!onConfirmar || !puedeConfirmar) return;
      e.preventDefault();
      onConfirmar();
    }
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [onCancelar, onConfirmar, puedeConfirmar]);

  // Mover el foco al diálogo: si se queda detrás, el lector de pantalla sigue
  // leyendo la página de atrás y el teclado actúa sobre ella.
  useEffect(() => {
    panel.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg outline-none"
      >
        <h2 className="text-base font-semibold text-slate-900">{titulo}</h2>
        <p className="mt-2 text-3xl font-bold text-slate-900">
          ${precio.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
        </p>
        <div className="mt-4">
          <label className="block text-xs font-medium text-slate-600">Método de pago</label>
          <select
            value={metodoPago}
            onChange={(e) => onMetodoPagoChange(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="EFECTIVO">Efectivo</option>
            <option value="TARJETA">Tarjeta</option>
            <option value="TRANSFERENCIA">Transferencia</option>
          </select>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancelar}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          {botonConfirmar}
        </div>
        {onConfirmar && (
          <p className="mt-3 text-right text-xs text-slate-400">
            Enter confirma · Esc cancela
          </p>
        )}
      </div>
    </div>
  );
}
