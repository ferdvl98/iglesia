import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireSesion, filtroIglesia } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import {
  resolverRangoMeses,
  calcularIngresosPorMes,
  calcularReimpresionesPorTipo,
  calcularVentasPorMes,
  calcularProductosMasVendidos,
  etiquetaPeriodo as construirEtiquetaPeriodo,
} from "@/lib/ingresos";
import { InformeIngresosPdf } from "@/lib/pdf/informe-ingresos-pdf";

export async function GET(req: Request) {
  const sesion = await requireSesion();
  const where = filtroIglesia(sesion);
  const url = new URL(req.url);
  const params = {
    preset: url.searchParams.get("preset") ?? undefined,
    desde: url.searchParams.get("desde") ?? undefined,
    hasta: url.searchParams.get("hasta") ?? undefined,
  };

  const { desde, hasta } = resolverRangoMeses(params);
  const [meses, reimpresionesPorTipo, ventasPorMes, productosMasVendidos, iglesia] = await Promise.all([
    calcularIngresosPorMes(where, desde, hasta),
    calcularReimpresionesPorTipo(where, desde, hasta),
    calcularVentasPorMes(where, desde, hasta),
    calcularProductosMasVendidos(where, desde, hasta, 10),
    sesion.esSuperAdmin ? Promise.resolve(null) : prisma.iglesia.findUnique({ where: { id: sesion.iglesiaId ?? "" } }),
  ]);

  const buffer = await renderToBuffer(
    <InformeIngresosPdf
      meses={meses}
      reimpresionesPorTipo={reimpresionesPorTipo}
      ventasPorMes={ventasPorMes}
      productosMasVendidos={productosMasVendidos}
      etiquetaPeriodo={construirEtiquetaPeriodo(desde, hasta)}
      nombreIglesia={iglesia?.nombre}
    />,
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="informe-ingresos-${desde.getFullYear()}-${desde.getMonth() + 1}.pdf"`,
    },
  });
}
