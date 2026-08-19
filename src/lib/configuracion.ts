import { prisma } from "@/lib/prisma";
import { FOJAS_POR_LIBRO_DEFECTO, PARTIDAS_POR_FOJA_DEFECTO } from "@/lib/libro";
import type { TipoActa } from "@prisma/client";

export type ConfiguracionResuelta = {
  fojasPorLibro: number;
  partidasPorFoja: number;
  precioRegistro: number | null;
  precioReimpresion: number | null;
};

const DEFECTO: ConfiguracionResuelta = {
  fojasPorLibro: FOJAS_POR_LIBRO_DEFECTO,
  partidasPorFoja: PARTIDAS_POR_FOJA_DEFECTO,
  precioRegistro: null,
  precioReimpresion: null,
};

export async function obtenerConfiguracion(
  iglesiaId: string,
  tipo: TipoActa,
): Promise<ConfiguracionResuelta> {
  const config = await prisma.configuracionActa.findUnique({
    where: { iglesiaId_tipo: { iglesiaId, tipo } },
  });
  if (!config) return DEFECTO;
  return {
    fojasPorLibro: config.fojasPorLibro,
    partidasPorFoja: config.partidasPorFoja,
    precioRegistro: config.precioRegistro,
    precioReimpresion: config.precioReimpresion,
  };
}

export async function obtenerConfiguracionesIglesia(iglesiaId: string) {
  const configs = await prisma.configuracionActa.findMany({ where: { iglesiaId } });
  const porTipo = new Map(configs.map((c) => [c.tipo, c]));
  return porTipo;
}
