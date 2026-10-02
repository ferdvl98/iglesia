import { z } from "zod";

const campoTexto = z.string().trim().min(1, "Este campo es obligatorio");
const campoOpcional = z.string().trim().optional().or(z.literal(""));

/**
 * Las fechas llegan como texto del formulario y antes se pasaban tal cual a
 * `new Date()`: un valor inválido producía un Invalid Date que Prisma rechaza
 * con un 500. La cota superior/inferior además atrapa erratas de captura
 * (un año de 5 cifras, o una fecha en el futuro).
 */
const ANIO_MINIMO = 1800;
function esFechaValida(valor: string) {
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return false;
  const anio = fecha.getUTCFullYear();
  return anio >= ANIO_MINIMO && anio <= new Date().getUTCFullYear() + 1;
}
const MENSAJE_FECHA = `Fecha inválida (debe estar entre ${ANIO_MINIMO} y el año próximo)`;

const campoFecha = campoTexto.refine(esFechaValida, MENSAJE_FECHA);
const campoFechaOpcional = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || esFechaValida(v), MENSAJE_FECHA);

export const baseActaSchema = z.object({
  libro: campoTexto,
  fecha: campoFecha,
  lugar: campoOpcional,
  ministro: campoOpcional,
  observaciones: campoOpcional,
});

export const bautizoSchema = baseActaSchema.extend({
  nombreCompleto: campoTexto,
  sexo: campoOpcional,
  fechaNacimiento: campoFechaOpcional,
  lugarNacimiento: campoOpcional,
  domicilio: campoOpcional,
  nombrePadre: campoOpcional,
  nombreMadre: campoOpcional,
  padrino: campoOpcional,
  madrina: campoOpcional,
});

export const primeraComunionSchema = baseActaSchema.extend({
  nombre: campoTexto,
  apellidos: campoTexto,
  sexo: campoOpcional,
  fechaNacimiento: campoFechaOpcional,
  nombrePadre: campoOpcional,
  nombreMadre: campoOpcional,
  padrino: campoOpcional,
  madrina: campoOpcional,
  catequista: campoOpcional,
  parroquiaBautismo: campoOpcional,
  fechaBautismo: campoFechaOpcional,
});

export const confirmacionSchema = baseActaSchema.extend({
  nombreCompleto: campoTexto,
  sexo: campoOpcional,
  fechaNacimiento: campoFechaOpcional,
  lugarNacimiento: campoOpcional,
  nombrePadre: campoOpcional,
  nombreMadre: campoOpcional,
  padrino: campoOpcional,
  madrina: campoOpcional,
  obispoMinistro: campoOpcional,
  parroquiaBautismo: campoOpcional,
  fechaBautismo: campoFechaOpcional,
  libroBautismo: campoOpcional,
  fojaBautismo: campoOpcional,
  actaBautismo: campoOpcional,
});

export const matrimonioSchema = baseActaSchema.extend({
  nombreEsposo: campoTexto,
  fechaNacimientoEsposo: campoFechaOpcional,
  estadoCivilEsposo: campoOpcional,
  edadEsposo: campoOpcional,
  origenEsposo: campoOpcional,
  domicilioEsposo: campoOpcional,
  padreEsposo: campoOpcional,
  madreEsposo: campoOpcional,
  nombreEsposa: campoTexto,
  fechaNacimientoEsposa: campoFechaOpcional,
  estadoCivilEsposa: campoOpcional,
  edadEsposa: campoOpcional,
  origenEsposa: campoOpcional,
  domicilioEsposa: campoOpcional,
  padreEsposa: campoOpcional,
  madreEsposa: campoOpcional,
  testigo1: campoOpcional,
  testigo2: campoOpcional,
  actaCivilNumero: campoOpcional,
  lugarTramite: campoOpcional,
});

export type BautizoInput = z.infer<typeof bautizoSchema>;
export type PrimeraComunionInput = z.infer<typeof primeraComunionSchema>;
export type ConfirmacionInput = z.infer<typeof confirmacionSchema>;
export type MatrimonioInput = z.infer<typeof matrimonioSchema>;
