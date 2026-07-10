import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useRegistrarDevolucion } from '@/hooks/usePos';
import { useCajaAbierta } from '@/hooks/usePos';
import { usePosStore } from '@/stores/posStore';
import { getApiErrorMessage } from '@/api/errors';
import type { Venta, DevolucionVentaResponse } from '@/types/pos';
import { Loader2, CheckCircle2 } from 'lucide-react';

export function DevolucionModal({ isOpen, onClose, venta }: { isOpen: boolean; onClose: () => void; venta: Venta | null }) {
  const registrar = useRegistrarDevolucion();
  const { sucursalId } = usePosStore();
  const { data: caja } = useCajaAbierta(sucursalId);
  const [motivo, setMotivo] = useState('');
  const [cantidades, setCantidades] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<DevolucionVentaResponse | null>(null);

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
      const res = await registrar.mutateAsync({
        ventaId: venta.id,
        data: { motivo, detalles, cajaSesionId: caja?.id ?? undefined },
      });
      setResultado(res);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo registrar la devolución'));
    }
  }

  function handleClose() {
    setMotivo('');
    setCantidades({});
    setResultado(null);
    setError(null);
    onClose();
  }

  if (resultado) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Devolución registrada" size="sm">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-success-600">
            <CheckCircle2 size={20} />
            <p className="text-sm font-medium">Se emitió la nota crédito {resultado.notaCreditoNumero}</p>
          </div>
          <div className="space-y-1.5 rounded-lg bg-ink-50 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-500">Total reintegrado</span>
              <span className="font-semibold text-ink-800">
                ${resultado.montoReintegrado.toLocaleString('es-CO')}
              </span>
            </div>
            {resultado.aplicadoACuentaPorCobrar > 0 && (
              <div className="flex justify-between">
                <span className="text-ink-500">Abonado a la deuda del cliente</span>
                <span className="text-ink-700">${resultado.aplicadoACuentaPorCobrar.toLocaleString('es-CO')}</span>
              </div>
            )}
            {resultado.reintegradoEnEfectivo > 0 && (
              <div className="flex justify-between">
                <span className="text-ink-500">Devuelto en efectivo</span>
                <span className="text-ink-700">${resultado.reintegradoEnEfectivo.toLocaleString('es-CO')}</span>
              </div>
            )}
          </div>
          <button
            onClick={handleClose}
            className="w-full rounded-lg bg-ink-800 py-2 text-sm font-semibold text-white hover:bg-ink-700"
          >
            Listo
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Devolución — venta ${venta.numero}`} size="lg">
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Motivo</span>
          <input className="input" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </label>

        <div>
          <p className="mb-2 text-sm font-medium text-ink-700">¿Cuánto se devuelve de cada producto?</p>
          <div className="space-y-2">
            {venta.detalles.filter((d) => d.productoId !== null).map((d) => (
              <div key={d.productoId} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-ink-700">
                  {d.producto} <span className="text-ink-400">(vendidos: {d.cantidad})</span>
                </span>
                <input
                  type="number"
                  min={0}
                  max={d.cantidad}
                  className="w-24 rounded-lg border border-ink-200 px-2 py-1 text-center text-sm"
                  value={cantidades[d.productoId!] ?? ''}
                  onChange={(e) => setCantidades((prev) => ({ ...prev, [d.productoId!]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          {venta.detalles.some((d) => d.esCombo) && (
            <p className="mt-2 text-xs text-amber-600">
              Esta venta incluye combos — todavía no se pueden devolver individualmente, solo los productos sueltos.
            </p>
          )}
        </div>

        {venta.tipoVenta === 'CREDITO' ? (
          <p className="text-xs text-ink-400">
            Esta venta fue a crédito: el reintegro primero abona la deuda pendiente del cliente. Si sobra, se
            devuelve en efectivo{caja ? '' : ' (necesitas abrir la caja de esta sucursal para eso)'}.
          </p>
        ) : (
          <p className="text-xs text-ink-400">
            {caja
              ? 'El reintegro se devolverá en efectivo desde la caja abierta.'
              : 'Necesitas abrir la caja de esta sucursal para poder devolver el dinero.'}
          </p>
        )}

        {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={handleClose} className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50">
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
