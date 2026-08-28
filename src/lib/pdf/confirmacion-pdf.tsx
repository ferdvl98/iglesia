import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Acta, Iglesia, Confirmacion } from "@prisma/client";

type ActaConfirmacion = Acta & { iglesia: Iglesia; confirmacion: Confirmacion };

const styles = StyleSheet.create({
  page: {
    padding: 56,
    fontSize: 11,
    fontFamily: "Times-Roman",
    color: "#1c1c1c",
    lineHeight: 1.6,
  },
  fila: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  columnaIzquierda: {
    width: 120,
  },
  actaNo: {
    fontSize: 11,
    fontStyle: "italic",
  },
  columnaDerecha: {
    flex: 1,
    paddingLeft: 12,
  },
  parrafo: {
    marginBottom: 10,
    textAlign: "left",
  },
  nombreConfirmado: {
    marginTop: 4,
    marginBottom: 2,
    fontSize: 12,
    textAlign: "center",
  },
  captionBloque: {
    alignSelf: "center",
    backgroundColor: "#e5e5e5",
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  caption: {
    fontSize: 8,
    fontStyle: "italic",
    color: "#3f3f3f",
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
  firmaUnica: {
    marginTop: 40,
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

export function ConfirmacionActaPdf({ acta }: { acta: ActaConfirmacion }) {
  const { dia, mes, anio } = partesFecha(acta.fecha);
  const c = acta.confirmacion;
  const nacimiento = partesFecha(c.fechaNacimiento);
  const bautismo = partesFecha(c.fechaBautismo);
  const hijoHija = c.sexo === "FEMENINO" ? "hija" : c.sexo === "MASCULINO" ? "hijo" : "hijo(a)";
  const bautizadoA = c.sexo === "FEMENINO" ? "Bautizada" : c.sexo === "MASCULINO" ? "Bautizado" : "Bautizado(a)";

  return (
    <Document title={`Acta de Confirmación - ${acta.numeroActa}`}>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.fila}>
          <View style={styles.columnaIzquierda}>
            <Text style={styles.actaNo}>Acta No. {acta.numeroActa}</Text>
          </View>

          <View style={styles.columnaDerecha}>
            <Text style={styles.parrafo}>
              En la Parroquia de {v(acta.lugar || acta.iglesia.nombre)}, el día {v(dia)} de {v(mes)} de 20
              {v(anio)}, recibió el Sacramento de la Confirmación por manos del Excmo. Sr. Obispo:{" "}
              {v(c.obispoMinistro)}.
            </Text>

            <Text style={styles.nombreConfirmado}>{v(c.nombreCompleto)}</Text>
            <View style={styles.captionBloque}>
              <Text style={styles.caption}>Nombre y apellidos del confirmado</Text>
            </View>

            <Text style={styles.parrafo}>
              Nació en {v(c.lugarNacimiento)} el día {v(nacimiento.dia)} de {v(nacimiento.mes)} de 20
              {v(nacimiento.anio)}. Fue {bautizadoA} en la Parroquia de: {v(c.parroquiaBautismo)}
            </Text>

            <Text style={styles.parrafo}>
              el día {v(bautismo.dia)} de {v(bautismo.mes)} de 20{v(bautismo.anio)}, como consta en el
              libro de Bautismos No. {v(c.libroBautismo)} Foja {v(c.fojaBautismo)} Acta {v(c.actaBautismo)}.{" "}
              {hijoHija.charAt(0).toUpperCase() + hijoHija.slice(1)} del Sr. {v(c.nombrePadre)}
            </Text>

            <Text style={styles.parrafo}>y de la Sra. {v(c.nombreMadre)}</Text>

            <Text style={styles.parrafo}>
              Padrinos: {v(c.padrino)} y {v(c.madrina)}
            </Text>

            <View style={styles.firmaUnica}>
              <Text style={styles.doyFeTexto}>Doy Fe</Text>
              <View style={styles.lineaFirma} />
              <Text style={styles.firmaCaption}>El Párroco</Text>
            </View>
          </View>
        </View>

        <View style={{ marginTop: 40, borderTop: "1px solid #cbd5e1", paddingTop: 12 }}>
          <Text style={styles.seccionTitulo}>Notas marginales</Text>
          <Text style={styles.parrafo}>{c.notasMarginales || "_______"}</Text>
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
