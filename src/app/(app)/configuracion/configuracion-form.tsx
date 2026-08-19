"use client";

import { useActionState } from "react";
import { guardarConfiguracion } from "./actions";
import { TIPOS_ACTA, TIPO_ACTA_LABEL } from "@/lib/tipos-acta";
import { FOJAS_POR_LIBRO_DEFECTO, PARTIDAS_POR_FOJA_DEFECTO } from "@/lib/libro";
import type { ConfiguracionActa } from "@prisma/client";

export function ConfiguracionForm({
  configuraciones,
  iglesiaId,
}: {
  configuraciones: ConfiguracionActa[];
  iglesiaId?: string;
}) {
  const [estado, formAction, pending] = useActionState(guardarConfiguracion, null);

  function valorDe(tipo: string) {
    return configuraciones.find((c) => c.tipo === tipo);
  }

  return (
    <form action={formAction} className="space-y-4">
      {iglesiaId && <input type="hidden" name="iglesiaId" value={iglesiaId} />}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Tipo de acta</th>
              <th className="px-4 py-2">Fojas por libro</th>
              <th className="px-4 py-2">Partidas por foja</th>
              <th className="px-4 py-2">Precio de registro</th>
              <th className="px-4 py-2">Precio de reimpresión</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {TIPOS_ACTA.map((tipo) => {
              const config = valorDe(tipo);
              return (
                <tr key={tipo}>
                  <td className="px-4 py-3 font-medium text-slate-900">{TIPO_ACTA_LABEL[tipo]}</td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min={1}
                      name={`fojasPorLibro_${tipo}`}
                      defaultValue={config?.fojasPorLibro ?? FOJAS_POR_LIBRO_DEFECTO}
                      className="w-24 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min={1}
                      name={`partidasPorFoja_${tipo}`}
                      defaultValue={config?.partidasPorFoja ?? PARTIDAS_POR_FOJA_DEFECTO}
                      className="w-24 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      name={`precioRegistro_${tipo}`}
                      defaultValue={config?.precioRegistro ?? ""}
                      placeholder="0.00"
                      className="w-28 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      name={`precioReimpresion_${tipo}`}
                      defaultValue={config?.precioReimpresion ?? ""}
                      placeholder="0.00"
                      className="w-28 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500">
        Cambiar la cantidad de partidas por foja o fojas por libro solo afecta a los libros que se
        abran de aquí en adelante; los libros ya existentes conservan su numeración.
      </p>

      {estado && "error" in estado && <p className="text-sm text-red-600">{estado.error}</p>}
      {estado && "ok" in estado && (
        <p className="text-sm text-green-700">Configuración guardada.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Guardar configuración"}
      </button>
    </form>
  );
}
