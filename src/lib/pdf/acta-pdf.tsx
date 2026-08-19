import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Acta, Iglesia, Bautizo, PrimeraComunion, Confirmacion, Matrimonio } from "@prisma/client";
import { TIPO_ACTA_LABEL } from "@/lib/tipos-acta";
import { formatearFechaLarga } from "@/lib/fecha";

type ActaCompleta = Acta & {
  iglesia: Iglesia;
  bautizo: Bautizo | null;
  primeraComunion: PrimeraComunion | null;
  confirmacion: Confirmacion | null;
  matrimonio: Matrimonio | null;
};

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#1e293b",
  },
  encabezado: {
    textAlign: "center",
    marginBottom: 24,
  },
  iglesia: {
    fontSize: 14,
    fontWeight: 700,
  },
  diocesis: {
    fontSize: 10,
    color: "#475569",
    marginTop: 2,
  },
  titulo: {
    fontSize: 16,
    fontWeight: 700,
    marginTop: 16,
    textAlign: "center",
    textTransform: "uppercase",
  },
  subtitulo: {
    fontSize: 10,
    textAlign: "center",
    color: "#475569",
    marginTop: 2,
  },
  seccion: {
    marginTop: 20,
    borderTop: "1px solid #cbd5e1",
    paddingTop: 12,
  },
  seccionTitulo: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 8,
    textTransform: "uppercase",
    color: "#334155",
  },
  fila: {
    flexDirection: "row",
    marginBottom: 6,
  },
  campo: {
    width: "50%",
    paddingRight: 8,
  },
  etiqueta: {
    fontSize: 9,
    color: "#64748b",
    textTransform: "uppercase",
  },
  valor: {
    fontSize: 11,
    marginTop: 2,
  },
  firmas: {
    marginTop: 56,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  firma: {
    width: "45%",
    textAlign: "center",
    borderTop: "1px solid #1e293b",
    paddingTop: 4,
    fontSize: 10,
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
    left: 48,
    right: 48,
    fontSize: 8,
    color: "#94a3b8",
    textAlign: "center",
  },
});

const fmt = formatearFechaLarga;

function Campo({ etiqueta, valor }: { etiqueta: string; valor: string | null | undefined }) {
  return (
    <View style={styles.campo}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      <Text style={styles.valor}>{valor || "-"}</Text>
    </View>
  );
}

