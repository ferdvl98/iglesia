import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { requireSesion } from "@/lib/authz";
import { ActaPdfDocument } from "@/lib/pdf/acta-pdf";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let sesion;
  try {
    sesion = await requireSesion();
  } catch {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
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

  const buffer = await renderToBuffer(<ActaPdfDocument acta={acta} />);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="acta-${acta.tipo.toLowerCase()}-${acta.numeroActa}.pdf"`,
    },
  });
}
