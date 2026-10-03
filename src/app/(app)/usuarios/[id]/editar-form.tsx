"use client";

import { useActionState } from "react";
import { actualizarUsuario } from "../actions";
import { Campo } from "@/components/form-fields";
import type { Iglesia, Rol } from "@prisma/client";

export function EditarUsuarioForm({
  usuario,
  roles,
  iglesias,
  esSuperadmin,
}: {
  usuario: { id: string; nombre: string; email: string; rolId: string | null; iglesiaId: string | null; esSuperAdmin: boolean };
  roles: Rol[];
  iglesias: Iglesia[];
  esSuperadmin: boolean;
}) {
  const [estado, formAction, pending] = useActionState(actualizarUsuario, null);

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <input type="hidden" name="usuarioId" value={usuario.id} />
      <Campo label="Nombre" name="nombre" required defaultValue={usuario.nombre} />
      <Campo label="Correo" name="email" type="email" required defaultValue={usuario.email} />

      {usuario.esSuperAdmin ? (
        <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Es SUPERADMIN: ve todas las parroquias y no lleva rol asignado.
        </p>
      ) : (
        <>
          <div>
            <label htmlFor="rolId" className="block text-xs font-medium text-slate-600">
              Rol <span className="text-red-500">*</span>
            </label>
            <select
              id="rolId"
              name="rolId"
              required
              defaultValue={usuario.rolId ?? ""}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {roles.map((rol) => (
                <option key={rol.id} value={rol.id}>
                  {rol.nombre}
                </option>
              ))}
            </select>
          </div>

          {esSuperadmin && (
            <div>
              <label htmlFor="iglesiaId" className="block text-xs font-medium text-slate-600">
                Iglesia <span className="text-red-500">*</span>
              </label>
              <select
                id="iglesiaId"
                name="iglesiaId"
                required
                defaultValue={usuario.iglesiaId ?? ""}
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
        </>
      )}

      {estado?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{estado.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
