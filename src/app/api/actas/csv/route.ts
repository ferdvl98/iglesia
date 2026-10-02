import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion, puedeConsultarActas } from "@/lib/authz";
import { construirFiltroActas, type ParametrosActas } from "@/lib/filtros-actas";
import { TIPO_ACTA_LABEL, esTipoActaValido, type TipoActa } from "@/lib/tipos-acta";
import {
  RELACION_POR_TIPO,
  camposDelSacramento,
  comoTexto,
  etiquetaDeCampo,
} from "@/lib/campos-acta";

/** Tope de seguridad: evita que una exportación sin filtros agote la memoria. */
const MAXIMO = 20000;

function celda(valor: unknown): string {
  const texto = comoTexto(valor) ?? "";
  return /[",\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

export async function GET(req: Request) {
  const sesion = await obtenerSesion();
  if (!sesion) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!puedeConsultarActas(sesion)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams) as ParametrosActas;
  const where = construirFiltroActas(sesion, params);

  const actas = await prisma.acta.findMany({
    where,
    orderBy: [{ tipo: "asc" }, { libro: "asc" }, { numeroActa: "asc" }],
    take: MAXIMO,
    include: {
      iglesia: { select: { nombre: true } },
      creadoPor: { select: { nombre: true } },
      anuladoPor: { select: { nombre: true } },
      bautizo: true,
      primeraComunion: true,
      confirmacion: true,
      matrimonio: true,
    },
  });

  // Con un tipo filtrado se exportan todas sus columnas; sin filtro se mezclan
  // cuatro sacramentos con campos distintos, así que solo van las comunes.
  const tipoFiltrado: TipoActa | null =
    params.tipo && esTipoActaValido(params.tipo) ? params.tipo : null;
  const columnasSacramento = tipoFiltrado ? camposDelSacramento(tipoFiltrado) : [];

  const encabezado = [
    "Tipo",
    "Libro",
    "Foja",
    "Posicion en foja",
    "No. de partida",
    "Fecha",
    "Lugar",
    "Ministro",
    ...columnasSacramento.map(etiquetaDeCampo),
    "Observaciones",
    "Estado",
    "Motivo de anulacion",
    "Anulada por",
    "Anulada el",
    "Registrada por",
    "Registrada el",
    "Iglesia",
  ];

  const filas = actas.map((acta) => {
    const detalle = acta[RELACION_POR_TIPO[acta.tipo]] as Record<string, unknown> | null;
    return [
      TIPO_ACTA_LABEL[acta.tipo],
      acta.libro,
      acta.foja,
      acta.posicionEnFoja,
      acta.numeroActa,
      acta.fecha,
      acta.lugar,
      acta.ministro,
      ...columnasSacramento.map((c) => detalle?.[c] ?? ""),
      acta.observaciones,
      acta.anulada ? "Anulada" : "Vigente",
      acta.motivoAnulacion,
      acta.anuladoPor?.nombre ?? "",
      acta.fechaAnulacion,
      acta.creadoPor?.nombre ?? "",
      acta.createdAt,
      acta.iglesia.nombre,
    ];
  });

  // BOM para que Excel reconozca el UTF-8 y no destroce los acentos.
  const csv =
    "﻿" + [encabezado, ...filas].map((f) => f.map(celda).join(",")).join("\r\n");

  const nombre = tipoFiltrado
    ? `actas-${TIPO_ACTA_LABEL[tipoFiltrado].toLowerCase().replace(/\s+/g, "-")}.csv`
    : "actas.csv";

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nombre}"`,
    },
  });
}
