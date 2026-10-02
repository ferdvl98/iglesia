import { LoginForm } from "./login-form";
import { Footer } from "@/components/footer";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">
            Control de Actas Parroquiales
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Inicia sesión para consultar y registrar actas.
          </p>
          <LoginForm callbackUrl={params.callbackUrl ?? "/dashboard"} />
        </div>
      </div>
      <Footer />
    </div>
  );
}
