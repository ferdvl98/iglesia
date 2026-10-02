import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LoginForm } from "./login-form";
import { Footer } from "@/components/footer";
import { Logo } from "@/components/logo";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string; motivo?: string }>;
}) {
  const params = await searchParams;

  // Instalación recién desplegada: no tiene sentido pedir credenciales que
  // todavía no existen. Así, abrir el dominio del cliente lleva directo a la
  // configuración inicial. Sin riesgo de bucle: esa página redirige aquí en
  // cuanto hay un usuario, y son condiciones mutuamente excluyentes.
  if ((await prisma.usuario.count()) === 0) redirect("/configuracion-inicial");

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
          {/* La cabecera va centrada como un solo bloque; el formulario se
              queda alineado a la izquierda, que es donde van sus etiquetas. */}
          <div className="flex flex-col items-center text-center">
            <Logo size={52} />
            <h1 className="mt-4 text-xl font-semibold text-slate-900">
              Control de Actas Parroquiales
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Inicia sesión para consultar y registrar actas.
            </p>
          </div>
          {params.motivo === "sesion" && (
            <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Tu sesión dejó de ser válida porque tu cuenta cambió o fue
              desactivada. Vuelve a iniciar sesión.
            </p>
          )}
          <LoginForm callbackUrl={params.callbackUrl ?? "/dashboard"} />
        </div>
      </div>
      <Footer />
    </div>
  );
}
