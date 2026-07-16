import { useState } from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import { usePrestamos } from '@/hooks/usePrestamos';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { PrestamoFormModal } from '@/pages/prestamos/PrestamoFormModal';
import { PrestamoDetalleModal } from '@/pages/prestamos/PrestamoDetalleModal';
import type { Prestamo } from '@/api/prestamos';

const ESTADO_TONOS: Record<Prestamo['estado'], string> = {
  ACTIVO: 'bg-blue-100 text-blue-700',
  PAGADO: 'bg-success-50 text-success-600',
  CANCELADO: 'bg-danger-50 text-danger-500',
};

function formatoMoneda(v: number) {
  return v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

export default function PrestamosPage() {
  const { data: prestamos, isLoading } = usePrestamos();
  const [formAbierto, setFormAbierto] = useState(false);
  const [prestamoSeleccionadoId, setPrestamoSeleccionadoId] = useState<number | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-800">Préstamos y créditos</h1>
          <p className="mt-1 text-sm text-ink-400">Cuotas, recordatorios y comprobantes de pago.</p>
        </div>
        <button
          onClick={() => setFormAbierto(true)}
          className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700"
        >
          <Plus size={16} />
          Nuevo préstamo
        </button>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <LoadingState />
        ) : prestamos && prestamos.length > 0 ? (
          <div className="space-y-2">
            {prestamos.map((p) => {
              const cuotasVencidas = p.cuotas.filter((c) => c.vencida).length;
              return (
                <div
                  key={p.id}
                  onClick={() => setPrestamoSeleccionadoId(p.id)}
                  className="flex cursor-pointer items-center justify-between rounded-xl border border-ink-100 bg-white px-4 py-3 shadow-card hover:border-ink-200"
                >
                  <div>
                    <p className="text-sm font-medium text-ink-800">{p.clienteNombre}</p>
                    <p className="text-xs text-ink-400">
                      {formatoMoneda(p.montoPrincipal)} · {p.numeroCuotas} cuotas · {p.sucursalNombre}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {cuotasVencidas > 0 && (
                      <span className="flex items-center gap-1 text-xs font-medium text-danger-500">
                        <AlertTriangle size={13} />
                        {cuotasVencidas} vencida{cuotasVencidas > 1 ? 's' : ''}
                      </span>
                    )}
                    <span className="text-sm font-medium text-ink-700">Pendiente: {formatoMoneda(p.saldoPendiente)}</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_TONOS[p.estado]}`}>{p.estado}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title="Sin préstamos registrados" description="Crea el primero para empezar a llevar el control de cuotas." />
        )}
      </div>

      <PrestamoFormModal isOpen={formAbierto} onClose={() => setFormAbierto(false)} />
      <PrestamoDetalleModal
        isOpen={prestamoSeleccionadoId !== null}
        onClose={() => setPrestamoSeleccionadoId(null)}
        prestamoId={prestamoSeleccionadoId}
      />
    </div>
  );
}