export function ActaPdfDocument({ acta }: { acta: ActaCompleta }) {
  return (
    <Document title={`Acta de ${TIPO_ACTA_LABEL[acta.tipo]} - ${acta.numeroActa}`}>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.encabezado}>
          <Text style={styles.iglesia}>{acta.iglesia.nombre}</Text>
          {acta.iglesia.diocesis && <Text style={styles.diocesis}>{acta.iglesia.diocesis}</Text>}
          <Text style={styles.titulo}>Acta de {TIPO_ACTA_LABEL[acta.tipo]}</Text>
          <Text style={styles.subtitulo}>
            Libro {acta.libro} · Foja {acta.foja} · Partida {acta.numeroActa} (posición {acta.posicionEnFoja} de 4)
          </Text>
        </View>

        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Datos generales</Text>
          <View style={styles.fila}>
            <Campo etiqueta="Fecha del sacramento" valor={fmt(acta.fecha)} />
            <Campo etiqueta="Lugar" valor={acta.lugar} />
          </View>
          <View style={styles.fila}>
            <Campo etiqueta="Ministro / celebrante" valor={acta.ministro} />
          </View>
        </View>

        {acta.bautizo && (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Datos del bautizado</Text>
            <View style={styles.fila}>
              <Campo etiqueta="Nombre completo" valor={acta.bautizo.nombreCompleto} />
              <Campo etiqueta="Fecha de nacimiento" valor={fmt(acta.bautizo.fechaNacimiento)} />
            </View>
            <View style={styles.fila}>
              <Campo etiqueta="Lugar de nacimiento" valor={acta.bautizo.lugarNacimiento} />
            </View>
            <View style={styles.fila}>
              <Campo etiqueta="Padre" valor={acta.bautizo.nombrePadre} />
              <Campo etiqueta="Madre" valor={acta.bautizo.nombreMadre} />
            </View>
            <View style={styles.fila}>
              <Campo etiqueta="Padrino" valor={acta.bautizo.padrino} />
              <Campo etiqueta="Madrina" valor={acta.bautizo.madrina} />
            </View>
          </View>
        )}

        {acta.primeraComunion && (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Datos del comulgante</Text>
            <View style={styles.fila}>
              <Campo etiqueta="Nombre completo" valor={acta.primeraComunion.nombreCompleto} />
              <Campo etiqueta="Fecha de nacimiento" valor={fmt(acta.primeraComunion.fechaNacimiento)} />
            </View>
            <View style={styles.fila}>
              <Campo etiqueta="Padre" valor={acta.primeraComunion.nombrePadre} />
              <Campo etiqueta="Madre" valor={acta.primeraComunion.nombreMadre} />
            </View>
            <View style={styles.fila}>
              <Campo etiqueta="Padrino" valor={acta.primeraComunion.padrino} />
              <Campo etiqueta="Madrina" valor={acta.primeraComunion.madrina} />
            </View>
            <View style={styles.fila}>
              <Campo etiqueta="Catequista" valor={acta.primeraComunion.catequista} />
            </View>
          </View>
        )}

        {acta.confirmacion && (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Datos del confirmando</Text>
            <View style={styles.fila}>
              <Campo etiqueta="Nombre completo" valor={acta.confirmacion.nombreCompleto} />
              <Campo etiqueta="Fecha de nacimiento" valor={fmt(acta.confirmacion.fechaNacimiento)} />
            </View>
            <View style={styles.fila}>
              <Campo etiqueta="Padre" valor={acta.confirmacion.nombrePadre} />
              <Campo etiqueta="Madre" valor={acta.confirmacion.nombreMadre} />
            </View>
            <View style={styles.fila}>
              <Campo etiqueta="Padrino" valor={acta.confirmacion.padrino} />
              <Campo etiqueta="Madrina" valor={acta.confirmacion.madrina} />
            </View>
            <View style={styles.fila}>
              <Campo etiqueta="Obispo / ministro" valor={acta.confirmacion.obispoMinistro} />
            </View>
          </View>
        )}

        {acta.matrimonio && (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Contrayentes</Text>
            <View style={styles.fila}>
              <Campo etiqueta="Esposo" valor={acta.matrimonio.nombreEsposo} />
              <Campo etiqueta="Fecha de nacimiento" valor={fmt(acta.matrimonio.fechaNacimientoEsposo)} />
            </View>
            <View style={styles.fila}>
              <Campo etiqueta="Padre del esposo" valor={acta.matrimonio.padreEsposo} />
              <Campo etiqueta="Madre del esposo" valor={acta.matrimonio.madreEsposo} />
            </View>
            <View style={styles.fila}>
              <Campo etiqueta="Esposa" valor={acta.matrimonio.nombreEsposa} />
              <Campo etiqueta="Fecha de nacimiento" valor={fmt(acta.matrimonio.fechaNacimientoEsposa)} />
            </View>
            <View style={styles.fila}>
              <Campo etiqueta="Padre de la esposa" valor={acta.matrimonio.padreEsposa} />
              <Campo etiqueta="Madre de la esposa" valor={acta.matrimonio.madreEsposa} />
            </View>
            <View style={styles.fila}>
              <Campo etiqueta="Testigo 1" valor={acta.matrimonio.testigo1} />
              <Campo etiqueta="Testigo 2" valor={acta.matrimonio.testigo2} />
            </View>
            {acta.matrimonio.actaCivilNumero && (
              <View style={styles.fila}>
                <Campo etiqueta="No. de acta civil" valor={acta.matrimonio.actaCivilNumero} />
              </View>
            )}
          </View>
        )}

        {acta.observaciones && (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Observaciones</Text>
            <Text style={styles.valor}>{acta.observaciones}</Text>
          </View>
        )}

        <View style={styles.firmas}>
          <Text style={styles.firma}>Ministro / celebrante</Text>
          <Text style={styles.firma}>Encargado del archivo parroquial</Text>
        </View>

        {acta.anulada && (
          <Text style={styles.aviso}>
            ACTA ANULADA — Motivo: {acta.motivoAnulacion || "Sin especificar"}
          </Text>
        )}

        <Text style={styles.piePagina}>
          Documento generado el {fmt(new Date())} — Reimpresión con fines de consulta.
        </Text>
      </Page>
    </Document>
  );
}
