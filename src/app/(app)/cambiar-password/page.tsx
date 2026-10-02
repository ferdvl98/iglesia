import { requireSesion } from "@/lib/authz";
import { CambiarPasswordForm } from "./form";

export default async function CambiarPasswordPage() {
  // requireSesion() ya lee el usuario de la base; no hace falta otra consulta.
  const { debeCambiarPassword: obligatorio } = await requireSesion();

  return (
    <div className="max-w-md space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">
          {obligatorio ? "Elige tu contraseña" : "Cambiar contraseña"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {obligatorio
            ? "Entraste con una contraseña temporal. Elige una propia para continuar."
            : "Necesitas tu contraseña actual para poder cambiarla."}
        </p>
      </div>
      <CambiarPasswordForm obligatorio={obligatorio} />
    </div>
  );
}
