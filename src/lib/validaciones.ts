import { z } from "zod";

const campoTexto = z.string().trim().min(1, "Este campo es obligatorio");
const campoOpcional = z.string().trim().optional().or(z.literal(""));

export const baseActaSchema = z.object({
  libro: campoTexto,
  fecha: campoTexto,
  lugar: campoOpcional,
  ministro: campoOpcional,
  observaciones: campoOpcional,
});

export const bautizoSchema = baseActaSchema.extend({
  nombreCompleto: campoTexto,
  fechaNacimiento: campoOpcional,
  lugarNacimiento: campoOpcional,
  nombrePadre: campoOpcional,
  nombreMadre: campoOpcional,
  padrino: campoOpcional,
  madrina: campoOpcional,
});

export const primeraComunionSchema = baseActaSchema.extend({
  nombreCompleto: campoTexto,
  fechaNacimiento: campoOpcional,
  nombrePadre: campoOpcional,
  nombreMadre: campoOpcional,
  padrino: campoOpcional,
  madrina: campoOpcional,
  catequista: campoOpcional,
});

export const confirmacionSchema = baseActaSchema.extend({
  nombreCompleto: campoTexto,
  fechaNacimiento: campoOpcional,
  nombrePadre: campoOpcional,
  nombreMadre: campoOpcional,
  padrino: campoOpcional,
  madrina: campoOpcional,
  obispoMinistro: campoOpcional,
});

export const matrimonioSchema = baseActaSchema.extend({
  nombreEsposo: campoTexto,
  fechaNacimientoEsposo: campoOpcional,
  padreEsposo: campoOpcional,
  madreEsposo: campoOpcional,
  nombreEsposa: campoTexto,
  fechaNacimientoEsposa: campoOpcional,
  padreEsposa: campoOpcional,
  madreEsposa: campoOpcional,
  testigo1: campoOpcional,
  testigo2: campoOpcional,
  actaCivilNumero: campoOpcional,
});

export type BautizoInput = z.infer<typeof bautizoSchema>;
export type PrimeraComunionInput = z.infer<typeof primeraComunionSchema>;
export type ConfirmacionInput = z.infer<typeof confirmacionSchema>;
export type MatrimonioInput = z.infer<typeof matrimonioSchema>;
