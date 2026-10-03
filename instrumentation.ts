import * as Sentry from "@sentry/nextjs";
import { configuracionBase, dsn } from "@/lib/sentry";

export async function register() {
  if (!dsn) return;
  Sentry.init(configuracionBase);
}

export const onRequestError = Sentry.captureRequestError;
