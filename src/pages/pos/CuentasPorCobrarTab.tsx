import { useState } from 'react';
import { Wallet } from 'lucide-react';
import { useClientes, useCuentasPorCobrar } from '@/hooks/usePos';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { AbonoClienteModal } from '@/pages/pos/AbonoClienteModal';
import type { CuentaPorCobrar } from '@/types/pos';

export function CuentasPorCobrarTab() {
  const { data: clientes } = useClientes();
  const [clienteId, setClienteId] = useState<number | null>(null);
  const { data: cuentas, isLoading } = useCuentasPorCobrar(clienteId);
  const [cuentaAbonando, setCuentaAbonando] = useState<CuentaPorCobrar | null>(null);

  return (
    <div>
      <label className="mb-4 flex items-center gap-2 text-sm">
        <span className="font-medium text-ink-700">Cliente:</span>
        <select
          className="input max-w-xs"
          value={clienteId ?? ''}
          onChange={(e) => setClienteId(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">Selecciona un cliente…</option>
          {clientes?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </label>

      {!clienteId ? (
        <EmptyState title="Selecciona un cliente" description="Elige uno arriba para ver sus cuentas por cobrar." />
      ) : isLoading ? (
        <LoadingState />
      ) : cuentas && cuentas.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs text-ink-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Venta</th>
                <th className="px-4 py-3 text-left font-medium">Vencimiento</th>
                <th className="px-4 py-3 text-right font-medium">Monto original</th>
                <th className="px-4 py-3 text-right font-medium">Saldo pendiente</th>
                <th className="px-4 py-3 text-left font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {cuentas.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 text-ink-500">#{c.ventaId}</td>
                  <td className="px-4 py-3 text-ink-500">{c.fechaVencimiento ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-ink-700">${c.montoOriginal.toLocaleString('es-CO')}</td>
                  <td className="px-4 py-3 text-right font-medium text-ink-800">
                    ${c.saldoPendiente.toLocaleString('es-CO')}
                  </td>
                  <td className="px-4 py-3 text-ink-500">{c.estado}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setCuentaAbonando(c)}
                      title="Registrar abono"
                      className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                    >
                      <Wallet size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="Sin cuentas por cobrar pendientes" />
      )}

      <AbonoClienteModal
        isOpen={cuentaAbonando !== null}
        onClose={() => setCuentaAbonando(null)}
        cuenta={cuentaAbonando}
      />
    </div>
  );
}
