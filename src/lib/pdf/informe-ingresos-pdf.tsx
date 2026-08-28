import { Fragment } from "react";
import { Document, Page, Text, View, StyleSheet, Svg, Rect, Line } from "@react-pdf/renderer";
import { TIPO_ACTA_LABEL, TIPOS_ACTA } from "@/lib/tipos-acta";
import { COLOR_TIPO_ACTA, type IngresoMes, type VentaMes, type ProductoVendido } from "@/lib/ingresos";
import type { TipoActa } from "@/lib/tipos-acta";

const GRIDLINE = "#e1e0d9";
const BASELINE = "#c3c2b7";

function formatoMoneda(valor: number) {
  return valor.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1e293b",
  },
  titulo: {
    fontSize: 16,
    fontWeight: 700,
  },
  subtitulo: {
    fontSize: 10,
    color: "#475569",
    marginTop: 2,
    marginBottom: 16,
  },
  seccionTitulo: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 8,
    marginTop: 20,
  },
  tabla: {
    borderTop: "1px solid #cbd5e1",
    borderLeft: "1px solid #cbd5e1",
  },
  filaEncabezado: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
  },
  fila: {
    flexDirection: "row",
  },
  filaTotal: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
  },
  celda: {
    flex: 1,
    padding: 5,
    borderRight: "1px solid #cbd5e1",
    borderBottom: "1px solid #cbd5e1",
    fontSize: 9,
  },
  celdaMes: {
    flex: 1.3,
    padding: 5,
    borderRight: "1px solid #cbd5e1",
    borderBottom: "1px solid #cbd5e1",
    fontSize: 9,
  },
  celdaDerecha: {
    flex: 1,
    padding: 5,
    borderRight: "1px solid #cbd5e1",
    borderBottom: "1px solid #cbd5e1",
    fontSize: 9,
    textAlign: "right",
  },
  encabezadoTexto: {
    fontWeight: 700,
    fontSize: 9,
  },
  leyenda: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    gap: 12,
  },
  leyendaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  leyendaSwatch: {
    width: 8,
    height: 8,
  },
  leyendaTexto: {
    fontSize: 8,
    color: "#475569",
  },
  seccionTituloMuted: {
    fontSize: 9,
    fontWeight: 700,
    color: "#94a3b8",
    marginBottom: 6,
    marginTop: 20,
  },
  celdaMuted: {
    flex: 1,
    padding: 4,
    borderRight: "1px solid #e2e8f0",
    borderBottom: "1px solid #e2e8f0",
    fontSize: 8,
    color: "#94a3b8",
  },
  celdaMutedDerecha: {
    flex: 1,
    padding: 4,
    borderRight: "1px solid #e2e8f0",
    borderBottom: "1px solid #e2e8f0",
    fontSize: 8,
    color: "#94a3b8",
    textAlign: "right",
  },
  tablaMuted: {
    borderTop: "1px solid #e2e8f0",
    borderLeft: "1px solid #e2e8f0",
    maxWidth: 220,
  },
  piePagina: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#94a3b8",
    textAlign: "center",
  },
});

const ALTO_CHART = 160;
const ANCHO_BARRA = 40;
const GAP_ENTRE_BARRAS = 24;
const GAP_SEGMENTO = 2;

function GraficaIngresos({ meses }: { meses: IngresoMes[] }) {
  const maxTotal = Math.max(1, ...meses.map((m) => m.total));
  const altoUtil = ALTO_CHART - 24;
  const anchoSvg = meses.length * (ANCHO_BARRA + GAP_ENTRE_BARRAS) + GAP_ENTRE_BARRAS;
  const escalaY = (valor: number) => (valor / maxTotal) * altoUtil;

  return (
    <Svg width={anchoSvg} height={ALTO_CHART + 20} viewBox={`0 0 ${anchoSvg} ${ALTO_CHART + 20}`}>
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <Line
          key={f}
          x1={0}
          x2={anchoSvg}
          y1={ALTO_CHART - altoUtil * f}
          y2={ALTO_CHART - altoUtil * f}
          stroke={GRIDLINE}
          strokeWidth={1}
        />
      ))}
      <Line x1={0} x2={anchoSvg} y1={ALTO_CHART} y2={ALTO_CHART} stroke={BASELINE} strokeWidth={1} />

      {meses.map((mes, i) => {
        const x = GAP_ENTRE_BARRAS + i * (ANCHO_BARRA + GAP_ENTRE_BARRAS);
        let yAcumulada = ALTO_CHART;
        return (
          <Fragment key={mes.clave}>
            {TIPOS_ACTA.map((tipo, idxTipo) => {
              const valor = mes.porTipo[tipo];
              if (valor <= 0) return null;
              const alto = Math.max(0, escalaY(valor) - (idxTipo > 0 ? GAP_SEGMENTO : 0));
              yAcumulada -= alto + (idxTipo > 0 ? GAP_SEGMENTO : 0);
              return (
                <Rect key={tipo} x={x} y={yAcumulada} width={ANCHO_BARRA} height={alto} fill={COLOR_TIPO_ACTA[tipo]} />
              );
            })}
          </Fragment>
        );
      })}
    </Svg>
  );
}

