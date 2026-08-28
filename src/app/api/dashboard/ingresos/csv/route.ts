import { NextResponse } from "next/server";
import { requireSesion, filtroIglesia } from "@/lib/authz";
import { TIPO_ACTA_LABEL, TIPOS_ACTA } from "@/lib/tipos-acta";
import {
  resolverRangoMeses,
  calcularIngresosPorMes,
  calcularReimpresionesPorTipo,
  calcularVentasPorMes,
  calcularProductosMasVendidos,
  etiquetaPeriodo,
} from "@/lib/ingresos";

function celda(valor: string | number) {
  const texto = String(valor);
  return /[",\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

function fila(valores: (string | number)[]) {
  return valores.map(celda).join(",");
}

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
  const [ingresosPorMes, reimpresionesPorTipo, ventasPorMes, productosMasVendidos] = await Promise.all([
    calcularIngresosPorMes(where, desde, hasta),
    calcularReimpresionesPorTipo(where, desde, hasta),
    calcularVentasPorMes(where, desde, hasta),
    calcularProductosMasVendidos(where, desde, hasta, 10),
  ]);

  const lineas: string[] = [];
  lineas.push(fila([`Ingresos — ${etiquetaPeriodo(desde, hasta)}`]));
  lineas.push("");
  lineas.push(fila(["Mes", ...TIPOS_ACTA.map((t) => TIPO_ACTA_LABEL[t]), "Total"]));
  for (const mes of ingresosPorMes) {
    lineas.push(fila([mes.etiqueta, ...TIPOS_ACTA.map((t) => mes.porTipo[t]), mes.total]));
  }
  const totalGeneral = ingresosPorMes.reduce((acc, m) => acc + m.total, 0);
  lineas.push(
    fila([
      "Total del período",
      ...TIPOS_ACTA.map((t) => ingresosPorMes.reduce((acc, m) => acc + m.porTipo[t], 0)),
      totalGeneral,
    ]),
  );
  lineas.push("");
  lineas.push(fila(["Reimpresiones por tipo"]));
  lineas.push(fila(["Tipo", "Cantidad"]));
  for (const tipo of TIPOS_ACTA) {
    lineas.push(fila([TIPO_ACTA_LABEL[tipo], reimpresionesPorTipo[tipo]]));
  }

  const totalVentas = ventasPorMes.reduce((acc, m) => acc + m.total, 0);
  lineas.push("");
  lineas.push(fila(["Punto de venta (aparte de actas)"]));
  lineas.push(fila(["Mes", "Total"]));
  for (const mes of ventasPorMes) {
    lineas.push(fila([mes.etiqueta, mes.total]));
  }
  lineas.push(fila(["Total del período", totalVentas]));
  lineas.push("");
  lineas.push(fila(["Productos más vendidos"]));
  lineas.push(fila(["Producto", "Unidades", "Ingreso"]));
  for (const producto of productosMasVendidos) {
    lineas.push(fila([producto.nombre, producto.cantidad, producto.subtotal]));
  }

  const csv = "﻿" + lineas.join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ingresos-${desde.getFullYear()}-${desde.getMonth() + 1}.csv"`,
    },
  });
}
