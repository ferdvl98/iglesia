import type { Permiso } from "@prisma/client";

/**
 * Nombre de cada permiso para una persona.
 *
 * Vive en un módulo normal y no dentro del formulario, que es "use client":
 * un componente de servidor que importa un valor de un módulo cliente recibe
 * una referencia, no el objeto, y las búsquedas salían vacías —el listado de
 * roles mostraba ", ," en vez de los permisos.
 */
export const PERMISOS_LABEL: Record<Permiso, string> = {
  REGISTRAR_ACTAS: "Registrar, reimprimir y anular actas",
  CONSULTAR_ACTAS: "Consultar el listado y detalle de actas",
  PUNTO_DE_VENTA: "Vender en el punto de venta",
  ADMINISTRAR_CATALOGO: "Administrar catálogo, ajustes y transferencias de inventario",
  CONFIGURAR: "Configurar precios de actas",
  VER_INGRESOS: "Ver los reportes de ingresos y descargarlos",
  ADMINISTRAR_MINISTROS: "Administrar el catálogo de sacerdotes/ministros",
};

/** Permisos que solo tienen sentido con el módulo de punto de venta contratado. */
export const PERMISOS_PUNTO_DE_VENTA: Permiso[] = ["PUNTO_DE_VENTA", "ADMINISTRAR_CATALOGO"];
