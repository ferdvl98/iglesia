import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Footer } from "@/components/footer";
import { Logo } from "@/components/logo";
import { PrimerSuperadminForm } from "./form";

/**
 * Arranque del sistema: crea el primer SUPERADMIN.
 *
 * Es la única página pública que escribe en la base, así que su defensa es
 * que el sistema esté vacío. En cuanto existe un usuario deja de ser
 * alcanzable —la acción lo vuelve a comprobar en una transacción, por si
 * alguien llega directo al POST.
 */
export default async function ConfiguracionInicialPage() {
  if ((await prisma.usuario.count()) > 0) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <Logo size={52} />
            <h1 className="mt-4 text-xl font-semibold text-slate-900">
              Configuración inicial
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Crea el administrador general. Desde su cuenta podrás registrar las
              parroquias, los sacerdotes y a los demás usuarios.
            </p>
          </div>
          <PrimerSuperadminForm />
          <p className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-400">
            Esta pantalla solo aparece mientras el sistema no tiene ningún usuario.
            Después de crear esta cuenta deja de estar disponible.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
