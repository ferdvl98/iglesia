"use client";

import { useActionState } from "react";
import { Campo } from "@/components/form-fields";
import type { Permiso } from "@prisma/client";
import { PERMISOS_LABEL, PERMISOS_PUNTO_DE_VENTA } from "@/lib/etiquetas-permisos";


type EstadoFormulario = { error: string } | null;

export function RolForm({
  action,
  moduloPuntoDeVenta,
  rolId,
  permisosIniciales,
  nombreInicial,
  textoBoton,
}: {
  moduloPuntoDeVenta: boolean;
  action: (prevState: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
  rolId?: string;
  permisosIniciales?: Permiso[];
  nombreInicial?: string;
  textoBoton: string;
}) {
  const [estado, formAction, pending] = useActionState(action, null);
  const seleccionados = new Set(permisosIniciales ?? []);

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      {rolId && <input type="hidden" name="rolId" value={rolId} />}
      <Campo label="Nombre del rol" name="nombre" defaultValue={nombreInicial} required />

      <div>
        <p className="mb-2 text-xs font-medium text-slate-600">Permisos</p>
        <div className="space-y-2">
          {(Object.keys(PERMISOS_LABEL) as Permiso[])
            .filter((p) => moduloPuntoDeVenta || !PERMISOS_PUNTO_DE_VENTA.includes(p))
            .map((permiso) => (
            <label key={permiso} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name={`permiso_${permiso}`}
                defaultChecked={seleccionados.has(permiso)}
                className="h-4 w-4 rounded border-slate-300"
              />
              {PERMISOS_LABEL[permiso]}
            </label>
          ))}
        </div>
      </div>

      {estado?.error && <p className="text-sm text-red-600">{estado.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Guardando..." : textoBoton}
      </button>
    </form>
  );
}
