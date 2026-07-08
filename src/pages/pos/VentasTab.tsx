import { useState } from 'react';
import { Undo2 } from 'lucide-react';
import { useVentas } from '@/hooks/usePos';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { DevolucionModal } from '@/pages/pos/DevolucionModal';
import type { Venta } from '@/types/pos';

export function VentasTab() {
  const { data: ventas, isLoading } = useVentas();
  const [ventaDevolviendo, setVentaDevolviendo] = useState<Venta | null>(null);

  if (isLoading) return <LoadingState />;
  if (!ventas || ventas.length === 0) {
    return <EmptyState title="Sin ventas registradas todavía" description="Ve a la pestaña 'Vender' para registrar la primera." />;
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-100 bg-ink-50 text-xs text-ink-500">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Número</th>
              <th className="px-4 py-3 text-left font-medium">Cliente</th>
              <th className="px-4 py-3 text-left font-medium">Tipo</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
              <th className="px-4 py-3 text-left font-medium">Fecha</th>
              <th className="px-4 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-50">
            {ventas.map((v) => (
              <tr key={v.id} className="hover:bg-ink-50/60">
                <td className="px-4 py-3 font-mono text-xs text-ink-600">{v.numero}</td>
                <td className="px-4 py-3 text-ink-700">{v.cliente}</td>
                <td className="px-4 py-3 text-ink-500">{v.tipoVenta}</td>
                <td className="px-4 py-3 text-right font-medium text-ink-800">${v.total.toLocaleString('es-CO')}</td>
                <td className="px-4 py-3 text-ink-500">
                  {new Date(v.fecha).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setVentaDevolviendo(v)}
                    title="Registrar devolución"
                    className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                  >
                    <Undo2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DevolucionModal
        isOpen={ventaDevolviendo !== null}
        onClose={() => setVentaDevolviendo(null)}
        venta={ventaDevolviendo}
      />
    </div>
  );
}
