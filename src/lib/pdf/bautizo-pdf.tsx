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
  encabezado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  tituloBloque: {
    width: 130,
  },
  tituloActa: {
    fontSize: 13,
    fontStyle: "italic",
  },
  numero: {
    fontSize: 11,
    fontStyle: "italic",
    marginTop: 8,
  },
  cuerpo: {
    flex: 1,
    paddingLeft: 12,
    textAlign: "left",
  },
  parrafo: {
    marginBottom: 10,
  },
  aviso: {
    marginTop: 24,
    textAlign: "center",
    fontSize: 9,
    color: "#b91c1c",
  },
  firmaUnica: {
    marginTop: 48,
    alignSelf: "center",
    width: 260,
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
  return { dia: d.getUTCDate(), mes: MESES[d.getUTCMonth()], anio: d.getUTCFullYear() };
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
        <View style={styles.encabezado}>
          <View style={styles.tituloBloque}>
            <Text style={styles.tituloActa}>Acta</Text>
            <Text style={styles.tituloActa}>de Bautizo</Text>
            <Text style={styles.numero}>No. {acta.numeroActa}</Text>
          </View>

          <View style={styles.cuerpo}>
            <Text style={styles.parrafo}>
              En la Parroquia de {v(acta.lugar || acta.iglesia.nombre)}, el día {v(dia)} de {v(mes)} de{" "}
              {v(anio)}, yo, el {v(acta.ministro)}, bauticé solemnemente a un {niñoNiña} que nació el día{" "}
              {v(nacimiento.dia)} de {v(nacimiento.mes)} de {v(nacimiento.anio)} en {v(b.lugarNacimiento)},
              con domicilio en {v(b.domicilio)}, a quien puse por nombre {v(b.nombreCompleto)}, {hijoHija}{" "}
              del Sr. {v(b.nombrePadre)} y de la Sra. {v(b.nombreMadre)}; fueron sus padrinos el Sr.{" "}
              {v(b.padrino)} y la Sra. {v(b.madrina)}, a quienes advertí sus obligaciones y parentesco
              espiritual.
            </Text>
          </View>
        </View>

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
