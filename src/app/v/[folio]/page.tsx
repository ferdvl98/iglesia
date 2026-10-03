import { prisma } from "@/lib/prisma";
import { Footer } from "@/components/footer";
import { Logo } from "@/components/logo";
import { TIPO_ACTA_LABEL } from "@/lib/tipos-acta";
import { formatearFechaLarga } from "@/lib/fecha";
import { normalizarFolio } from "@/lib/folio";

/**
 * Verificación pública de un acta por su folio.
 *
 * Es la única página que lee datos sin sesión, así que muestra **solo lo que
 * ya está impreso en el papel que tiene quien escanea**: tipo, parroquia,
 * ubicación en el libro, titular, fecha y estado. Nada de padres, padrinos ni
 * domicilios: el QR confirma el documento, no es una ventana al archivo.
 */
export default async function VerificarActaPage({
  params,
}: {
  params: Promise<{ folio: string }>;
}) {
  const { folio } = await params;
  const acta = await prisma.acta.findUnique({
    where: { folioVerificacion: normalizarFolio(decodeURIComponent(folio)) },
    select: {
      tipo: true,
      libro: true,
      foja: true,
      numeroActa: true,
      fecha: true,
      anulada: true,
      motivoAnulacion: true,
      updatedAt: true,
      folioVerificacion: true,
      iglesia: { select: { nombre: true, ciudad: true, estado: true } },
      bautizo: { select: { nombreCompleto: true } },
      primeraComunion: { select: { nombre: true, apellidos: true } },
      confirmacion: { select: { nombreCompleto: true } },
      matrimonio: { select: { nombreEsposo: true, nombreEsposa: true } },
      _count: { select: { correcciones: true } },
    },
  });

  const titular = acta
    ? acta.bautizo?.nombreCompleto ??
      (acta.primeraComunion && `${acta.primeraComunion.nombre} ${acta.primeraComunion.apellidos}`) ??
      acta.confirmacion?.nombreCompleto ??
      (acta.matrimonio && `${acta.matrimonio.nombreEsposo} y ${acta.matrimonio.nombreEsposa}`) ??
      null
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <Logo size={44} />
            <h1 className="mt-3 text-base font-semibold text-slate-900">
              Verificación de acta parroquial
            </h1>
          </div>

          {!acta ? (
            <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-medium">No encontramos ningún acta con ese folio.</p>
              <p className="mt-1">
                Revisa que lo hayas escrito tal como aparece impreso. Si el documento no trae
                folio, es anterior a este sistema: pregunta en la parroquia que lo expidió.
              </p>
            </div>
          ) : (
            <>
              {acta.anulada ? (
                <div className="mt-6 rounded-md border border-red-300 bg-red-50 px-4 py-3">
                  <p className="text-sm font-semibold text-red-800">ACTA ANULADA</p>
                  <p className="mt-1 text-sm text-red-700">
                    Esta partida fue anulada y el documento ya no es válido.
                    {acta.motivoAnulacion ? ` Motivo: ${acta.motivoAnulacion}` : ""}
                  </p>
                </div>
              ) : (
                <div className="mt-6 rounded-md border border-green-300 bg-green-50 px-4 py-3">
                  <p className="text-sm font-semibold text-green-800">Acta vigente</p>
                  <p className="mt-1 text-sm text-green-700">
                    Los datos de abajo son los que constan hoy en el libro parroquial.
                  </p>
                </div>
              )}

              <dl className="mt-5 space-y-3">
                <Dato etiqueta="Sacramento" valor={TIPO_ACTA_LABEL[acta.tipo]} />
                <Dato etiqueta={acta.matrimonio ? "Contrayentes" : "A nombre de"} valor={titular} />
                <Dato etiqueta="Fecha" valor={formatearFechaLarga(acta.fecha)} />
                <Dato
                  etiqueta="Ubicación en el libro"
                  valor={`Libro ${acta.libro} · Foja ${acta.foja} · Partida ${acta.numeroActa}`}
                />
                <Dato
                  etiqueta="Parroquia"
                  valor={[acta.iglesia.nombre, acta.iglesia.ciudad, acta.iglesia.estado]
                    .filter(Boolean)
                    .join(", ")}
                />
                <Dato etiqueta="Folio" valor={acta.folioVerificacion} />
              </dl>

              {acta._count.correcciones > 0 && (
                <p className="mt-5 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  Esta partida ha sido corregida después de su registro. Si el documento impreso
                  no coincide con lo anterior, es una copia anterior a la corrección: solicita una
                  reimpresión en la parroquia.
                </p>
              )}
            </>
          )}

          <p className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-400">
            Esta página solo confirma lo que ya aparece en el documento impreso. Para cualquier
            otro dato del acta, acude a la parroquia que la expidió.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{etiqueta}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">{valor || "—"}</dd>
    </div>
  );
}
