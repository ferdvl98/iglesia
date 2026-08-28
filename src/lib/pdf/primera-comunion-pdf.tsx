import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Acta, Iglesia, PrimeraComunion } from "@prisma/client";

type ActaPrimeraComunion = Acta & { iglesia: Iglesia; primeraComunion: PrimeraComunion };

const styles = StyleSheet.create({
  page: {
    padding: 56,
    fontSize: 11,
    fontFamily: "Times-Roman",
    color: "#1c1c1c",
    lineHeight: 1.6,
  },
  parroquia: {
    textAlign: "center",
    fontSize: 12,
    marginBottom: 16,
  },
  fila: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  columnaIzquierda: {
    width: 100,
  },
  actaNo: {
    fontSize: 11,
  },
  columnaNombreDestacado: {
    flex: 1,
    alignItems: "center",
  },
  nombreDestacado: {
    fontSize: 16,
    fontWeight: 700,
    textTransform: "uppercase",
    textAlign: "center",
  },
  filaDatos: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 16,
  },
  columnaNombre: {
    width: 100,
  },
  etiquetaNombre: {
    fontSize: 9,
    color: "#475569",
  },
  valorNombre: {
    fontSize: 11,
    fontWeight: 700,
  },
  columnaDerecha: {
    flex: 1,
    paddingLeft: 12,
    textAlign: "left",
  },
  centrado: {
    textAlign: "center",
    marginTop: 14,
  },
  dato: {
    fontWeight: 700,
  },
  firmaCentrada: {
    marginTop: 32,
    alignItems: "center",
  },
  doyFeTexto: {
    fontSize: 11,
    marginBottom: 4,
  },
  firmaCaption: {
    fontSize: 11,
  },
  seccionTitulo: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    color: "#475569",
    marginBottom: 6,
  },
  aviso: {
    marginTop: 24,
    textAlign: "center",
    fontSize: 9,
    color: "#b91c1c",
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

function mayus(valor: string | null | undefined) {
  return valor ? valor.toUpperCase() : valor;
}

function Dato({ valor }: { valor: string | number | null | undefined }) {
  return <Text style={styles.dato}>{v(valor)}</Text>;
}

export function PrimeraComunionActaPdf({ acta }: { acta: ActaPrimeraComunion }) {
  const { dia, mes, anio } = partesFecha(acta.fecha);
  const pc = acta.primeraComunion;
  const nombreCompleto = `${pc.nombre} ${pc.apellidos}`.trim().toUpperCase();
  const bautismo = partesFecha(pc.fechaBautismo);
  const bautizadoA = pc.sexo === "FEMENINO" ? "bautizada" : pc.sexo === "MASCULINO" ? "bautizado" : "bautizado(a)";

  return (
    <Document title={`Acta de Primera Comunión - ${acta.numeroActa}`}>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.parroquia}>En la parroquia de {acta.lugar || acta.iglesia.nombre}</Text>

        <View style={styles.fila}>
          <View style={styles.columnaIzquierda}>
            <Text style={styles.actaNo}>No. {acta.numeroActa}</Text>
          </View>
          <View style={styles.columnaNombreDestacado}>
            <Text style={styles.nombreDestacado}>{v(nombreCompleto)}.</Text>
          </View>
        </View>

        <View style={styles.filaDatos}>
          <View style={styles.columnaNombre}>
            <Text style={styles.etiquetaNombre}>NOMBRE:</Text>
            <Text style={styles.valorNombre}>{v(mayus(pc.nombre))}</Text>
          </View>

          <View style={styles.columnaDerecha}>
            <Text>
              Recibió el Sacramento de la Eucaristía, el <Dato valor={dia} /> de <Dato valor={mes} /> de 20
              <Dato valor={anio} />, habiendo sido {bautizadoA} en la parroquia de{" "}
              <Dato valor={pc.parroquiaBautismo} />, el <Dato valor={bautismo.dia} /> de{" "}
              <Dato valor={bautismo.mes} /> de 20<Dato valor={bautismo.anio} />.
            </Text>
          </View>
        </View>

        <Text style={styles.centrado}>
          Hijo de: <Dato valor={mayus(pc.nombrePadre)} /> y <Dato valor={mayus(pc.nombreMadre)} />.
        </Text>

        <Text style={styles.centrado}>
          Sus Padrinos: <Dato valor={mayus(pc.padrino)} /> y <Dato valor={mayus(pc.madrina)} />.
        </Text>

        <View style={styles.firmaCentrada}>
          <Text style={styles.doyFeTexto}>Doy fe:</Text>
          <Text style={styles.firmaCaption}>{acta.ministro ? `Pbro. ${acta.ministro}.` : "_______"}</Text>
          <Text style={styles.firmaCaption}>Párroco.</Text>
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
