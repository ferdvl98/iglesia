/**
 * Las fechas de las actas se guardan como fecha-sin-hora (medianoche UTC).
 * Se formatean forzando timeZone "UTC" para que no se recorran un día
 * en zonas horarias con offset negativo (México, etc.).
 */
export function formatearFecha(fecha: Date | string | null | undefined) {
  if (!fecha) return "-";
  return new Date(fecha).toLocaleDateString("es-MX", { timeZone: "UTC" });
}

export function formatearFechaLarga(fecha: Date | string | null | undefined) {
  if (!fecha) return "-";
  return new Date(fecha).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
