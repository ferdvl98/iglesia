import { Image, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  bloque: {
    position: "absolute",
    bottom: 28,
    right: 40,
    alignItems: "center",
    width: 84,
  },
  etiqueta: { fontSize: 6.5, color: "#64748b", marginBottom: 2 },
  folio: { fontSize: 7.5, color: "#334155", marginTop: 3, letterSpacing: 0.4 },
});

/**
 * Sello de verificación: el QR y el folio impresos en el acta.
 *
 * Confirma lo que ya dice el papel —no revela nada más—, y sobre todo permite
 * detectar los dos casos que hoy son invisibles en una copia impresa: que la
 * partida se haya anulado o corregido después de imprimirse.
 *
 * El código viene ya dibujado desde la ruta: @react-pdf no puede generarlo,
 * porque sus componentes son síncronos.
 */
export function QrVerificacion({ qr, folio }: { qr: string | null; folio: string | null }) {
  if (!qr || !folio) return null;
  return (
    <View style={styles.bloque}>
      <Text style={styles.etiqueta}>Verifica este documento</Text>
      {/* Image de @react-pdf/renderer, no un <img> de HTML: no admite alt. */}
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image src={qr} style={{ width: 62, height: 62 }} />
      <Text style={styles.folio}>{folio}</Text>
    </View>
  );
}
