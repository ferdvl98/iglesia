import Link from "next/link";
import {
  requireSesion,
  puedeAdministrarIglesias,
  puedeAdministrarUsuarios,
  puedeAdministrarRoles,
  puedeConfigurar,
  puedeAdministrarCatalogo,
} from "@/lib/authz";
import { cerrarSesion } from "./actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sesion = await requireSesion();

  const links = [
    { href: "/dashboard", label: "Inicio" },
    { href: "/actas", label: "Actas" },
    { href: "/punto-de-venta", label: "Punto de venta" },
  ];
  if (puedeAdministrarCatalogo(sesion)) {
    links.push({ href: "/catalogo", label: "Catálogo" });
  }
  if (puedeAdministrarUsuarios(sesion)) {
    links.push({ href: "/usuarios", label: "Usuarios" });
  }
  if (puedeAdministrarRoles(sesion)) {
    links.push({ href: "/roles", label: "Roles" });
  }
  if (puedeAdministrarIglesias(sesion)) {
    links.push({ href: "/iglesias", label: "Iglesias" });
  }
  if (puedeConfigurar(sesion)) {
    links.push({ href: "/configuracion", label: "Configuración" });
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-60 shrink-0 border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <p className="text-sm font-semibold text-slate-900">Control de Actas</p>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {sesion.iglesiaNombre ?? "Todas las iglesias"}
          </p>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div className="text-sm text-slate-600">
            <span className="font-medium text-slate-900">{sesion.nombre}</span>
            <span className="mx-2 text-slate-300">|</span>
            <span>{sesion.esSuperAdmin ? "SUPERADMIN" : sesion.rolNombre}</span>
          </div>
          <form action={cerrarSesion}>
            <button
              type="submit"
              className="text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              Cerrar sesión
            </button>
          </form>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
