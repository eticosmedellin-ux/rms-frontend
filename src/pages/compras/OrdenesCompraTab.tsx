import { useState } from 'react';
import { Plus, Send, PackageCheck, XCircle } from 'lucide-react';
import { useOrdenesCompra, useEnviarOrdenCompra, useCancelarOrdenCompra } from '@/hooks/useCompras';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { OrdenCompraFormModal } from '@/pages/compras/OrdenCompraFormModal';
import { RecepcionFormModal } from '@/pages/compras/RecepcionFormModal';
import type { OrdenCompra, EstadoOrdenCompra } from '@/types/compras';

const ESTADO_STYLES: Record<EstadoOrdenCompra, string> = {
  BORRADOR: 'bg-ink-100 text-ink-600',
  ENVIADA: 'bg-amber-100 text-amber-700',
  PARCIALMENTE_RECIBIDA: 'bg-amber-100 text-amber-700',
  RECIBIDA: 'bg-success-50 text-success-600',
  CERRADA: 'bg-success-50 text-success-600',
  CANCELADA: 'bg-danger-50 text-danger-600',
};

export function OrdenesCompraTab() {
  const { data: ordenes, isLoading } = useOrdenesCompra();
  const enviar = useEnviarOrdenCompra();
  const cancelar = useCancelarOrdenCompra();
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [ordenRecibiendo, setOrdenRecibiendo] = useState<OrdenCompra | null>(null);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink-400">
          {ordenes?.length ?? 0} orden{ordenes?.length === 1 ? '' : 'es'} de compra
        </p>
        <button
          onClick={() => setModalCrearAbierto(true)}
          className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700"
        >
          <Plus size={16} />
          Nueva orden
        </button>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : ordenes && ordenes.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs text-ink-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Número</th>
                <th className="px-4 py-3 text-left font-medium">Proveedor</th>
                <th className="px-4 py-3 text-left font-medium">Sucursal</th>
                <th className="px-4 py-3 text-left font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {ordenes.map((o) => (
                <tr key={o.id} className="hover:bg-ink-50/60">
                  <td className="px-4 py-3 font-mono text-xs text-ink-600">{o.numero}</td>
                  <td className="px-4 py-3 font-medium text-ink-800">{o.proveedor}</td>
                  <td className="px-4 py-3 text-ink-500">{o.sucursal}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_STYLES[o.estado]}`}>
                      {o.estado.replaceAll('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {o.estado === 'BORRADOR' && (
                        <button
                          onClick={() => enviar.mutate(o.id)}
                          title="Enviar orden"
                          className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                        >
                          <Send size={16} />
                        </button>
                      )}
                      {(o.estado === 'ENVIADA' || o.estado === 'PARCIALMENTE_RECIBIDA') && (
                        <button
                          onClick={() => setOrdenRecibiendo(o)}
                          title="Registrar recepción"
                          className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                        >
                          <PackageCheck size={16} />
                        </button>
                      )}
                      {o.estado !== 'RECIBIDA' && o.estado !== 'CERRADA' && o.estado !== 'CANCELADA' && (
                        <button
                          onClick={() => cancelar.mutate(o.id)}
                          title="Cancelar orden"
                          className="rounded-lg p-1.5 text-ink-400 hover:bg-danger-50 hover:text-danger-500"
                        >
                          <XCircle size={16} />
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
        <EmptyState title="Sin órdenes de compra" description="Crea la primera para empezar el ciclo de compras." />
      )}

      <OrdenCompraFormModal isOpen={modalCrearAbierto} onClose={() => setModalCrearAbierto(false)} />
      <RecepcionFormModal
        isOpen={ordenRecibiendo !== null}
        onClose={() => setOrdenRecibiendo(null)}
        orden={ordenRecibiendo}
      />
    </div>
  );
}
