import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Acta, Iglesia, Matrimonio } from "@prisma/client";

type ActaMatrimonio = Acta & { iglesia: Iglesia; matrimonio: Matrimonio };

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
  tituloActaLinea2: {
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
  dato: {
    fontWeight: 700,
  },
  cursiva: {
    fontStyle: "italic",
  },
  aviso: {
    marginTop: 24,
    textAlign: "center",
    fontSize: 9,
    color: "#b91c1c",
  },
  firmas: {
    marginTop: 64,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  firma: {
    width: "40%",
    textAlign: "center",
    borderTop: "1px solid #1c1c1c",
    paddingTop: 4,
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

function partesFecha(fecha: Date) {
  const d = new Date(fecha);
  return {
    dia: d.getUTCDate(),
    mes: MESES[d.getUTCMonth()],
    anio: d.getUTCFullYear(),
  };
}

/** Imprime el valor o una línea en blanco, como en el acta física cuando no se llenó el dato. */
function v(valor: string | number | null | undefined) {
  return valor === null || valor === undefined || valor === "" ? "_______" : String(valor);
}

function Dato({ valor }: { valor: string | number | null | undefined }) {
  return <Text style={styles.dato}>{v(valor)}</Text>;
}

export function MatrimonioActaPdf({ acta }: { acta: ActaMatrimonio }) {
  const { dia, mes, anio } = partesFecha(acta.fecha);
  const m = acta.matrimonio;
  const lugarCivil = m.lugarTramite;

  return (
    <Document title={`Acta de Matrimonio - ${acta.numeroActa}`}>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.encabezado}>
          <View style={styles.tituloBloque}>
            <Text style={styles.tituloActa}>Acta</Text>
            <Text style={styles.tituloActaLinea2}>de Matrimonio</Text>
            <Text style={styles.numero}>No. {acta.numeroActa}</Text>
          </View>

          <View style={styles.cuerpo}>
            <Text style={styles.parrafo}>
              En <Dato valor={acta.iglesia.ciudad} />, el día <Dato valor={dia} /> del mes de{" "}
              <Dato valor={mes} /> del año de <Dato valor={anio} />, en la Iglesia{" "}
              <Dato valor={acta.lugar || acta.iglesia.nombre} />, el Sr. <Dato valor={acta.ministro} /> con
              la debida autorización asistió al matrimonio canónico válido y lícito{" "}
              <Text style={styles.cursiva}>In Facie Eclesiae</Text> y por palabras del presente del Sr.{" "}
              <Dato valor={m.nombreEsposo} /> y la Sra. <Dato valor={m.nombreEsposa} />,
            </Text>

            <Text style={styles.parrafo}>
              siendo él <Dato valor={m.estadoCivilEsposo} /> de <Dato valor={m.edadEsposo} /> años, hijo de{" "}
              <Dato valor={m.padreEsposo} /> y de <Dato valor={m.madreEsposo} />, originario de{" "}
              <Dato valor={m.origenEsposo} /> y con domicilio en <Dato valor={m.domicilioEsposo} />;
            </Text>

            <Text style={styles.parrafo}>
              y ella <Dato valor={m.estadoCivilEsposa} /> de <Dato valor={m.edadEsposa} /> años, hija de{" "}
              <Dato valor={m.padreEsposa} /> y de <Dato valor={m.madreEsposa} />, originaria de{" "}
              <Dato valor={m.origenEsposa} />, vecina de <Dato valor={m.domicilioEsposa} />.
            </Text>

            <Text style={styles.parrafo}>
              Fueron testigos <Dato valor={m.testigo1} />
              {m.testigo2 ? <> y <Dato valor={m.testigo2} /></> : ""}.
              {m.actaCivilNumero ? <> Acta civil No. <Dato valor={m.actaCivilNumero} />.</> : ""}
            </Text>

            {lugarCivil && (
              <Text style={styles.parrafo}>
                Se tramitó en <Dato valor={lugarCivil} />.
              </Text>
            )}
          </View>
        </View>

        <View style={styles.firmas}>
          <Text style={styles.firma}>Sacerdote Asistente</Text>
          <Text style={styles.firma}>Doy Fe, el Párroco</Text>
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
