import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useRegistrarDevolucion } from '@/hooks/usePos';
import { getApiErrorMessage } from '@/api/errors';
import type { Venta } from '@/types/pos';
import { Loader2 } from 'lucide-react';

export function DevolucionModal({ isOpen, onClose, venta }: { isOpen: boolean; onClose: () => void; venta: Venta | null }) {
  const registrar = useRegistrarDevolucion();
  const [motivo, setMotivo] = useState('');
  const [cantidades, setCantidades] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  if (!venta) return null;

  async function handleSubmit() {
    setError(null);
    if (!venta) return;
    const detalles = Object.entries(cantidades)
      .filter(([, cantidad]) => Number(cantidad) > 0)
      .map(([productoId, cantidad]) => ({ productoId: Number(productoId), cantidad: Number(cantidad) }));

    if (!motivo.trim() || detalles.length === 0) {
      setError('Indica el motivo y la cantidad a devolver de al menos un producto');
      return;
    }

    try {
      await registrar.mutateAsync({ ventaId: venta.id, data: { motivo, detalles } });
      setMotivo('');
      setCantidades({});
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo registrar la devolución'));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Devolución — venta ${venta.numero}`} size="lg">
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Motivo</span>
          <input className="input" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </label>

        <div>
          <p className="mb-2 text-sm font-medium text-ink-700">¿Cuánto se devuelve de cada producto?</p>
          <div className="space-y-2">
            {venta.detalles.map((d) => (
              <div key={d.productoId} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-ink-700">
                  {d.producto} <span className="text-ink-400">(vendidos: {d.cantidad})</span>
                </span>
                <input
                  type="number"
                  min={0}
                  max={d.cantidad}
                  className="w-24 rounded-lg border border-ink-200 px-2 py-1 text-center text-sm"
                  value={cantidades[d.productoId] ?? ''}
                  onChange={(e) => setCantidades((prev) => ({ ...prev, [d.productoId]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </div>

        {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={registrar.isPending}
            className="flex items-center gap-2 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
          >
            {registrar.isPending && <Loader2 size={16} className="animate-spin" />}
            Confirmar devolución
          </button>
        </div>
      </div>
    </Modal>
  );
}
