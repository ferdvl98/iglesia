"use client";

import { useState, useTransition } from "react";
import { registrarPagoReimpresion } from "../actions";
import { CobroModal } from "@/components/cobro-modal";

export function ReimprimirButton({
  actaId,
  precioReimpresion,
}: {
  actaId: string;
  precioReimpresion?: number | null;
}) {
  const sinPrecioConfigurado = precioReimpresion === null || precioReimpresion === undefined;
  const requierePago = !sinPrecioConfigurado && precioReimpresion > 0;
  const [mostrarCobro, setMostrarCobro] = useState(false);
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function abrirPdf() {
    window.open(`/api/actas/${actaId}/pdf`, "_blank");
  }

  function confirmar() {
    // Se abre la pestaña de inmediato (dentro del gesto del usuario) para que
    // el navegador no la bloquee; su contenido se define tras confirmar el pago.
    // Nota: pasar "noopener"/"noreferrer" aquí haría que window.open devuelva
    // null, y perderíamos la referencia para escribir la URL del PDF después.
    const ventana = window.open("", "_blank");
    const formData = new FormData();
    formData.set("actaId", actaId);
    formData.set("metodoPago", metodoPago);
    startTransition(async () => {
      const resultado = await registrarPagoReimpresion(null, formData);
      if (resultado && "error" in resultado) {
        ventana?.close();
        setError(resultado.error);
        return;
      }
      setError(null);
      setMostrarCobro(false);
      if (ventana) {
        ventana.location.href = `/api/actas/${actaId}/pdf`;
      } else {
        abrirPdf();
      }
    });
  }

  if (sinPrecioConfigurado) {
    return (
      <>
        <button
          type="button"
          disabled
          title="Configura el precio de reimpresión para poder reimprimir esta acta."
          className="cursor-not-allowed rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-400"
        >
          Reimprimir PDF
        </button>
        <p className="mt-1 text-xs text-red-600">
          Falta configurar el precio de reimpresión para este tipo de acta.
        </p>
      </>
    );
  }

  if (!requierePago) {
    return (
      <button
        type="button"
        onClick={abrirPdf}
        className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Reimprimir PDF
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setMostrarCobro(true)}
        className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Reimprimir PDF
      </button>

      {mostrarCobro && (
        <CobroModal
          titulo="Confirma el cobro de reimpresión"
          precio={precioReimpresion ?? 0}
          metodoPago={metodoPago}
          onMetodoPagoChange={setMetodoPago}
          onCancelar={() => setMostrarCobro(false)}
          error={error}
          botonConfirmar={
            <button
              type="button"
              onClick={confirmar}
              disabled={pending}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {pending ? "Confirmando..." : "Confirmar cobro y reimprimir"}
            </button>
          }
        />
      )}
    </>
  );
}
