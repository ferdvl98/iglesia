import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Acta, Iglesia, Bautizo } from "@prisma/client";

type ActaBautizo = Acta & { iglesia: Iglesia; bautizo: Bautizo };

const styles = StyleSheet.create({
  page: {
    padding: 56,
    fontSize: 11,
    fontFamily: "Times-Roman",
    color: "#1c1c1c",
    lineHeight: 1.6,
  },
  actaNo: {
    fontSize: 11,
    fontStyle: "italic",
    marginBottom: 16,
  },
  parrafo: {
    marginBottom: 10,
    textAlign: "left",
  },
  aviso: {
    marginTop: 24,
    textAlign: "center",
    fontSize: 9,
    color: "#b91c1c",
  },
  firmaUnica: {
    marginTop: 48,
    alignSelf: "flex-end",
    width: 220,
    textAlign: "center",
  },
  doyFeTexto: {
    fontSize: 11,
    marginBottom: 36,
  },
  lineaFirma: {
    borderTop: "1px solid #1c1c1c",
    marginBottom: 4,
  },
  firmaCaption: {
    fontSize: 10,
  },
  piePagina: {
    position: "absolute",
    bottom: 24,
    left: 56,
    right: 56,
    fontSize: 8,
    color: "#94a3b8",
    textAlign: "center",
  },
});

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function partesFecha(fecha: Date | null) {
  if (!fecha) return { dia: null, mes: null, anio: null };
  const d = new Date(fecha);
  return { dia: d.getUTCDate(), mes: MESES[d.getUTCMonth()], anio: d.getUTCFullYear() % 100 };
}

function v(valor: string | number | null | undefined) {
  return valor === null || valor === undefined || valor === "" ? "_______" : String(valor);
}

export function BautizoActaPdf({ acta }: { acta: ActaBautizo }) {
  const { dia, mes, anio } = partesFecha(acta.fecha);
  const b = acta.bautizo;
  const nacimiento = partesFecha(b.fechaNacimiento);
  const niñoNiña = b.sexo === "FEMENINO" ? "niña" : b.sexo === "MASCULINO" ? "niño" : "niño(a)";
  const hijoHija = b.sexo === "FEMENINO" ? "hija" : b.sexo === "MASCULINO" ? "hijo" : "hijo(a)";

  return (
    <Document title={`Acta de Bautizo - ${acta.numeroActa}`}>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.actaNo}>Acta No. {acta.numeroActa}</Text>

        <Text style={styles.parrafo}>En la Parroquia de {v(acta.lugar || acta.iglesia.nombre)}</Text>

        <Text style={styles.parrafo}>
          el día {v(dia)} de {v(mes)} de 20{v(anio)}, yo, el {v(acta.ministro)},
        </Text>

        <Text style={styles.parrafo}>
          bauticé solemnemente a un {niñoNiña} que nació el día {v(nacimiento.dia)}
        </Text>

        <Text style={styles.parrafo}>
          de {v(nacimiento.mes)} de 20{v(nacimiento.anio)} en {v(b.lugarNacimiento)},
        </Text>

        <Text style={styles.parrafo}>y con domicilio en: {v(b.domicilio)},</Text>

        <Text style={styles.parrafo}>
          a quien puse por nombre {v(b.nombreCompleto)}, {hijoHija}
        </Text>

        <Text style={styles.parrafo}>del Sr. {v(b.nombrePadre)}</Text>
        <Text style={styles.parrafo}>y de la Sra. {v(b.nombreMadre)}</Text>

        <Text style={styles.parrafo}>fueron sus padrinos:</Text>
        <Text style={styles.parrafo}>el Sr. {v(b.padrino)}</Text>
        <Text style={styles.parrafo}>y la Sra. {v(b.madrina)}</Text>

        <Text style={styles.parrafo}>a quienes advertí sus obligaciones y parentesco espiritual.</Text>

        <View style={styles.firmaUnica}>
          <Text style={styles.doyFeTexto}>Doy Fe</Text>
          <View style={styles.lineaFirma} />
          <Text style={styles.firmaCaption}>El Párroco</Text>
        </View>

        {acta.observaciones && (
          <View style={{ marginTop: 24 }}>
            <Text style={{ fontSize: 9, color: "#64748b" }}>Observaciones: {acta.observaciones}</Text>
          </View>
        )}

        {acta.anulada && (
          <Text style={styles.aviso}>
            ACTA ANULADA — Motivo: {acta.motivoAnulacion || "Sin especificar"}
          </Text>
        )}

        <Text style={styles.piePagina}>
          Libro {acta.libro} · Foja {acta.foja} · Partida {acta.numeroActa} (posición {acta.posicionEnFoja} de 4) — Documento
          generado el {new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })}.
        </Text>
      </Page>
    </Document>
  );
}
