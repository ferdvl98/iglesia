import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  images: {
    // La aplicación no usa next/image en ningún lado, así que el optimizador
    // solo aportaba superficie: su endpoint es público y arrastra las
    // vulnerabilidades de sharp/libvips al procesar imágenes de terceros.
    unoptimized: true,
  },
};

/**
 * Sin SENTRY_ORG / SENTRY_PROJECT no se envuelve nada: el build tiene que
 * funcionar igual en una instalación sin monitoreo y en el desarrollo local.
 *
 * Las credenciales (SENTRY_ORG, SENTRY_PROJECT, SENTRY_AUTH_TOKEN) las lee el
 * propio complemento del entorno; no se escriben aquí.
 */
const monitoreoConfigurado = Boolean(process.env.SENTRY_ORG && process.env.SENTRY_PROJECT);

export default monitoreoConfigurado
  ? withSentryConfig(nextConfig, {
      // Los mapas de código se suben a Sentry y se borran del paquete público:
      // sirven para leer las trazas, no para que cualquiera lea el código.
      sourcemaps: { deleteSourcemapsAfterUpload: true },
      // Las extensiones que bloquean rastreadores tumban las peticiones a
      // sentry.io; esta ruta las hace pasar por el propio dominio.
      tunnelRoute: "/monitoring",
    })
  : nextConfig;
