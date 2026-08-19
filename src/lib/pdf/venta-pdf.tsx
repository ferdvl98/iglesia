import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Venta, VentaItem, Iglesia, Usuario } from "@prisma/client";
import { formatearFechaLarga } from "@/lib/fecha";

type VentaCompleta = Venta & {
  iglesia: Iglesia;
  vendidoPor: Usuario | null;
  items: VentaItem[];
};

const METODO_PAGO_LABEL: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TARJETA: "Tarjeta",
  TRANSFERENCIA: "Transferencia",
};

// Ancho tipo ticket (80mm) para impresión angosta.
const ANCHO_TICKET = 226.77;

const styles = StyleSheet.create({
  page: {
    padding: 16,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1e293b",
  },
  encabezado: {
    textAlign: "center",
    marginBottom: 10,
  },
  iglesia: {
    fontSize: 11,
    fontWeight: 700,
  },
  titulo: {
    fontSize: 10,
    fontWeight: 700,
    marginTop: 6,
    textTransform: "uppercase",
  },
  subtitulo: {
    fontSize: 8,
    color: "#475569",
    marginTop: 2,
  },
  linea: {
    borderTop: "1px dashed #94a3b8",
    marginVertical: 8,
  },
  fila: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  itemNombre: {
    fontSize: 9,
    fontWeight: 700,
  },
  itemDetalle: {
    fontSize: 8,
    color: "#475569",
  },
  itemComentario: {
    fontSize: 8,
    color: "#475569",
    fontStyle: "italic",
  },
  totalFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  totalTexto: {
    fontSize: 11,
    fontWeight: 700,
  },
  pie: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 7,
    color: "#94a3b8",
  },
});

function fmt(valor: number) {
  return `$${valor.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
}

export function VentaPdfDocument({ venta }: { venta: VentaCompleta }) {
  return (
    <Document title={`Ticket de venta - ${venta.id}`}>
      <Page size={[ANCHO_TICKET, 700]} style={styles.page}>
        <View style={styles.encabezado}>
          <Text style={styles.iglesia}>{venta.iglesia.nombre}</Text>
          <Text style={styles.titulo}>Ticket de venta</Text>
          <Text style={styles.subtitulo}>{formatearFechaLarga(venta.createdAt)}</Text>
          <Text style={styles.subtitulo}>Folio: {venta.id.slice(-8).toUpperCase()}</Text>
        </View>

        <View style={styles.linea} />

        {venta.items.map((item) => (
          <View key={item.id} style={{ marginBottom: 6 }}>
            <View style={styles.fila}>
              <Text style={styles.itemNombre}>{item.nombreProducto}</Text>
              <Text style={styles.itemNombre}>{fmt(item.subtotal)}</Text>
            </View>
            <Text style={styles.itemDetalle}>
              {item.cantidad} x {fmt(item.precioUnitario)}
            </Text>
            {item.comentario && <Text style={styles.itemComentario}>{item.comentario}</Text>}
          </View>
        ))}

        <View style={styles.linea} />

        <View style={styles.totalFila}>
          <Text style={styles.totalTexto}>Total</Text>
          <Text style={styles.totalTexto}>{fmt(venta.total)}</Text>
        </View>
        <View style={styles.fila}>
          <Text style={styles.itemDetalle}>Método de pago</Text>
          <Text style={styles.itemDetalle}>{METODO_PAGO_LABEL[venta.metodo] ?? venta.metodo}</Text>
        </View>
        {venta.vendidoPor && (
          <View style={styles.fila}>
            <Text style={styles.itemDetalle}>Atendió</Text>
            <Text style={styles.itemDetalle}>{venta.vendidoPor.nombre}</Text>
          </View>
        )}

        <Text style={styles.pie}>Gracias por su donativo.</Text>
      </Page>
    </Document>
  );
}
