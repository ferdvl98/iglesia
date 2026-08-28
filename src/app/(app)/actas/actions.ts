"use server";

import { revalidatePath } from "next/cache";
import type { TipoActa as TipoActaPrisma, MetodoPago, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSesion, puedeEscribir } from "@/lib/authz";
import {
  bautizoSchema,
  primeraComunionSchema,
  confirmacionSchema,
  matrimonioSchema,
} from "@/lib/validaciones";
import { esTipoActaValido } from "@/lib/tipos-acta";
import { calcularUbicacion, libroLleno, partidasPorLibro } from "@/lib/libro";
import { obtenerConfiguracion } from "@/lib/configuracion";

export type EstadoFormulario = { error: string } | null;
export type ResultadoCrearActa = { error: string } | { ok: true; actaId: string };

const MAX_INTENTOS_ASIGNACION = 5;
const MENSAJE_SESION_INVALIDA =
  "Tu sesión quedó desactualizada. Cierra sesión (arriba a la derecha) y vuelve a iniciarla.";

function esErrorDeUsuarioInvalido(e: unknown) {
  const codigo = e && typeof e === "object" && "code" in e ? (e as { code?: string }).code : null;
  // P2003: viola llave foránea; P2025: el registro relacionado (usuario) no existe.
  return codigo === "P2003" || codigo === "P2025";
}

function datosBase(formData: FormData) {
  return {
    libro: formData.get("libro"),
    fecha: formData.get("fecha"),
    lugar: formData.get("lugar"),
    // "ministro" solo se renderiza en el form cuando se elige "Otro"; si se
    // eligió un registro del catálogo el campo no existe (null) en vez de "".
    ministro: formData.get("ministro") ?? "",
    observaciones: formData.get("observaciones"),
  };
}

function limpiar(valor: string | undefined | null) {
  return valor && valor.trim() !== "" ? valor.trim() : null;
}

function limpiarEntero(valor: string | undefined | null) {
  if (!valor || valor.trim() === "") return null;
  const n = Number.parseInt(valor, 10);
  return Number.isNaN(n) ? null : n;
}

function limpiarSexo(valor: string | undefined | null): "MASCULINO" | "FEMENINO" | null {
  return valor === "MASCULINO" || valor === "FEMENINO" ? valor : null;
}

/** Resuelve el texto del ministro/celebrante a partir del registro
 * seleccionado (snapshot de título + nombre), o del texto manual si se
 * escribió "Otro" o no hay registro elegido. */
