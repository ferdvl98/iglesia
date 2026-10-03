import Link from "next/link";
import { requireSesion } from "@/lib/authz";
import { PerfilForm } from "./form";

export default async function PerfilPage() {
  const sesion = await requireSesion();

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Mi perfil</h1>
        <p className="mt-1 text-sm text-slate-500">
          {sesion.esSuperAdmin
            ? "Administrador general — ves todas las parroquias."
            : `${sesion.rolNombre ?? "Sin rol"}${sesion.iglesiaNombre ? ` · ${sesion.iglesiaNombre}` : ""}`}
        </p>
      </div>

      <PerfilForm nombre={sesion.nombre ?? ""} email={sesion.email ?? ""} />

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Contraseña</h2>
        <p className="mt-1 text-sm text-slate-500">
          Para cambiarla necesitas la actual.
        </p>
        <Link
          href="/cambiar-password"
          className="mt-3 inline-block rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cambiar contraseña
        </Link>
      </div>

      <p className="text-xs text-slate-400">
        Tu rol y tu parroquia los define quien administra usuarios, no se cambian desde aquí.
      </p>
    </div>
  );
}
