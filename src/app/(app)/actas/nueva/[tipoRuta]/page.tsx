import Link from "next/link";
import { notFound } from "next/navigation";
import { rutaATipo, TIPO_ACTA_LABEL } from "@/lib/tipos-acta";
import { requireSesion, puedeConfigurar, puedeAdministrarMinistros } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { obtenerConfiguracion } from "@/lib/configuracion";
import { obtenerLibrosExistentes } from "../../actions";
import { ActaForm } from "./acta-form";

export default async function NuevaActaTipoPage({
  params,
}: {
  params: Promise<{ tipoRuta: string }>;
}) {
  const { tipoRuta } = await params;
  const tipo = rutaATipo(tipoRuta);
  if (!tipo) notFound();

  const sesion = await requireSesion();
  const iglesias =
    sesion.esSuperAdmin
      ? await prisma.iglesia.findMany({ where: { activa: true }, orderBy: { nombre: "asc" } })
      : [];

  const ministros = await prisma.ministro.findMany({
    where: sesion.esSuperAdmin ? { activo: true } : { activo: true, iglesiaId: sesion.iglesiaId! },
    orderBy: { nombre: "asc" },
  });

  const [libros, config] = sesion.iglesiaId
    ? await Promise.all([
        obtenerLibrosExistentes(sesion.iglesiaId, tipo),
        obtenerConfiguracion(sesion.iglesiaId, tipo),
      ])
    : [[], null];

  if (config && config.precioRegistro === null) {
    return (
      <div className="max-w-md space-y-4">
        <h1 className="text-lg font-semibold text-slate-900">
          Nueva acta de {TIPO_ACTA_LABEL[tipo]}
        </h1>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Este tipo de acta no tiene un precio de registro configurado, así que no se pueden
          registrar actas todavía.
          {puedeConfigurar(sesion) && (
            <>
              {" "}
              <Link href="/configuracion" className="font-medium underline">
                Ve a Configuración para definirlo
              </Link>
              .
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">
          Nueva acta de {TIPO_ACTA_LABEL[tipo]}
        </h1>
        <p className="text-sm text-slate-500">
          Completa los datos del acta.
          {config?.precioRegistro != null &&
            ` Costo de registro: $${config.precioRegistro.toLocaleString("es-MX", { minimumFractionDigits: 2 })}.`}
        </p>
      </div>
      <ActaForm
        tipo={tipo}
        iglesias={iglesias}
        ministros={ministros}
        puedeAdministrarMinistros={puedeAdministrarMinistros(sesion)}
        libros={libros}
        partidasPorFoja={config?.partidasPorFoja}
        precioRegistro={config?.precioRegistro}
      />
    </div>
  );
}
