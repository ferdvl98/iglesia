import { randomInt } from "node:crypto";

/**
 * Alfabeto sin caracteres que se confunden al dictar o al teclear desde un
 * papel: sin 0/O, sin 1/I/L. Quien recibe una constancia puede tener que
 * escribir el folio a mano si no puede escanear el QR.
 */
const ALFABETO = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const GRUPOS = 3;
const POR_GRUPO = 4;

/**
 * Folio de verificación de un acta: el código que se imprime y que lleva el QR.
 *
 * No puede ser el `id` del acta: ese viaja en las URLs de la aplicación, así
 * que quien lo conoce podría construir enlaces de verificación de actas que no
 * tiene. Este es independiente y aleatorio.
 *
 * Doce caracteres de un alfabeto de 31 dan ~7.8e17 combinaciones: inadivinable
 * por fuerza bruta contra una página pública, que es el único punto donde
 * alguien podría intentar recorrerlos.
 */
export function generarFolio(): string {
  const grupos: string[] = [];
  for (let g = 0; g < GRUPOS; g++) {
    let grupo = "";
    for (let i = 0; i < POR_GRUPO; i++) {
      grupo += ALFABETO[randomInt(ALFABETO.length)];
    }
    grupos.push(grupo);
  }
  return grupos.join("-");
}

/**
 * Normaliza lo que alguien teclea: mayúsculas, sin guiones ni espacios, y
 * reagrupado.
 *
 * Deliberadamente **no** intenta corregir caracteres mal leídos: como el
 * alfabeto ya excluye los que se confunden, "adivinar" que una O era una Q
 * podría convertir un folio inexistente en el de otra acta.
 */
export function normalizarFolio(entrada: string): string {
  const limpio = entrada.toUpperCase().replace(/[^0-9A-Z]/g, "");
  const grupos: string[] = [];
  for (let i = 0; i < limpio.length; i += POR_GRUPO) {
    grupos.push(limpio.slice(i, i + POR_GRUPO));
  }
  return grupos.join("-");
}
