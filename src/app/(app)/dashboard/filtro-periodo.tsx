"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PRESETS_PERIODO } from "@/lib/ingresos";

const PERSONALIZADO = "personalizado";

export function FiltroPeriodo({
  presetActual,
  desdeActual,
  hastaActual,
}: {
  presetActual: string;
  desdeActual?: string;
  hastaActual?: string;
}) {
  const router = useRouter();
  const esPersonalizadoInicial = !!(desdeActual || hastaActual);
  const [modo, setModo] = useState(esPersonalizadoInicial ? PERSONALIZADO : presetActual);
  const [desde, setDesde] = useState(desdeActual ?? "");
  const [hasta, setHasta] = useState(hastaActual ?? "");

  function alCambiarModo(valor: string) {
    setModo(valor);
    if (valor !== PERSONALIZADO) {
      router.push(`/dashboard?preset=${valor}`);
    }
  }

  function aplicarPersonalizado() {
    const qs = new URLSearchParams();
    if (desde) qs.set("desde", desde);
    if (hasta) qs.set("hasta", hasta);
    router.push(`/dashboard?${qs.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <label htmlFor="periodo" className="block text-xs font-medium text-slate-600">
          Periodo
        </label>
        <select
          id="periodo"
          value={modo}
          onChange={(e) => alCambiarModo(e.target.value)}
          className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {PRESETS_PERIODO.map((p) => (
            <option key={p.valor} value={p.valor}>
              {p.etiqueta}
            </option>
          ))}
          <option value={PERSONALIZADO}>Personalizado...</option>
        </select>
      </div>

      {modo === PERSONALIZADO && (
        <>
          <div>
            <label htmlFor="desde" className="block text-xs font-medium text-slate-600">
              Desde
            </label>
            <input
              id="desde"
              type="month"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="hasta" className="block text-xs font-medium text-slate-600">
              Hasta
            </label>
            <input
              id="hasta"
              type="month"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={aplicarPersonalizado}
            disabled={!desde && !hasta}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            Aplicar
          </button>
        </>
      )}
    </div>
  );
}
