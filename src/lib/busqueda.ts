import type { Prisma } from "@prisma/client";

/**
 * Normaliza un texto para buscar: minúsculas, sin acentos y con los espacios
 * colapsados.
 *
 * Postgres con `mode: "insensitive"` ignora mayúsculas pero **no acentos**, así
 * que "Jose Muñoz" no encontraba "José Muñoz". En México eso falla a diario, y
 * el capturista rara vez escribe los acentos igual que quien pregunta.
 */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Arma el texto de búsqueda de un acta a partir de los datos del sacramento.
 *
 * Va todo lo que alguien podría usar para encontrar una partida: el titular,
 * sus padres, los padrinos y los testigos. Mucha gente llega diciendo "soy
 * hijo de Fulano" sin recordar cómo quedó escrito su propio nombre.
 */
export function textoBusquedaDeDetalle(
  detalle: Pick<
    Prisma.ActaCreateInput,
    "bautizo" | "primeraComunion" | "confirmacion" | "matrimonio"
  >,
): string {
  const partes: (string | null | undefined)[] = [];

  const b = detalle.bautizo?.create as Prisma.BautizoCreateWithoutActaInput | undefined;
  if (b) partes.push(b.nombreCompleto, b.nombrePadre, b.nombreMadre, b.padrino, b.madrina);

  const pc = detalle.primeraComunion?.create as
    | Prisma.PrimeraComunionCreateWithoutActaInput
    | undefined;
  if (pc)
    partes.push(pc.nombre, pc.apellidos, pc.nombrePadre, pc.nombreMadre, pc.padrino, pc.madrina);

  const c = detalle.confirmacion?.create as
    | Prisma.ConfirmacionCreateWithoutActaInput
    | undefined;
  if (c) partes.push(c.nombreCompleto, c.nombrePadre, c.nombreMadre, c.padrino, c.madrina);

  const m = detalle.matrimonio?.create as Prisma.MatrimonioCreateWithoutActaInput | undefined;
  if (m)
    partes.push(
      m.nombreEsposo,
      m.nombreEsposa,
      m.padreEsposo,
      m.madreEsposo,
      m.padreEsposa,
      m.madreEsposa,
      m.testigo1,
      m.testigo2,
    );

  return normalizar(partes.filter(Boolean).join(" "));
}
