export const TIPOS_ACTA = [
  "BAUTIZO",
  "PRIMERA_COMUNION",
  "CONFIRMACION",
  "MATRIMONIO",
] as const;

export type TipoActa = (typeof TIPOS_ACTA)[number];

export const TIPO_ACTA_LABEL: Record<TipoActa, string> = {
  BAUTIZO: "Bautizo",
  PRIMERA_COMUNION: "Primera Comunión",
  CONFIRMACION: "Confirmación",
  MATRIMONIO: "Matrimonio",
};

export const TIPO_ACTA_RUTA: Record<TipoActa, string> = {
  BAUTIZO: "bautizo",
  PRIMERA_COMUNION: "primera-comunion",
  CONFIRMACION: "confirmacion",
  MATRIMONIO: "matrimonio",
};

export function esTipoActaValido(valor: string): valor is TipoActa {
  return (TIPOS_ACTA as readonly string[]).includes(valor);
}

export function rutaATipo(ruta: string): TipoActa | null {
  const entrada = Object.entries(TIPO_ACTA_RUTA).find(([, r]) => r === ruta);
  return entrada ? (entrada[0] as TipoActa) : null;
}
