/**
 * Configuración compartida del monitoreo de errores.
 *
 * Sin `SENTRY_DSN` no se inicializa nada: una instalación sin monitoreo debe
 * funcionar igual, y así el desarrollo local no manda ruido al panel.
 */
export const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

export const configuracionBase = {
  dsn,
  // Cada cliente corre su propia instancia: sin esto, los errores de todas
  // llegarían mezclados y no se sabría a qué parroquia avisar.
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  // Muestreo de trazas al 10%: suficiente para ver lentitud sin encarecer.
  tracesSampleRate: 0.1,
  /**
   * Un sistema de actas sacramentales maneja datos personales: nombres,
   * domicilios, filiación. No deben salir de la instalación del cliente.
   */
  sendDefaultPii: false,
};