async function resolverMinistro(formData: FormData, iglesiaId: string, textoManual: string | null) {
  const ministroIdCrudo = formData.get("ministroId");
  const ministroId =
    typeof ministroIdCrudo === "string" && ministroIdCrudo && ministroIdCrudo !== "__otro__"
      ? ministroIdCrudo
      : null;
  if (!ministroId) return { ministroId: null, ministroTexto: textoManual };

  const ministro = await prisma.ministro.findUnique({ where: { id: ministroId } });
  if (!ministro || ministro.iglesiaId !== iglesiaId) return { ministroId: null, ministroTexto: textoManual };

  const texto = ministro.titulo ? `${ministro.titulo} ${ministro.nombre}` : ministro.nombre;
  return { ministroId: ministro.id, ministroTexto: texto };
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

/** Libros ya usados para un tipo de acta en una iglesia, con la próxima partida disponible en cada uno. */
export async function obtenerLibrosExistentes(iglesiaId: string, tipo: TipoActaPrisma) {
  const [libros, config] = await Promise.all([
    prisma.acta.groupBy({
      by: ["libro"],
      where: { iglesiaId, tipo },
      _max: { numeroActa: true },
    }),
    obtenerConfiguracion(iglesiaId, tipo),
  ]);

  return libros
    .map((l) => {
      const ultimaPartida = l._max.numeroActa ?? 0;
      const siguientePartida = ultimaPartida + 1;
      return {
        libro: l.libro,
        siguientePartida,
        lleno: libroLleno(siguientePartida, config.fojasPorLibro, config.partidasPorFoja),
      };
    })
    .sort((a, b) => {
      const numA = Number(a.libro);
      const numB = Number(b.libro);
      if (!Number.isNaN(numA) && !Number.isNaN(numB)) return numA - numB;
      return a.libro.localeCompare(b.libro);
    });
}

/**
 * Crea el acta asignando automáticamente el siguiente número de partida
 * dentro del libro (continuo), calculando su foja y posición (4 partidas
 * por foja). Reintenta si otra captura concurrente ya tomó ese número.
 */
async function crearActaConUbicacion(opts: {
  iglesiaId: string;
  tipo: TipoActaPrisma;
  libro: string;
  fecha: Date;
  lugar: string | null;
  ministro: string | null;
  ministroId: string | null;
  observaciones: string | null;
  creadoPorId: string;
  metodoPago: MetodoPago | null;
  detalle: Pick<
    Prisma.ActaCreateInput,
    "bautizo" | "primeraComunion" | "confirmacion" | "matrimonio"
  >;
}) {
  const config = await obtenerConfiguracion(opts.iglesiaId, opts.tipo);

  const requierePago = !!config.precioRegistro && config.precioRegistro > 0;
  if (requierePago && !opts.metodoPago) {
    throw new Error("Debes confirmar el cobro y el método de pago antes de registrar el acta.");
  }

  for (let intento = 0; intento < MAX_INTENTOS_ASIGNACION; intento++) {
    const ultima = await prisma.acta.aggregate({
      where: { iglesiaId: opts.iglesiaId, tipo: opts.tipo, libro: opts.libro },
      _max: { numeroActa: true },
    });
    const numeroActa = (ultima._max.numeroActa ?? 0) + 1;
    if (numeroActa > partidasPorLibro(config.fojasPorLibro, config.partidasPorFoja)) {
      throw new Error(
        `El libro ${opts.libro} ya alcanzó su límite de ${config.fojasPorLibro} fojas (${partidasPorLibro(config.fojasPorLibro, config.partidasPorFoja)} partidas). Abre un libro nuevo para continuar.`,
      );
    }
    const { foja, posicionEnFoja } = calcularUbicacion(numeroActa, config.partidasPorFoja);

    try {
      const acta = await prisma.acta.create({
        data: {
          tipo: opts.tipo,
          iglesia: { connect: { id: opts.iglesiaId } },
          libro: opts.libro,
          numeroActa,
          foja,
          posicionEnFoja,
          fecha: opts.fecha,
          lugar: opts.lugar,
          ministro: opts.ministro,
          ministroRegistro: opts.ministroId ? { connect: { id: opts.ministroId } } : undefined,
          observaciones: opts.observaciones,
          creadoPor: { connect: { id: opts.creadoPorId } },
          ...opts.detalle,
        },
      });

      if (requierePago && opts.metodoPago) {
        await prisma.pago.create({
          data: {
            actaId: acta.id,
            concepto: "REGISTRO",
            monto: config.precioRegistro!,
            metodo: opts.metodoPago,
            cobradoPorId: opts.creadoPorId,
          },
        });
      }

      return acta;
    } catch (e) {
      if (esErrorDeUsuarioInvalido(e)) throw new Error(MENSAJE_SESION_INVALIDA);
      const esConflicto =
        e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2002";
      if (!esConflicto) throw e;
      if (intento === MAX_INTENTOS_ASIGNACION - 1) {
        throw new Error(
          "No se pudo asignar un número de partida disponible, intenta de nuevo.",
        );
      }
      // otra captura tomó ese número justo ahora: reintentar con el siguiente
    }
  }
  throw new Error("No se pudo asignar un número de partida disponible.");
}

export async function crearActa(formData: FormData): Promise<ResultadoCrearActa> {
  const sesion = await requireSesion();
  if (!puedeEscribir(sesion)) return { error: "No tienes permiso para registrar actas." };
  const tipoParam = formData.get("tipo");
  if (typeof tipoParam !== "string" || !esTipoActaValido(tipoParam)) {
    return { error: "Tipo de acta inválido." };
  }

  let iglesiaId: string;
  try {
    iglesiaId = await resolverIglesiaId(sesion, formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Iglesia inválida." };
  }

  const configPrevia = await obtenerConfiguracion(iglesiaId, tipoParam);
  if (configPrevia.precioRegistro === null) {
    return {
      error:
        "Este tipo de acta no tiene un precio de registro configurado. Ve a Configuración para definirlo antes de continuar.",
    };
  }

  const metodoPagoTexto = formData.get("metodoPago");
  const metodoPago: MetodoPago | null =
    typeof metodoPagoTexto === "string" &&
    ["EFECTIVO", "TARJETA", "TRANSFERENCIA"].includes(metodoPagoTexto)
      ? (metodoPagoTexto as MetodoPago)
      : null;

  const base = datosBase(formData);
  const { ministroId, ministroTexto } = await resolverMinistro(
    formData,
    iglesiaId,
    limpiar(base.ministro as string | null),
  );
  let actaId: string;

  try {
    if (tipoParam === "BAUTIZO") {
      const datos = bautizoSchema.parse({
        ...base,
        nombreCompleto: formData.get("nombreCompleto"),
        sexo: formData.get("sexo"),
        fechaNacimiento: formData.get("fechaNacimiento"),
        lugarNacimiento: formData.get("lugarNacimiento"),
        domicilio: formData.get("domicilio"),
        nombrePadre: formData.get("nombrePadre"),
        nombreMadre: formData.get("nombreMadre"),
        padrino: formData.get("padrino"),
        madrina: formData.get("madrina"),
      });
      const acta = await crearActaConUbicacion({
        iglesiaId,
        tipo: "BAUTIZO",
        libro: datos.libro.trim(),
        fecha: new Date(datos.fecha),
        lugar: limpiar(datos.lugar),
        ministro: ministroTexto,
        ministroId,
        observaciones: limpiar(datos.observaciones),
        creadoPorId: sesion.id,
        metodoPago,
        detalle: {
          bautizo: {
            create: {
              nombreCompleto: datos.nombreCompleto,
              sexo: limpiarSexo(datos.sexo),
              fechaNacimiento: datos.fechaNacimiento ? new Date(datos.fechaNacimiento) : null,
              lugarNacimiento: limpiar(datos.lugarNacimiento),
              domicilio: limpiar(datos.domicilio),
              nombrePadre: limpiar(datos.nombrePadre),
              nombreMadre: limpiar(datos.nombreMadre),
              padrino: limpiar(datos.padrino),
              madrina: limpiar(datos.madrina),
            },
          },
        },
      });
      actaId = acta.id;
    } else if (tipoParam === "PRIMERA_COMUNION") {
      const datos = primeraComunionSchema.parse({
        ...base,
        nombreCompleto: formData.get("nombreCompleto"),
        fechaNacimiento: formData.get("fechaNacimiento"),
        nombrePadre: formData.get("nombrePadre"),
        nombreMadre: formData.get("nombreMadre"),
        padrino: formData.get("padrino"),
        madrina: formData.get("madrina"),
        catequista: formData.get("catequista"),
      });
      const acta = await crearActaConUbicacion({
        iglesiaId,
        tipo: "PRIMERA_COMUNION",
        libro: datos.libro.trim(),
        fecha: new Date(datos.fecha),
        lugar: limpiar(datos.lugar),
        ministro: ministroTexto,
        ministroId,
        observaciones: limpiar(datos.observaciones),
        creadoPorId: sesion.id,
        metodoPago,
        detalle: {
          primeraComunion: {
            create: {
              nombreCompleto: datos.nombreCompleto,
              fechaNacimiento: datos.fechaNacimiento ? new Date(datos.fechaNacimiento) : null,
              nombrePadre: limpiar(datos.nombrePadre),
              nombreMadre: limpiar(datos.nombreMadre),
              padrino: limpiar(datos.padrino),
              madrina: limpiar(datos.madrina),
              catequista: limpiar(datos.catequista),
            },
          },
        },
      });
      actaId = acta.id;
    } else if (tipoParam === "CONFIRMACION") {
      const datos = confirmacionSchema.parse({
        ...base,
        nombreCompleto: formData.get("nombreCompleto"),
        sexo: formData.get("sexo"),
        fechaNacimiento: formData.get("fechaNacimiento"),
        lugarNacimiento: formData.get("lugarNacimiento"),
        nombrePadre: formData.get("nombrePadre"),
        nombreMadre: formData.get("nombreMadre"),
        padrino: formData.get("padrino"),
        madrina: formData.get("madrina"),
        obispoMinistro: formData.get("obispoMinistro"),
        parroquiaBautismo: formData.get("parroquiaBautismo"),
        fechaBautismo: formData.get("fechaBautismo"),
        libroBautismo: formData.get("libroBautismo"),
        fojaBautismo: formData.get("fojaBautismo"),
        actaBautismo: formData.get("actaBautismo"),
      });
      const acta = await crearActaConUbicacion({
        iglesiaId,
        tipo: "CONFIRMACION",
        libro: datos.libro.trim(),
        fecha: new Date(datos.fecha),
        lugar: limpiar(datos.lugar),
        ministro: ministroTexto,
        ministroId,
        observaciones: limpiar(datos.observaciones),
        creadoPorId: sesion.id,
        metodoPago,
        detalle: {
          confirmacion: {
            create: {
              nombreCompleto: datos.nombreCompleto,
              sexo: limpiarSexo(datos.sexo),
              fechaNacimiento: datos.fechaNacimiento ? new Date(datos.fechaNacimiento) : null,
              lugarNacimiento: limpiar(datos.lugarNacimiento),
              nombrePadre: limpiar(datos.nombrePadre),
              nombreMadre: limpiar(datos.nombreMadre),
              padrino: limpiar(datos.padrino),
              madrina: limpiar(datos.madrina),
              obispoMinistro: limpiar(datos.obispoMinistro),
              parroquiaBautismo: limpiar(datos.parroquiaBautismo),
              fechaBautismo: datos.fechaBautismo ? new Date(datos.fechaBautismo) : null,
              libroBautismo: limpiar(datos.libroBautismo),
              fojaBautismo: limpiarEntero(datos.fojaBautismo),
              actaBautismo: limpiarEntero(datos.actaBautismo),
            },
          },
        },
      });
      actaId = acta.id;
    } else {
      const datos = matrimonioSchema.parse({
        ...base,
        nombreEsposo: formData.get("nombreEsposo"),
        fechaNacimientoEsposo: formData.get("fechaNacimientoEsposo"),
        estadoCivilEsposo: formData.get("estadoCivilEsposo"),
        edadEsposo: formData.get("edadEsposo"),
        origenEsposo: formData.get("origenEsposo"),
        domicilioEsposo: formData.get("domicilioEsposo"),
        padreEsposo: formData.get("padreEsposo"),
        madreEsposo: formData.get("madreEsposo"),
        nombreEsposa: formData.get("nombreEsposa"),
        fechaNacimientoEsposa: formData.get("fechaNacimientoEsposa"),
        estadoCivilEsposa: formData.get("estadoCivilEsposa"),
        edadEsposa: formData.get("edadEsposa"),
        origenEsposa: formData.get("origenEsposa"),
        domicilioEsposa: formData.get("domicilioEsposa"),
        padreEsposa: formData.get("padreEsposa"),
        madreEsposa: formData.get("madreEsposa"),
        testigo1: formData.get("testigo1"),
        testigo2: formData.get("testigo2"),
        actaCivilNumero: formData.get("actaCivilNumero"),
        lugarTramite: formData.get("lugarTramite"),
      });
      const acta = await crearActaConUbicacion({
        iglesiaId,
        tipo: "MATRIMONIO",
        libro: datos.libro.trim(),
        fecha: new Date(datos.fecha),
        lugar: limpiar(datos.lugar),
        ministro: ministroTexto,
        ministroId,
        observaciones: limpiar(datos.observaciones),
        creadoPorId: sesion.id,
        metodoPago,
        detalle: {
          matrimonio: {
            create: {
              nombreEsposo: datos.nombreEsposo,
              fechaNacimientoEsposo: datos.fechaNacimientoEsposo
                ? new Date(datos.fechaNacimientoEsposo)
                : null,
              estadoCivilEsposo: limpiar(datos.estadoCivilEsposo),
              edadEsposo: limpiarEntero(datos.edadEsposo),
              origenEsposo: limpiar(datos.origenEsposo),
              domicilioEsposo: limpiar(datos.domicilioEsposo),
              padreEsposo: limpiar(datos.padreEsposo),
              madreEsposo: limpiar(datos.madreEsposo),
              nombreEsposa: datos.nombreEsposa,
              fechaNacimientoEsposa: datos.fechaNacimientoEsposa
                ? new Date(datos.fechaNacimientoEsposa)
                : null,
              estadoCivilEsposa: limpiar(datos.estadoCivilEsposa),
              edadEsposa: limpiarEntero(datos.edadEsposa),
              origenEsposa: limpiar(datos.origenEsposa),
              domicilioEsposa: limpiar(datos.domicilioEsposa),
              padreEsposa: limpiar(datos.padreEsposa),
              madreEsposa: limpiar(datos.madreEsposa),
              testigo1: limpiar(datos.testigo1),
              testigo2: limpiar(datos.testigo2),
              actaCivilNumero: limpiar(datos.actaCivilNumero),
              lugarTramite: limpiar(datos.lugarTramite),
            },
          },
        },
      });
      actaId = acta.id;
    }
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "No se pudo registrar el acta.",
    };
  }

  revalidatePath("/actas");
  return { ok: true, actaId };
}

/** Actualiza las notas marginales de un bautizo o confirmación (anotación
 * posterior de que esa misma persona se confirmó o contrajo matrimonio, con
 * fecha y libro/acta de referencia si aplica). */
export async function actualizarNotasMarginalesAction(
  _prevState: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const sesion = await requireSesion();
  if (!puedeEscribir(sesion)) return { error: "No tienes permiso para editar actas." };

  const actaId = formData.get("actaId");
  const notas = formData.get("notasMarginales");
  if (typeof actaId !== "string") return { error: "Acta inválida." };

  const acta = await prisma.acta.findUnique({
    where: { id: actaId },
    include: { bautizo: true, confirmacion: true },
  });
  if (!acta || (!acta.bautizo && !acta.confirmacion)) {
    return { error: "Esta acta no admite notas marginales." };
  }
  if (!sesion.esSuperAdmin && acta.iglesiaId !== sesion.iglesiaId) {
    return { error: "No tienes acceso a esta acta." };
  }

  const notasLimpias = limpiar(typeof notas === "string" ? notas : null);

  try {
    if (acta.bautizo) {
      await prisma.bautizo.update({ where: { actaId }, data: { notasMarginales: notasLimpias } });
    } else {
      await prisma.confirmacion.update({ where: { actaId }, data: { notasMarginales: notasLimpias } });
    }
  } catch (e) {
    if (esErrorDeUsuarioInvalido(e)) return { error: MENSAJE_SESION_INVALIDA };
    throw e;
  }

  revalidatePath(`/actas/${actaId}`);
  return null;
}

export async function anularActa(actaId: string, motivo: string) {
  const sesion = await requireSesion();
  if (!puedeEscribir(sesion)) throw new Error("No tienes permiso para anular actas.");

  const acta = await prisma.acta.findUnique({ where: { id: actaId } });
  if (!acta) throw new Error("Acta no encontrada.");
  if (!sesion.esSuperAdmin && acta.iglesiaId !== sesion.iglesiaId) {
    throw new Error("No tienes acceso a esta acta.");
  }

  await prisma.acta.update({
    where: { id: actaId },
    data: { anulada: true, motivoAnulacion: motivo || "Sin especificar" },
  });

  revalidatePath(`/actas/${actaId}`);
  revalidatePath("/actas");
}

export async function anularActaAction(
  _prevState: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const actaId = formData.get("actaId");
  const motivo = formData.get("motivo");
  if (typeof actaId !== "string") return { error: "Acta inválida." };
  try {
    await anularActa(actaId, typeof motivo === "string" ? motivo : "");
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo anular el acta." };
  }
  return null;
}

/** Registra el cobro de una reimpresión antes de generar el PDF (si el tipo de acta tiene precio configurado). */
export async function registrarPagoReimpresion(
  _prevState: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const sesion = await requireSesion();
  const actaId = formData.get("actaId");
  const metodoTexto = formData.get("metodoPago");
  if (typeof actaId !== "string") return { error: "Acta inválida." };

  const acta = await prisma.acta.findUnique({ where: { id: actaId } });
  if (!acta) return { error: "Acta no encontrada." };
  if (!sesion.esSuperAdmin && acta.iglesiaId !== sesion.iglesiaId) {
    return { error: "No tienes acceso a esta acta." };
  }

  const config = await obtenerConfiguracion(acta.iglesiaId, acta.tipo);
  if (config.precioReimpresion === null) {
    return {
      error:
        "Este tipo de acta no tiene un precio de reimpresión configurado. Ve a Configuración para definirlo antes de continuar.",
    };
  }
  const requierePago = config.precioReimpresion > 0;
  if (!requierePago) return null;

  if (
    typeof metodoTexto !== "string" ||
    !["EFECTIVO", "TARJETA", "TRANSFERENCIA"].includes(metodoTexto)
  ) {
    return { error: "Debes confirmar el método de pago." };
  }

  try {
    await prisma.pago.create({
      data: {
        actaId: acta.id,
        concepto: "REIMPRESION",
        monto: config.precioReimpresion!,
        metodo: metodoTexto as MetodoPago,
        cobradoPorId: sesion.id,
      },
    });
  } catch (e) {
    if (esErrorDeUsuarioInvalido(e)) return { error: MENSAJE_SESION_INVALIDA };
    throw e;
  }

  return null;
}
