export const PARTIDAS_POR_FOJA_DEFECTO = 4;
export const FOJAS_POR_LIBRO_DEFECTO = 200;

export function calcularUbicacion(numeroActa: number, partidasPorFoja: number) {
  const foja = Math.ceil(numeroActa / partidasPorFoja);
  const posicionEnFoja = numeroActa - (foja - 1) * partidasPorFoja;
  return { foja, posicionEnFoja };
}

export function partidasPorLibro(fojasPorLibro: number, partidasPorFoja: number) {
  return fojasPorLibro * partidasPorFoja;
}

export function libroLleno(
  siguientePartida: number,
  fojasPorLibro: number,
  partidasPorFoja: number,
) {
  return siguientePartida > partidasPorLibro(fojasPorLibro, partidasPorFoja);
}
