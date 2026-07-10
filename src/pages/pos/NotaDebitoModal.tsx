import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useCrearNotaDebito } from '@/hooks/usePos';
import { useClientes } from '@/hooks/usePos';
import { getApiErrorMessage } from '@/api/errors';
import { Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Si se abre desde una venta puntual (ej. cobrar un flete adicional). */
  ventaId?: number;
  ventaNumero?: string;
  /** Si se abre desde una venta, ya sabemos el cliente y no hace falta elegirlo. */
  clienteId?: number;
  clienteNombre?: string;
}

export function NotaDebitoModal({ isOpen, onClose, ventaId, ventaNumero, clienteId, clienteNombre }: Props) {
  const crear = useCrearNotaDebito();
  const { data: clientes } = useClientes();
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>(clienteId ? String(clienteId) : '');
  const [concepto, setConcepto] = useState('');
  const [detalle, setDetalle] = useState('');
  const [monto, setMonto] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  function limpiarYCerrar() {
    setConcepto('');
    setDetalle('');
    setMonto('');
    setError(null);
    setExito(null);
    if (!clienteId) setClienteSeleccionado('');
    onClose();
  }

  async function handleSubmit() {
    setError(null);
    const clienteFinal = clienteId ?? (clienteSeleccionado ? Number(clienteSeleccionado) : null);
    if (!clienteFinal && !ventaId) {
      setError('Selecciona un cliente');
      return;
    }
    if (!concepto.trim() || !Number(monto) || Number(monto) <= 0) {
      setError('Completa el concepto y un monto mayor a cero');
      return;
    }

    try {
      const doc = await crear.mutateAsync({
        clienteId: clienteFinal ?? 0,
        ventaId: ventaId ?? undefined,
        concepto,
        detalle: detalle || undefined,
        monto: Number(monto),
      });
      setExito(`Nota débito ${doc.numero} emitida por $${doc.monto.toLocaleString('es-CO')}`);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo emitir la nota débito'));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={limpiarYCerrar} title="Nota débito — cargo adicional al cliente" size="md">
      {exito ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-success-50 px-3 py-2.5 text-sm text-success-600">{exito}</div>
          <button
            onClick={limpiarYCerrar}
            className="w-full rounded-lg bg-ink-800 py-2 text-sm font-semibold text-white hover:bg-ink-700"
          >
            Listo
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {ventaId ? (
            <p className="text-sm text-ink-500">
              Se cargará a <span className="font-medium text-ink-800">{clienteNombre}</span>, sobre la venta{' '}
              <span className="font-mono text-xs">{ventaNumero}</span>.
            </p>
          ) : (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-700">Cliente</span>
              <select className="input" value={clienteSeleccionado} onChange={(e) => setClienteSeleccionado(e.target.value)}>
                <option value="">Selecciona…</option>
                {clientes?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Concepto</span>
            <input
              className="input"
              placeholder="Ej: Flete adicional, corrección de precio…"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Monto a cargar</span>
            <input type="number" min={0} className="input" value={monto} onChange={(e) => setMonto(e.target.value)} />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Detalle (opcional)</span>
            <textarea className="input" rows={2} value={detalle} onChange={(e) => setDetalle(e.target.value)} />
          </label>

          <p className="text-xs text-ink-400">
            Esto aumenta lo que el cliente debe — no mueve dinero de caja en este momento. Se cobra después, igual
            que cualquier otra cuenta por cobrar.
          </p>

          {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={limpiarYCerrar} className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50">
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={crear.isPending}
              className="flex items-center gap-2 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
            >
              {crear.isPending && <Loader2 size={16} className="animate-spin" />}
              Emitir nota débito
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
