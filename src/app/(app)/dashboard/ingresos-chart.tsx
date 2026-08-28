import { TIPO_ACTA_LABEL, TIPOS_ACTA } from "@/lib/tipos-acta";
import { COLOR_TIPO_ACTA, type IngresoMes, type VentaMes, type ProductoVendido } from "@/lib/ingresos";

const INK_PRIMARY = "#0b0b0b";
const INK_MUTED = "#898781";
const GRIDLINE = "#e1e0d9";
const BASELINE = "#c3c2b7";

function formatoMoneda(valor: number) {
  return valor.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
}

const ALTURA_CHART = 220;
const ANCHO_BARRA = 44;
const GAP_SEGMENTO = 2;
const GAP_ENTRE_BARRAS = 28;

export function IngresosChart({ meses }: { meses: IngresoMes[] }) {
  const maxTotal = Math.max(1, ...meses.map((m) => m.total));
  const anchoSvg = meses.length * (ANCHO_BARRA + GAP_ENTRE_BARRAS) + GAP_ENTRE_BARRAS;
  const altoUtil = ALTURA_CHART - 28; // deja espacio para el total arriba de la barra

  const escalaY = (valor: number) => (valor / maxTotal) * altoUtil;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-4">
        <svg
          width={anchoSvg}
          height={ALTURA_CHART + 40}
          viewBox={`0 0 ${anchoSvg} ${ALTURA_CHART + 40}`}
          role="img"
          aria-label="Ingresos mensuales por tipo de acta"
        >
          {/* gridlines horizontales (recesivas) */}
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <line
              key={f}
              x1={0}
              x2={anchoSvg}
              y1={ALTURA_CHART - altoUtil * f}
              y2={ALTURA_CHART - altoUtil * f}
              stroke={GRIDLINE}
              strokeWidth={1}
            />
          ))}
          {/* baseline */}
          <line x1={0} x2={anchoSvg} y1={ALTURA_CHART} y2={ALTURA_CHART} stroke={BASELINE} strokeWidth={1} />

          {meses.map((mes, i) => {
            const x = GAP_ENTRE_BARRAS + i * (ANCHO_BARRA + GAP_ENTRE_BARRAS);
            let yAcumulada = ALTURA_CHART;
            const segmentos = TIPOS_ACTA.map((tipo, idxTipo) => {
              const valor = mes.porTipo[tipo];
              if (valor <= 0) return null;
              const alto = Math.max(0, escalaY(valor) - (idxTipo > 0 ? GAP_SEGMENTO : 0));
              yAcumulada -= alto + (idxTipo > 0 ? GAP_SEGMENTO : 0);
              const esUltimo = TIPOS_ACTA.slice(idxTipo + 1).every((t) => mes.porTipo[t] <= 0);
              return (
                <rect
                  key={tipo}
                  x={x}
                  y={yAcumulada}
                  width={ANCHO_BARRA}
                  height={alto}
                  fill={COLOR_TIPO_ACTA[tipo]}
                  rx={esUltimo ? 4 : 0}
                  ry={esUltimo ? 4 : 0}
                >
                  <title>{`${TIPO_ACTA_LABEL[tipo]} · ${mes.etiqueta}: ${formatoMoneda(valor)}`}</title>
                </rect>
              );
            });

            return (
              <g key={mes.clave}>
                {segmentos}
                <text
                  x={x + ANCHO_BARRA / 2}
                  y={ALTURA_CHART - escalaY(mes.total) - 8}
                  textAnchor="middle"
                  fontSize={9}
                  fill={INK_PRIMARY}
                  fontWeight={600}
                >
                  {mes.total > 0 ? formatoMoneda(mes.total) : ""}
                </text>
                <text
                  x={x + ANCHO_BARRA / 2}
                  y={ALTURA_CHART + 16}
                  textAnchor="middle"
                  fontSize={9}
                  fill={INK_MUTED}
                >
                  {mes.etiqueta}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {TIPOS_ACTA.map((tipo) => (
          <div key={tipo} className="flex items-center gap-2 text-xs text-slate-600">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: COLOR_TIPO_ACTA[tipo] }}
            />
            {TIPO_ACTA_LABEL[tipo]}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Ingreso del punto de venta: se muestra deliberadamente más discreto (gris,
 * sin color propio) para no competir con la gráfica de ingresos por acta —
 * es una fuente de ingreso distinta (venta de artículos, no sacramentos).
 */
export function VentasResumen({ meses, productos }: { meses: VentaMes[]; productos: ProductoVendido[] }) {
  const total = meses.reduce((acc, m) => acc + m.total, 0);
  if (total === 0) return null;
  const masVendido = productos[0];

  return (
    <details className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-500">
      <summary className="cursor-pointer text-xs font-medium">
        Punto de venta (aparte de actas): {formatoMoneda(total)} en el período
        {masVendido && ` · más vendido: ${masVendido.nombre} (${masVendido.cantidad} uds.)`}
      </summary>

      <div className="mt-3 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-medium uppercase text-slate-400">Ingresos por mes</p>
          <table className="w-full text-xs">
            <thead className="text-left uppercase text-slate-400">
              <tr>
                <th className="py-1 pr-4 font-normal">Mes</th>
                <th className="py-1 font-normal">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {meses.map((mes) => (
                <tr key={mes.clave}>
                  <td className="py-1 pr-4">{mes.etiqueta}</td>
                  <td className="py-1">{formatoMoneda(mes.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium uppercase text-slate-400">Productos más vendidos</p>
          <table className="w-full text-xs">
            <thead className="text-left uppercase text-slate-400">
              <tr>
                <th className="py-1 pr-4 font-normal">Producto</th>
                <th className="py-1 pr-4 font-normal">Unidades</th>
                <th className="py-1 font-normal">Ingreso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {productos.map((p) => (
                <tr key={p.nombre}>
                  <td className="py-1 pr-4">{p.nombre}</td>
                  <td className="py-1 pr-4">{p.cantidad}</td>
                  <td className="py-1">{formatoMoneda(p.subtotal)}</td>
                </tr>
              ))}
              {productos.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-1 text-slate-400">
                    Sin ventas de productos en el período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </details>
  );
}

export function IngresosTabla({ meses }: { meses: IngresoMes[] }) {
  const totalGeneral = meses.reduce((acc, m) => acc + m.total, 0);
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-2">Mes</th>
            {TIPOS_ACTA.map((tipo) => (
              <th key={tipo} className="px-4 py-2 text-right">
                {TIPO_ACTA_LABEL[tipo]}
              </th>
            ))}
            <th className="px-4 py-2 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {meses.map((mes) => (
            <tr key={mes.clave}>
              <td className="px-4 py-2 text-slate-900">{mes.etiqueta}</td>
              {TIPOS_ACTA.map((tipo) => (
                <td key={tipo} className="px-4 py-2 text-right text-slate-600">
                  {formatoMoneda(mes.porTipo[tipo])}
                </td>
              ))}
              <td className="px-4 py-2 text-right font-semibold text-slate-900">
                {formatoMoneda(mes.total)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-slate-200 bg-slate-50">
            <td className="px-4 py-2 font-semibold text-slate-900">Total del período</td>
            {TIPOS_ACTA.map((tipo) => (
              <td key={tipo} className="px-4 py-2 text-right font-semibold text-slate-900">
                {formatoMoneda(meses.reduce((acc, m) => acc + m.porTipo[tipo], 0))}
              </td>
            ))}
            <td className="px-4 py-2 text-right font-semibold text-slate-900">
              {formatoMoneda(totalGeneral)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
