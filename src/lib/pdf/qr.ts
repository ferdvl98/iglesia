import QRCode from "qrcode";

/** Ruta pública donde se verifica un acta por su folio. */
export function urlVerificacion(origen: string, folio: string): string {
  return `${origen.replace(/\/$/, "")}/v/${folio}`;
}

/**
 * Dibuja el QR como PNG en base64, que es lo que @react-pdf sabe incrustar.
 *
 * Corrección de errores media: el acta puede acabar fotocopiada o con un sello
 * encima, y aun así debe poder escanearse.
 */
export async function qrDeVerificacion(origen: string, folio: string | null): Promise<string | null> {
  if (!folio) return null;
  return QRCode.toDataURL(urlVerificacion(origen, folio), {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 240,
    color: { dark: "#0f172a", light: "#ffffff" },
  });
}
