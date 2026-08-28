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

export function ConfirmacionActaPdf({ acta }: { acta: ActaConfirmacion }) {
  const { dia, mes, anio } = partesFecha(acta.fecha);
  const c = acta.confirmacion;
  const nacimiento = partesFecha(c.fechaNacimiento);
  const bautismo = partesFecha(c.fechaBautismo);
  const hijoHija = c.sexo === "FEMENINO" ? "hija" : c.sexo === "MASCULINO" ? "hijo" : "hijo(a)";
  const bautizadoA = c.sexo === "FEMENINO" ? "bautizada" : c.sexo === "MASCULINO" ? "bautizado" : "bautizado(a)";

  return (
    <Document title={`Acta de Confirmación - ${acta.numeroActa}`}>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.encabezado}>
          <View style={styles.tituloBloque}>
            <Text style={styles.tituloActa}>Acta</Text>
            <Text style={styles.tituloActa}>de Confirmación</Text>
            <Text style={styles.numero}>No. {acta.numeroActa}</Text>
          </View>

          <View style={styles.cuerpo}>
            <Text style={styles.parrafo}>
              En la Parroquia de {v(acta.lugar || acta.iglesia.nombre)}, el día {v(dia)} de {v(mes)} de{" "}
              {v(anio)}, recibió el Sacramento de la Confirmación por manos del Excmo. Sr. Obispo{" "}
              {v(c.obispoMinistro)}, {v(c.nombreCompleto)}, quien nació en {v(c.lugarNacimiento)} el día{" "}
              {v(nacimiento.dia)} de {v(nacimiento.mes)} de {v(nacimiento.anio)}. Fue {bautizadoA} en la
              Parroquia de {v(c.parroquiaBautismo)} el día {v(bautismo.dia)} de {v(bautismo.mes)} de{" "}
              {v(bautismo.anio)}, como consta en el libro de Bautismos No. {v(c.libroBautismo)}, Foja{" "}
              {v(c.fojaBautismo)}, Acta {v(c.actaBautismo)}. {hijoHija.charAt(0).toUpperCase() + hijoHija.slice(1)}{" "}
              del Sr. {v(c.nombrePadre)} y de la Sra. {v(c.nombreMadre)}. Padrinos: {v(c.padrino)} y{" "}
              {v(c.madrina)}.
            </Text>
          </View>
        </View>

        <View style={styles.firmaUnica}>
          <Text style={styles.doyFeTexto}>Doy Fe</Text>
          <View style={styles.lineaFirma} />
          <Text style={styles.firmaCaption}>El Párroco</Text>
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
