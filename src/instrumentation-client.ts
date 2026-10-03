import * as Sentry from "@sentry/nextjs";
import { configuracionBase, dsn } from "@/lib/sentry";

if (dsn) {
  Sentry.init({
    ...configuracionBase,
    // Las repeticiones de sesión grabarían la pantalla con datos de actas.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
