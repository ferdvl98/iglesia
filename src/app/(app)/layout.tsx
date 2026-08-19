import Link from "next/link";
import {
  requireSesion,
  puedeAdministrarMinistros,
  puedeAdministrarIglesias,
  puedeAdministrarUsuarios,
  puedeAdministrarRoles,
  puedeConfigurar,
  puedeAdministrarCatalogo,
} from "@/lib/authz";
import { cerrarSesion } from "./actions";
import { MobileNav } from "./mobile-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sesion = await requireSesion();

  const links = [
    { href: "/dashboard", label: "Inicio" },
    { href: "/actas", label: "Actas" },
    { href: "/punto-de-venta", label: "Punto de venta" },
  ];
  if (puedeAdministrarMinistros(sesion)) {
    links.push({ href: "/ministros", label: "Sacerdotes" });
  }
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

  const iglesiaNombre = sesion.iglesiaNombre ?? "Todas las iglesias";

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white md:block">
        <div className="border-b border-slate-200 px-5 py-4">
          <p className="text-sm font-semibold text-slate-900">Control de Actas</p>
          <p className="mt-0.5 truncate text-xs text-slate-500">{iglesiaNombre}</p>
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
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 md:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <MobileNav links={links} iglesiaNombre={iglesiaNombre} />
            <div className="min-w-0 truncate text-sm text-slate-600">
              <span className="font-medium text-slate-900">{sesion.nombre}</span>
              <span className="mx-2 text-slate-300">|</span>
              <span>{sesion.esSuperAdmin ? "SUPERADMIN" : sesion.rolNombre}</span>
            </div>
          </div>
          <form action={cerrarSesion} className="shrink-0">
            <button
              type="submit"
              className="text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              Cerrar sesión
            </button>
          </form>
        </header>
        <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
