"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cerrarSesion } from "./actions";

/**
 * Menú de la cuenta, bajo el nombre del usuario.
 *
 * Agrupa lo que es de uno mismo —perfil, contraseña, salir— en vez de tenerlo
 * suelto en la barra superior, donde "Contraseña" competía en peso con la
 * navegación de la aplicación.
 */
export function MenuUsuario({ nombre, rol }: { nombre: string; rol: string }) {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    function alClicFuera(e: MouseEvent) {
      if (!contenedor.current?.contains(e.target as Node)) setAbierto(false);
    }
    function alEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    document.addEventListener("mousedown", alClicFuera);
    document.addEventListener("keydown", alEscape);
    return () => {
      document.removeEventListener("mousedown", alClicFuera);
      document.removeEventListener("keydown", alEscape);
    };
  }, [abierto]);

  return (
    <div ref={contenedor} className="relative ml-auto shrink-0">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-100"
      >
        <span className="max-w-44 truncate font-medium text-slate-900">{nombre}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-slate-400"
          />
        </svg>
      </button>

      {abierto && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-60 rounded-md border border-slate-200 bg-white py-1 shadow-lg"
        >
          <div className="border-b border-slate-100 px-4 py-2">
            <p className="truncate text-sm font-medium text-slate-900">{nombre}</p>
            <p className="truncate text-xs text-slate-500">{rol}</p>
          </div>
          <Link
            href="/perfil"
            role="menuitem"
            onClick={() => setAbierto(false)}
            className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Mi perfil
          </Link>
          <Link
            href="/cambiar-password"
            role="menuitem"
            onClick={() => setAbierto(false)}
            className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cambiar contraseña
          </Link>
          <form action={cerrarSesion} className="border-t border-slate-100">
            <button
              type="submit"
              role="menuitem"
              className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
