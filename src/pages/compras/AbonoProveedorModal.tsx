import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useAbonarCuentaPorPagar } from '@/hooks/useCompras';
import { useCajaAbierta } from '@/hooks/usePos';
import { usePosStore } from '@/stores/posStore';
import { getApiErrorMessage } from '@/api/errors';
import type { CuentaPorPagar } from '@/types/compras';
import { Loader2 } from 'lucide-react';

export function AbonoProveedorModal({
  isOpen,
  onClose,
  cuenta,
}: {
  isOpen: boolean;
  onClose: () => void;
  cuenta: CuentaPorPagar | null;
}) {
  const abonar = useAbonarCuentaPorPagar();
  const { sucursalId } = usePosStore();
  const { data: caja } = useCajaAbierta(sucursalId);
  const [monto, setMonto] = useState('');
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [error, setError] = useState<string | null>(null);

  if (!cuenta) return null;

  async function handleSubmit() {
    setError(null);
    if (!cuenta) return;
    try {
      await abonar.mutateAsync({
        cuentaId: cuenta.id,
        data: {
          monto: Number(monto),
          metodoPago,
          cajaSesionId: metodoPago === 'EFECTIVO' && caja ? caja.id : undefined,
        },
      });
      setMonto('');
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo registrar el abono'));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Abonar — ${cuenta.proveedor}`} size="sm">
      <div className="space-y-4">
        <p className="text-sm text-ink-500">
          Saldo pendiente: <span className="font-semibold text-ink-800">${cuenta.saldoPendiente.toLocaleString('es-CO')}</span>
        </p>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Monto a abonar</span>
          <input type="number" className="input" value={monto} onChange={(e) => setMonto(e.target.value)} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Método de pago</span>
          <select className="input" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
            <option value="EFECTIVO">Efectivo</option>
            <option value="TRANSFERENCIA">Transferencia</option>
            <option value="CHEQUE">Cheque</option>
          </select>
        </label>

        {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={abonar.isPending || !monto}
            className="flex items-center gap-2 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
          >
            {abonar.isPending && <Loader2 size={16} className="animate-spin" />}
            Confirmar abono
          </button>
        </div>
      </div>
    </Modal>
  );
}
