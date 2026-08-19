import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSesion, puedeEscribir, puedeConsultarActas } from "@/lib/authz";
import { TIPO_ACTA_LABEL } from "@/lib/tipos-acta";
import { formatearFecha as fmt } from "@/lib/fecha";
import { obtenerConfiguracion } from "@/lib/configuracion";
import { AnularActaForm } from "./anular-form";
import { ReimprimirButton } from "./reimprimir-button";

function Fila({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">{value || "-"}</dd>
    </div>
  );
}

export default async function ActaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sesion = await requireSesion();
  if (!puedeConsultarActas(sesion)) redirect("/dashboard");

  const acta = await prisma.acta.findUnique({
    where: { id },
    include: {
      iglesia: true,
      bautizo: true,
      primeraComunion: true,
      confirmacion: true,
      matrimonio: true,
      creadoPor: true,
    },
  });

  if (!acta) notFound();
  if (!sesion.esSuperAdmin && acta.iglesiaId !== sesion.iglesiaId) {
    notFound();
  }

  const permisoEscritura = puedeEscribir(sesion);
  const config = await obtenerConfiguracion(acta.iglesiaId, acta.tipo);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            Acta de {TIPO_ACTA_LABEL[acta.tipo]} — Libro {acta.libro}, Partida {acta.numeroActa}
          </h1>
          <p className="text-sm text-slate-500">{acta.iglesia.nombre}</p>
        </div>
        <div className="text-right">
          <ReimprimirButton actaId={acta.id} precioReimpresion={config.precioReimpresion} />
          {config.precioReimpresion != null && (
            <p className="mt-1 text-xs text-slate-500">
              Costo de reimpresión: $
              {config.precioReimpresion.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </p>
          )}
        </div>
      </div>

      {acta.anulada && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Esta acta fue anulada. Motivo: {acta.motivoAnulacion}
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Datos generales</h2>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Fila label="Fecha" value={fmt(acta.fecha)} />
          <Fila label="Libro" value={acta.libro} />
          <Fila label="No. de partida" value={acta.numeroActa} />
          <Fila label="Foja" value={acta.foja} />
          <Fila
            label="Posición en la foja"
            value={`${acta.posicionEnFoja} de ${config.partidasPorFoja}`}
          />
          <Fila label="Lugar" value={acta.lugar} />
          <Fila label="Ministro" value={acta.ministro} />
          <Fila label="Registrada por" value={acta.creadoPor?.nombre} />
        </dl>
        {acta.observaciones && (
          <div className="mt-4">
            <Fila label="Observaciones" value={acta.observaciones} />
          </div>
        )}
      </div>

      {acta.bautizo && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Datos del bautizado</h2>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Fila label="Nombre completo" value={acta.bautizo.nombreCompleto} />
            <Fila label="Fecha de nacimiento" value={fmt(acta.bautizo.fechaNacimiento)} />
            <Fila label="Lugar de nacimiento" value={acta.bautizo.lugarNacimiento} />
            <Fila label="Padre" value={acta.bautizo.nombrePadre} />
            <Fila label="Madre" value={acta.bautizo.nombreMadre} />
            <Fila label="Padrino" value={acta.bautizo.padrino} />
            <Fila label="Madrina" value={acta.bautizo.madrina} />
          </dl>
        </div>
      )}

      {acta.primeraComunion && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Datos del comulgante</h2>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Fila label="Nombre completo" value={acta.primeraComunion.nombreCompleto} />
            <Fila label="Fecha de nacimiento" value={fmt(acta.primeraComunion.fechaNacimiento)} />
            <Fila label="Padre" value={acta.primeraComunion.nombrePadre} />
            <Fila label="Madre" value={acta.primeraComunion.nombreMadre} />
            <Fila label="Padrino" value={acta.primeraComunion.padrino} />
            <Fila label="Madrina" value={acta.primeraComunion.madrina} />
            <Fila label="Catequista" value={acta.primeraComunion.catequista} />
          </dl>
        </div>
      )}

      {acta.confirmacion && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Datos del confirmando</h2>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Fila label="Nombre completo" value={acta.confirmacion.nombreCompleto} />
            <Fila label="Fecha de nacimiento" value={fmt(acta.confirmacion.fechaNacimiento)} />
            <Fila label="Padre" value={acta.confirmacion.nombrePadre} />
            <Fila label="Madre" value={acta.confirmacion.nombreMadre} />
            <Fila label="Padrino" value={acta.confirmacion.padrino} />
            <Fila label="Madrina" value={acta.confirmacion.madrina} />
            <Fila label="Obispo / ministro" value={acta.confirmacion.obispoMinistro} />
          </dl>
        </div>
      )}

      {acta.matrimonio && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Datos del matrimonio</h2>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Fila label="Esposo" value={acta.matrimonio.nombreEsposo} />
            <Fila label="Fecha nac. esposo" value={fmt(acta.matrimonio.fechaNacimientoEsposo)} />
            <Fila label="Padre del esposo" value={acta.matrimonio.padreEsposo} />
            <Fila label="Madre del esposo" value={acta.matrimonio.madreEsposo} />
            <Fila label="Esposa" value={acta.matrimonio.nombreEsposa} />
            <Fila label="Fecha nac. esposa" value={fmt(acta.matrimonio.fechaNacimientoEsposa)} />
            <Fila label="Padre de la esposa" value={acta.matrimonio.padreEsposa} />
            <Fila label="Madre de la esposa" value={acta.matrimonio.madreEsposa} />
            <Fila label="Testigo 1" value={acta.matrimonio.testigo1} />
            <Fila label="Testigo 2" value={acta.matrimonio.testigo2} />
            <Fila label="No. acta civil" value={acta.matrimonio.actaCivilNumero} />
          </dl>
        </div>
      )}

      {permisoEscritura && !acta.anulada && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Anular acta</h2>
          <p className="mb-3 text-sm text-slate-500">
            Anular un acta la marca como no vigente, pero conserva el registro histórico.
          </p>
          <AnularActaForm actaId={acta.id} />
        </div>
      )}

      <div>
        <Link href="/actas" className="text-sm text-slate-500 hover:underline">
          ← Volver a actas
        </Link>
      </div>
    </div>
  );
}
