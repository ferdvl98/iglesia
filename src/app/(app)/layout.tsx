import Link from "next/link";
import {
  requireSesion,
  puedeAdministrarMinistros,
  puedeAdministrarIglesias,
  puedeAdministrarUsuarios,
  puedeAdministrarRoles,
  puedeConfigurar,
  puedeAdministrarCatalogo,
  puedeUsarPuntoDeVenta,
} from "@/lib/authz";
import { MenuUsuario } from "./menu-usuario";
import { MobileNav } from "./mobile-nav";
import { Footer } from "@/components/footer";
import { Logo } from "@/components/logo";
import { CambiarPasswordForm } from "./cambiar-password/form";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sesion = await requireSesion();

  // Con una contraseña temporal no se muestra la aplicación, sino el formulario
  // de cambio en su lugar. Se renderiza, no se redirige: una redirección desde
  // el layout la dispara también cada precarga de los enlaces del menú, y el
  // router entra en un bucle que deja la pantalla en blanco.
  if (sesion.debeCambiarPassword) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-100">
        <div className="flex flex-1 items-center justify-center px-4 py-10">
          <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <Logo size={52} />
              <h1 className="mt-4 text-xl font-semibold text-slate-900">Elige tu contraseña</h1>
              <p className="mt-1 text-sm text-slate-500">
                Entraste con una contraseña temporal. Elige una propia para continuar.
              </p>
            </div>
            <div className="mt-6">
              <CambiarPasswordForm obligatorio />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const links = [
    { href: "/dashboard", label: "Inicio" },
    { href: "/actas", label: "Actas" },
  ];
  // Estaba en la lista fija, así que aparecía incluso sin el permiso (y, ahora,
  // sin el módulo contratado); la página redirigía al entrar.
  if (puedeUsarPuntoDeVenta(sesion)) {
    links.push({ href: "/punto-de-venta", label: "Punto de venta" });
  }
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
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <aside className="hidden w-60 shrink-0 overflow-y-auto border-r border-slate-200 bg-white md:block">
        <div className="flex items-center gap-2.5 border-b border-slate-200 px-5 py-4">
          <Logo size={26} className="shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">Control de Actas</p>
            <p className="mt-0.5 truncate text-xs text-slate-500">{iglesiaNombre}</p>
          </div>
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
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2.5 md:px-6">
          <MobileNav links={links} iglesiaNombre={iglesiaNombre} />
          <MenuUsuario
            nombre={sesion.nombre ?? ""}
            rol={sesion.esSuperAdmin ? "SUPERADMIN" : (sesion.rolNombre ?? "Sin rol")}
          />
        </header>
        <div className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
          <main className="p-4 md:p-6">{children}</main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
