import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSesion, puedeEscribir, puedeAdministrarMinistros } from "@/lib/authz";
import { TIPO_ACTA_LABEL } from "@/lib/tipos-acta";
import { RELACION_POR_TIPO, camposDelSacramento, comoTexto } from "@/lib/campos-acta";
import { ActaForm } from "../../nueva/[tipoRuta]/acta-form";

export default async function CorregirActaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sesion = await requireSesion();
  if (!puedeEscribir(sesion)) redirect(`/actas/${id}`);

  const acta = await prisma.acta.findUnique({
    where: { id },
    include: { bautizo: true, primeraComunion: true, confirmacion: true, matrimonio: true },
  });
  if (!acta) notFound();
  if (!sesion.esSuperAdmin && acta.iglesiaId !== sesion.iglesiaId) notFound();
  // La UI esconde el enlace, pero por URL directa hay que volver a comprobarlo.
  if (acta.anulada) redirect(`/actas/${id}`);

  const detalle = acta[RELACION_POR_TIPO[acta.tipo]];
  if (!detalle) redirect(`/actas/${id}`);

  const ministros = await prisma.ministro.findMany({
    where: { activo: true, iglesiaId: acta.iglesiaId },
    orderBy: { nombre: "asc" },
  });

  // Valores actuales para precargar el formulario.
  const valores: Record<string, string> = {
    fecha: acta.fecha.toISOString().slice(0, 10),
    lugar: acta.lugar ?? "",
    observaciones: acta.observaciones ?? "",
    ministroId: acta.ministroId ?? "",
    ministro: acta.ministro ?? "",
  };
  for (const campo of camposDelSacramento(acta.tipo)) {
    valores[campo] = comoTexto((detalle as Record<string, unknown>)[campo]) ?? "";
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">
          Corregir acta de {TIPO_ACTA_LABEL[acta.tipo]} — Libro {acta.libro}, Partida{" "}
          {acta.numeroActa}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Corriges la copia en el sistema, no el libro. El libro, la partida y la foja no se
          tocan. Queda registrado qué cambió, quién y cuándo.
        </p>
      </div>

      <ActaForm
        tipo={acta.tipo}
        modo="editar"
        actaId={acta.id}
        valores={valores}
        iglesias={[]}
        ministros={ministros}
        puedeAdministrarMinistros={puedeAdministrarMinistros(sesion)}
        libros={[]}
      />

      <Link href={`/actas/${acta.id}`} className="text-sm text-slate-500 hover:underline">
        ← Cancelar y volver al acta
      </Link>
    </div>
  );
}
