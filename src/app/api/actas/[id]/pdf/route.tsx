import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { obtenerSesion, puedeConsultarActas } from "@/lib/authz";
import { ActaPdfDocument } from "@/lib/pdf/acta-pdf";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const sesion = await obtenerSesion();
  if (!sesion) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  // Las páginas de actas exigen este permiso (actas/page.tsx, actas/[id]/page.tsx);
  // sin él aquí, bastaba con escribir la URL para obtener cualquier acta.
  if (!puedeConsultarActas(sesion)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const acta = await prisma.acta.findUnique({
    where: { id },
    include: {
      iglesia: true,
      bautizo: true,
      primeraComunion: true,
      confirmacion: true,
      matrimonio: true,
    },
  });

  if (!acta) {
    return NextResponse.json({ error: "Acta no encontrada" }, { status: 404 });
  }
  if (!sesion.esSuperAdmin && acta.iglesiaId !== sesion.iglesiaId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // Si falta la fila del sacramento, ActaPdfDocument cae a un documento
  // genérico con las secciones vacías. Para un libro parroquial es peor emitir
  // un acta incompleta que no emitirla.
  const detalle =
    (acta.tipo === "BAUTIZO" && acta.bautizo) ||
    (acta.tipo === "PRIMERA_COMUNION" && acta.primeraComunion) ||
    (acta.tipo === "CONFIRMACION" && acta.confirmacion) ||
    (acta.tipo === "MATRIMONIO" && acta.matrimonio);
  if (!detalle) {
    return NextResponse.json(
      {
        error:
          "Esta acta no tiene los datos del sacramento y no se puede imprimir. Repórtalo al administrador del sistema.",
      },
      { status: 422 },
    );
  }

  const buffer = await renderToBuffer(<ActaPdfDocument acta={acta} />);

  // Queda constancia de cada entrega del PDF: el Pago de REIMPRESION no sirve
  // como bitácora porque no se crea si la reimpresión es gratuita, ni si se
  // llega aquí por URL directa sin pasar por el botón.
  await prisma.impresionActa.create({
    data: { actaId: acta.id, impresoPorId: sesion.id },
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="acta-${acta.tipo.toLowerCase()}-${acta.numeroActa}.pdf"`,
    },
  });
}
