export function CobroModal({
  titulo,
  precio,
  metodoPago,
  onMetodoPagoChange,
  onCancelar,
  botonConfirmar,
  error,
}: {
  titulo: string;
  precio: number;
  metodoPago: string;
  onMetodoPagoChange: (valor: string) => void;
  onCancelar: () => void;
  botonConfirmar: React.ReactNode;
  error?: string | null;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-base font-semibold text-slate-900">{titulo}</h2>
        <p className="mt-2 text-3xl font-bold text-slate-900">
          ${precio.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
        </p>
        <div className="mt-4">
          <label className="block text-xs font-medium text-slate-600">Método de pago</label>
          <select
            value={metodoPago}
            onChange={(e) => onMetodoPagoChange(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="EFECTIVO">Efectivo</option>
            <option value="TARJETA">Tarjeta</option>
            <option value="TRANSFERENCIA">Transferencia</option>
          </select>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancelar}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          {botonConfirmar}
        </div>
      </div>
    </div>
  );
}
