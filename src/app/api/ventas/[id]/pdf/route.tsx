import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { requireSesion } from "@/lib/authz";
import { VentaPdfDocument } from "@/lib/pdf/venta-pdf";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let sesion;
  try {
    sesion = await requireSesion();
  } catch {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const venta = await prisma.venta.findUnique({
    where: { id },
    include: { iglesia: true, vendidoPor: true, items: true },
  });

  if (!venta) {
    return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
  }
  if (!sesion.esSuperAdmin && venta.iglesiaId !== sesion.iglesiaId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const buffer = await renderToBuffer(<VentaPdfDocument venta={venta} />);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="ticket-${venta.id}.pdf"`,
    },
  });
}
