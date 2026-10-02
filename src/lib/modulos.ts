/**
 * Módulos que se contratan aparte del núcleo de actas.
 *
 * Como las licencias, viven en variables de entorno de Vercel y no en la
 * aplicación: el administrador del cliente no tiene acceso al panel de
 * despliegue, así que no puede activarse un módulo que no pagó.
 *
 * El valor por defecto es **desactivado**. Una instalación nueva nace sin el
 * módulo y se enciende al instalarlo, que es justo lo contrario de tener que
 * acordarse de apagarlo en cada cliente que no lo compró.
 */
function moduloActivo(variable: string): boolean {
  const valor = process.env[variable]?.trim().toLowerCase();
  return valor === "true" || valor === "1" || valor === "si" || valor === "sí";
}

/**
 * Punto de venta: venta de artículos y servicios, catálogo de productos,
 * ajustes y transferencias de inventario.
 */
export function moduloPuntoDeVentaActivo(): boolean {
  return moduloActivo("MODULO_PUNTO_DE_VENTA");
}
