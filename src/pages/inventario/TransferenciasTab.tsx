import { useState } from 'react';
import { Plus, Send, PackageCheck, XCircle, Loader2 } from 'lucide-react';
import {
  useTransferencias,
  useCrearTransferencia,
  useEnviarTransferencia,
  useRecibirTransferencia,
  useCancelarTransferencia,
} from '@/hooks/useInventario';
import { useSucursales } from '@/hooks/useSucursales';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { Modal } from '@/components/ui/Modal';
import { DetalleLineasEditor, type LineaDetalle } from '@/components/ui/DetalleLineasEditor';
import { getApiErrorMessage } from '@/api/errors';
import type { EstadoTransferencia } from '@/types/inventario';

const ESTADO_STYLES: Record<EstadoTransferencia, string> = {
  PENDIENTE: 'bg-ink-100 text-ink-600',
  EN_TRANSITO: 'bg-amber-100 text-amber-700',
  RECIBIDA: 'bg-success-50 text-success-600',
  CANCELADA: 'bg-danger-50 text-danger-600',
};

export function TransferenciasTab() {
  const { data: transferencias, isLoading } = useTransferencias();
  const enviar = useEnviarTransferencia();
  const recibir = useRecibirTransferencia();
  const cancelar = useCancelarTransferencia();
  const [modalAbierto, setModalAbierto] = useState(false);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink-400">
          {transferencias?.length ?? 0} transferencia{transferencias?.length === 1 ? '' : 's'}
        </p>
        <button
          onClick={() => setModalAbierto(true)}
          className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700"
        >
          <Plus size={16} />
          Nueva transferencia
        </button>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : transferencias && transferencias.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs text-ink-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Origen</th>
                <th className="px-4 py-3 text-left font-medium">Destino</th>
                <th className="px-4 py-3 text-left font-medium">Productos</th>
                <th className="px-4 py-3 text-left font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {transferencias.map((t) => (
                <tr key={t.id} className="hover:bg-ink-50/60">
                  <td className="px-4 py-3 text-ink-700">{t.sucursalOrigen}</td>
                  <td className="px-4 py-3 text-ink-700">{t.sucursalDestino}</td>
                  <td className="px-4 py-3 text-ink-500">
                    {t.detalles.map((d) => `${d.producto} (${d.cantidad})`).join(', ')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_STYLES[t.estado]}`}>
                      {t.estado.replaceAll('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {t.estado === 'PENDIENTE' && (
                        <>
                          <button
                            onClick={() => enviar.mutate(t.id)}
                            title="Enviar (descuenta stock del origen)"
                            className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                          >
                            <Send size={16} />
                          </button>
                          <button
                            onClick={() => cancelar.mutate(t.id)}
                            title="Cancelar"
                            className="rounded-lg p-1.5 text-ink-400 hover:bg-danger-50 hover:text-danger-500"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                      {t.estado === 'EN_TRANSITO' && (
                        <button
                          onClick={() => recibir.mutate(t.id)}
                          title="Recibir (aumenta stock del destino)"
                          className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                        >
                          <PackageCheck size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="Sin transferencias registradas"
          description="Muévelas entre sucursales si tienes más de una tienda."
        />
      )}

      <TransferenciaFormModal isOpen={modalAbierto} onClose={() => setModalAbierto(false)} />
    </div>
  );
}

function TransferenciaFormModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data: sucursales } = useSucursales();
  const crear = useCrearTransferencia();

  const [sucursalOrigenId, setSucursalOrigenId] = useState('');
  const [sucursalDestinoId, setSucursalDestinoId] = useState('');
  const [lineas, setLineas] = useState<LineaDetalle[]>([{ productoId: '', cantidad: '', costoUnitario: '' }]);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    const detallesValidos = lineas.filter((l) => l.productoId !== '' && l.cantidad !== '');
    if (!sucursalOrigenId || !sucursalDestinoId || detallesValidos.length === 0) {
      setError('Completa origen, destino y al menos un producto');
      return;
    }
    if (sucursalOrigenId === sucursalDestinoId) {
      setError('La sucursal de origen y destino no pueden ser la misma');
      return;
    }

    try {
      await crear.mutateAsync({
        sucursalOrigenId: Number(sucursalOrigenId),
        sucursalDestinoId: Number(sucursalDestinoId),
        detalles: detallesValidos.map((l) => ({ productoId: Number(l.productoId), cantidad: Number(l.cantidad) })),
      });
      setSucursalOrigenId('');
      setSucursalDestinoId('');
      setLineas([{ productoId: '', cantidad: '', costoUnitario: '' }]);
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo crear la transferencia'));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva transferencia entre sucursales" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Sucursal origen</span>
            <select className="input" value={sucursalOrigenId} onChange={(e) => setSucursalOrigenId(e.target.value)}>
              <option value="">Selecciona…</option>
              {sucursales?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Sucursal destino</span>
            <select className="input" value={sucursalDestinoId} onChange={(e) => setSucursalDestinoId(e.target.value)}>
              <option value="">Selecciona…</option>
              {sucursales?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </label>
        </div>

        <DetalleLineasEditor lineas={lineas} onChange={setLineas} mostrarCosto={false} />

        <p className="text-xs text-ink-400">
          Al crearla queda en <strong>PENDIENTE</strong>. Al "enviar" se descuenta el stock del origen (queda EN
          TRÁNSITO); al "recibir" se aumenta el stock del destino.
        </p>

        {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={crear.isPending}
            className="flex items-center gap-2 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
          >
            {crear.isPending && <Loader2 size={16} className="animate-spin" />}
            Crear transferencia
          </button>
        </div>
      </div>
    </Modal>
  );
}
