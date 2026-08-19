"use client";

import { useActionState, useState } from "react";
import { crearUsuario } from "../actions";
import { Campo } from "@/components/form-fields";
import type { Iglesia, Rol } from "@prisma/client";

export function UsuarioForm({
  esSuperadmin,
  iglesias,
  roles,
}: {
  esSuperadmin: boolean;
  iglesias: Iglesia[];
  roles: Rol[];
}) {
  const [estado, formAction, pending] = useActionState(crearUsuario, null);
  const [esSuperAdminChecked, setEsSuperAdminChecked] = useState(false);

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <Campo label="Nombre" name="nombre" required />
      <Campo label="Correo" name="email" type="email" required />
      <Campo label="Contraseña temporal" name="password" type="password" required />

      {esSuperadmin && (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="esSuperAdmin"
            checked={esSuperAdminChecked}
            onChange={(e) => setEsSuperAdminChecked(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Es SUPERADMIN (acceso a todas las iglesias, sin rol)
        </label>
      )}

      {!esSuperAdminChecked && (
        <div>
          <label htmlFor="rolId" className="block text-xs font-medium text-slate-600">
            Rol <span className="text-red-500">*</span>
          </label>
          <select
            id="rolId"
            name="rolId"
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {roles.map((rol) => (
              <option key={rol.id} value={rol.id}>
                {rol.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      {esSuperadmin && !esSuperAdminChecked && (
        <div>
          <label htmlFor="iglesiaId" className="block text-xs font-medium text-slate-600">
            Iglesia <span className="text-red-500">*</span>
          </label>
          <select
            id="iglesiaId"
            name="iglesiaId"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">-- Selecciona --</option>
            {iglesias.map((iglesia) => (
              <option key={iglesia.id} value={iglesia.id}>
                {iglesia.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      {estado?.error && <p className="text-sm text-red-600">{estado.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Crear usuario"}
      </button>
    </form>
  );
}
