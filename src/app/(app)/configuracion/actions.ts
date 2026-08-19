"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSesion, puedeConfigurar } from "@/lib/authz";
import { TIPOS_ACTA } from "@/lib/tipos-acta";

export type EstadoFormulario = { error: string } | { ok: true } | null;

function numeroEntero(valor: FormDataEntryValue | null, minimo: number) {
  if (typeof valor !== "string" || valor.trim() === "") return null;
  const n = Number(valor);
  if (!Number.isInteger(n) || n < minimo) return undefined;
  return n;
}

function precio(valor: FormDataEntryValue | null) {
  if (typeof valor !== "string" || valor.trim() === "") return null;
  const n = Number(valor);
  if (Number.isNaN(n) || n < 0) return undefined;
  return n;
}

async function resolverIglesiaId(sesion: Awaited<ReturnType<typeof requireSesion>>, formData: FormData) {
  if (sesion.esSuperAdmin) {
    const iglesiaId = formData.get("iglesiaId");
    if (!iglesiaId || typeof iglesiaId !== "string") {
      throw new Error("Debes seleccionar una iglesia");
    }
    return iglesiaId;
  }
  if (!sesion.iglesiaId) throw new Error("Tu usuario no tiene una iglesia asignada");
  return sesion.iglesiaId;
}

export async function guardarConfiguracion(
  _prevState: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const sesion = await requireSesion();
  if (!puedeConfigurar(sesion)) return { error: "No tienes permiso para modificar la configuración." };

  let iglesiaId: string;
  try {
    iglesiaId = await resolverIglesiaId(sesion, formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Iglesia inválida." };
  }

  const filas = [];
  for (const tipo of TIPOS_ACTA) {
    const fojasPorLibro = numeroEntero(formData.get(`fojasPorLibro_${tipo}`), 1);
    const partidasPorFoja = numeroEntero(formData.get(`partidasPorFoja_${tipo}`), 1);
    const precioRegistro = precio(formData.get(`precioRegistro_${tipo}`));
    const precioReimpresion = precio(formData.get(`precioReimpresion_${tipo}`));

    if (
      fojasPorLibro === undefined ||
      partidasPorFoja === undefined ||
      precioRegistro === undefined ||
      precioReimpresion === undefined
    ) {
      return { error: `Revisa los valores capturados para ${tipo}: deben ser números válidos.` };
    }

    filas.push({
      tipo,
      fojasPorLibro: fojasPorLibro ?? 200,
      partidasPorFoja: partidasPorFoja ?? 4,
      precioRegistro,
      precioReimpresion,
    });
  }

  await prisma.$transaction(
    filas.map((fila) =>
      prisma.configuracionActa.upsert({
        where: { iglesiaId_tipo: { iglesiaId, tipo: fila.tipo } },
        create: { iglesiaId, ...fila },
        update: {
          fojasPorLibro: fila.fojasPorLibro,
          partidasPorFoja: fila.partidasPorFoja,
          precioRegistro: fila.precioRegistro,
          precioReimpresion: fila.precioReimpresion,
        },
      }),
    ),
  );

  revalidatePath("/configuracion");
  return { ok: true };
}
