import Link from "next/link";
import { TIPOS_ACTA, TIPO_ACTA_LABEL, TIPO_ACTA_RUTA } from "@/lib/tipos-acta";

export default function NuevaActaPage() {
  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Registrar nueva acta</h1>
        <p className="text-sm text-slate-500">Selecciona el tipo de sacramento a registrar.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {TIPOS_ACTA.map((tipo) => (
          <Link
            key={tipo}
            href={`/actas/nueva/${TIPO_ACTA_RUTA[tipo]}`}
            className="rounded-lg border border-slate-200 bg-white p-5 text-center font-medium text-slate-800 hover:border-slate-400 hover:bg-slate-50"
          >
            {TIPO_ACTA_LABEL[tipo]}
          </Link>
        ))}
      </div>
    </div>
  );
}
