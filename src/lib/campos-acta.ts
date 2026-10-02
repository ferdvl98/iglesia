import type { TipoActa } from "@prisma/client";
import {
  bautizoSchema,
  primeraComunionSchema,
  confirmacionSchema,
  matrimonioSchema,
} from "@/lib/validaciones";

/** Campos que viven en el acta, no en el sacramento. */
const CAMPOS_BASE = ["libro", "fecha", "lugar", "ministro", "observaciones"] as const;

const ESQUEMA_POR_TIPO = {
  BAUTIZO: bautizoSchema,
  PRIMERA_COMUNION: primeraComunionSchema,
  CONFIRMACION: confirmacionSchema,
  MATRIMONIO: matrimonioSchema,
} as const;

/** La relación de Prisma que guarda el detalle de cada sacramento. */
export const RELACION_POR_TIPO: Record<TipoActa, "bautizo" | "primeraComunion" | "confirmacion" | "matrimonio"> = {
  BAUTIZO: "bautizo",
  PRIMERA_COMUNION: "primeraComunion",
  CONFIRMACION: "confirmacion",
  MATRIMONIO: "matrimonio",
};

export function esquemaDe(tipo: TipoActa) {
  return ESQUEMA_POR_TIPO[tipo];
}

/**
 * Nombres de los campos propios del sacramento, sacados del esquema de
 * validación en vez de escritos a mano.
 *
 * Así la corrección de actas no puede quedarse atrás del alta: si mañana se
 * agrega un campo al esquema, la corrección lo recoge sola. Si estuviera
 * escrita aparte, una corrección borraría en silencio los campos que no
 * conociera.
 */
export function camposDelSacramento(tipo: TipoActa): string[] {
  const base = new Set<string>(CAMPOS_BASE);
  return Object.keys(ESQUEMA_POR_TIPO[tipo].shape).filter((c) => !base.has(c));
}

/** Campos que no son texto libre y necesitan convertirse antes de guardarse. */
const FECHAS = new Set([
  "fechaNacimiento",
  "fechaBautismo",
  "fechaNacimientoEsposo",
  "fechaNacimientoEsposa",
]);
const ENTEROS = new Set(["fojaBautismo", "actaBautismo", "edadEsposo", "edadEsposa"]);
const OBLIGATORIOS = new Set([
  "nombreCompleto",
  "nombre",
  "apellidos",
  "nombreEsposo",
  "nombreEsposa",
]);

export type ValorCampo = string | number | Date | null;

/** Convierte el texto del formulario al valor que espera la base de datos. */
export function convertirCampo(campo: string, valor: string | undefined): ValorCampo {
  const texto = valor?.trim() ?? "";
  if (OBLIGATORIOS.has(campo)) return texto;
  if (texto === "") return null;
  if (FECHAS.has(campo)) return new Date(texto);
  if (ENTEROS.has(campo)) {
    const n = Number.parseInt(texto, 10);
    return Number.isNaN(n) ? null : n;
  }
  if (campo === "sexo") return texto === "MASCULINO" || texto === "FEMENINO" ? texto : null;
  return texto;
}

/** Cómo se muestra un valor en el historial de correcciones. */
export function comoTexto(valor: unknown): string | null {
  if (valor === null || valor === undefined || valor === "") return null;
  if (valor instanceof Date) return valor.toISOString().slice(0, 10);
  return String(valor);
}

/**
 * Cómo se llama cada campo para una persona, no para la base de datos.
 * Lo usa la exportación, que termina abierta en Excel por la secretaria.
 */
const ETIQUETAS: Record<string, string> = {
  nombreCompleto: "Nombre completo",
  nombre: "Nombre(s)",
  apellidos: "Apellidos",
  sexo: "Sexo",
  fechaNacimiento: "Fecha de nacimiento",
  lugarNacimiento: "Lugar de nacimiento",
  domicilio: "Domicilio",
  nombrePadre: "Padre",
  nombreMadre: "Madre",
  padrino: "Padrino",
  madrina: "Madrina",
  catequista: "Catequista",
  parroquiaBautismo: "Parroquia de bautismo",
  fechaBautismo: "Fecha de bautismo",
  libroBautismo: "Libro de bautismo",
  fojaBautismo: "Foja de bautismo",
  actaBautismo: "Partida de bautismo",
  obispoMinistro: "Obispo o ministro",
  nombreEsposo: "Esposo",
  fechaNacimientoEsposo: "Fecha de nacimiento del esposo",
  estadoCivilEsposo: "Estado civil del esposo",
  edadEsposo: "Edad del esposo",
  origenEsposo: "Origen del esposo",
  domicilioEsposo: "Domicilio del esposo",
  padreEsposo: "Padre del esposo",
  madreEsposo: "Madre del esposo",
  nombreEsposa: "Esposa",
  fechaNacimientoEsposa: "Fecha de nacimiento de la esposa",
  estadoCivilEsposa: "Estado civil de la esposa",
  edadEsposa: "Edad de la esposa",
  origenEsposa: "Origen de la esposa",
  domicilioEsposa: "Domicilio de la esposa",
  padreEsposa: "Padre de la esposa",
  madreEsposa: "Madre de la esposa",
  testigo1: "Testigo 1",
  testigo2: "Testigo 2",
  actaCivilNumero: "No. de acta civil",
  lugarTramite: "Lugar del trámite",
};

/**
 * Si un campo nuevo no tiene etiqueta, se arma una legible a partir de su
 * nombre en vez de volcar el identificador crudo en la hoja de cálculo.
 */
export function etiquetaDeCampo(campo: string): string {
  if (ETIQUETAS[campo]) return ETIQUETAS[campo];
  const palabras = campo.replace(/([A-Z])/g, " $1").toLowerCase().trim();
  return palabras.charAt(0).toUpperCase() + palabras.slice(1);
}