export function InformeIngresosPdf({
  meses,
  reimpresionesPorTipo,
  ventasPorMes,
  productosMasVendidos,
  etiquetaPeriodo,
  nombreIglesia,
}: {
  meses: IngresoMes[];
  reimpresionesPorTipo: Record<TipoActa, number>;
  ventasPorMes: VentaMes[];
  productosMasVendidos: ProductoVendido[];
  etiquetaPeriodo: string;
  nombreIglesia?: string;
}) {
  const totalGeneral = meses.reduce((acc, m) => acc + m.total, 0);
  const totalReimpresiones = TIPOS_ACTA.reduce((acc, t) => acc + reimpresionesPorTipo[t], 0);
  const totalVentas = ventasPorMes.reduce((acc, m) => acc + m.total, 0);

  return (
    <Document title={`Informe de ingresos — ${etiquetaPeriodo}`}>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.titulo}>Informe de ingresos</Text>
        <Text style={styles.subtitulo}>
          {nombreIglesia ? `${nombreIglesia} · ` : ""}
          {etiquetaPeriodo}
        </Text>

        <GraficaIngresos meses={meses} />
        <View style={styles.leyenda}>
          {TIPOS_ACTA.map((tipo) => (
            <View key={tipo} style={styles.leyendaItem}>
              <View style={[styles.leyendaSwatch, { backgroundColor: COLOR_TIPO_ACTA[tipo] }]} />
              <Text style={styles.leyendaTexto}>{TIPO_ACTA_LABEL[tipo]}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.seccionTitulo}>Ingresos por mes (registro + reimpresión)</Text>
        <View style={styles.tabla}>
          <View style={styles.filaEncabezado}>
            <Text style={[styles.celdaMes, styles.encabezadoTexto]}>Mes</Text>
            {TIPOS_ACTA.map((tipo) => (
              <Text key={tipo} style={[styles.celdaDerecha, styles.encabezadoTexto]}>
                {TIPO_ACTA_LABEL[tipo]}
              </Text>
            ))}
            <Text style={[styles.celdaDerecha, styles.encabezadoTexto]}>Total</Text>
          </View>
          {meses.map((mes) => (
            <View key={mes.clave} style={styles.fila}>
              <Text style={styles.celdaMes}>{mes.etiqueta}</Text>
              {TIPOS_ACTA.map((tipo) => (
                <Text key={tipo} style={styles.celdaDerecha}>
                  {formatoMoneda(mes.porTipo[tipo])}
                </Text>
              ))}
              <Text style={[styles.celdaDerecha, { fontWeight: 700 }]}>{formatoMoneda(mes.total)}</Text>
            </View>
          ))}
          <View style={styles.filaTotal}>
            <Text style={[styles.celdaMes, { fontWeight: 700 }]}>Total del período</Text>
            {TIPOS_ACTA.map((tipo) => (
              <Text key={tipo} style={[styles.celdaDerecha, { fontWeight: 700 }]}>
                {formatoMoneda(meses.reduce((acc, m) => acc + m.porTipo[tipo], 0))}
              </Text>
            ))}
            <Text style={[styles.celdaDerecha, { fontWeight: 700 }]}>{formatoMoneda(totalGeneral)}</Text>
          </View>
        </View>

        <Text style={styles.seccionTitulo}>Reimpresiones por tipo</Text>
        <View style={styles.tabla}>
          <View style={styles.filaEncabezado}>
            <Text style={[styles.celda, styles.encabezadoTexto]}>Tipo</Text>
            <Text style={[styles.celdaDerecha, styles.encabezadoTexto]}>Cantidad</Text>
          </View>
          {TIPOS_ACTA.map((tipo) => (
            <View key={tipo} style={styles.fila}>
              <Text style={styles.celda}>{TIPO_ACTA_LABEL[tipo]}</Text>
              <Text style={styles.celdaDerecha}>{reimpresionesPorTipo[tipo]}</Text>
            </View>
          ))}
          <View style={styles.filaTotal}>
            <Text style={[styles.celda, { fontWeight: 700 }]}>Total</Text>
            <Text style={[styles.celdaDerecha, { fontWeight: 700 }]}>{totalReimpresiones}</Text>
          </View>
        </View>

        {totalVentas > 0 && (
          <>
            <Text style={styles.seccionTituloMuted}>
              Punto de venta (aparte de actas) — total {formatoMoneda(totalVentas)}
            </Text>
            <View style={styles.tablaMuted}>
              <View style={styles.filaEncabezado}>
                <Text style={[styles.celdaMuted, { fontWeight: 700 }]}>Mes</Text>
                <Text style={[styles.celdaMutedDerecha, { fontWeight: 700 }]}>Total</Text>
              </View>
              {ventasPorMes.map((mes) => (
                <View key={mes.clave} style={styles.fila}>
                  <Text style={styles.celdaMuted}>{mes.etiqueta}</Text>
                  <Text style={styles.celdaMutedDerecha}>{formatoMoneda(mes.total)}</Text>
                </View>
              ))}
            </View>

            {productosMasVendidos.length > 0 && (
              <>
                <Text style={[styles.seccionTituloMuted, { marginTop: 12 }]}>Productos más vendidos</Text>
                <View style={styles.tablaMuted}>
                  <View style={styles.filaEncabezado}>
                    <Text style={[styles.celdaMuted, { fontWeight: 700 }]}>Producto</Text>
                    <Text style={[styles.celdaMutedDerecha, { fontWeight: 700 }]}>Uds.</Text>
                    <Text style={[styles.celdaMutedDerecha, { fontWeight: 700 }]}>Ingreso</Text>
                  </View>
                  {productosMasVendidos.map((p) => (
                    <View key={p.nombre} style={styles.fila}>
                      <Text style={styles.celdaMuted}>{p.nombre}</Text>
                      <Text style={styles.celdaMutedDerecha}>{p.cantidad}</Text>
                      <Text style={styles.celdaMutedDerecha}>{formatoMoneda(p.subtotal)}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        )}

        <Text style={styles.piePagina}>
          Documento generado el{" "}
          {new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}.
        </Text>
      </Page>
    </Document>
  );
}
