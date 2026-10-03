"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Pantalla de último recurso: un fallo que ni siquiera deja pintar el layout.
 * Lo reporta y le dice a la secretaria qué hacer, en vez de dejar un blanco.
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          background: "#f1f5f9",
          margin: 0,
        }}
      >
        <div style={{ maxWidth: 420, padding: 32, textAlign: "center" }}>
          <h1 style={{ fontSize: 18, color: "#0f172a" }}>Algo falló en el sistema</h1>
          <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6 }}>
            El error quedó registrado y lo revisaremos. Vuelve a intentarlo; si sigue pasando,
            avisa a quien te da soporte.
          </p>
          {error.digest && (
            <p style={{ fontSize: 12, color: "#94a3b8" }}>Referencia: {error.digest}</p>
          )}
          <a
            href="/dashboard"
            style={{
              display: "inline-block",
              marginTop: 16,
              padding: "8px 16px",
              borderRadius: 6,
              background: "#0f172a",
              color: "#fff",
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            Volver al inicio
          </a>
        </div>
      </body>
    </html>
  );
}
