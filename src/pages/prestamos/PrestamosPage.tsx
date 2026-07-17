import { useState } from 'react';
import { Plus, AlertTriangle, TrendingUp, Users, RefreshCcw, Wallet } from 'lucide-react';
import { usePrestamos, useDashboardPrestamos } from '@/hooks/usePrestamos';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { PrestamoFormModal } from '@/pages/prestamos/PrestamoFormModal';
import { PrestamoDetalleModal } from '@/pages/prestamos/PrestamoDetalleModal';
import type { Prestamo } from '@/api/prestamos';

const ESTADO_TONOS: Record<Prestamo['estado'], string> = {
  ACTIVO: 'bg-blue-100 text-blue-700',
  PAGADO: 'bg-success-50 text-success-600',
  REFINANCIADO: 'bg-amber-100 text-amber-700',
  RENOVADO: 'bg-ink-100 text-ink-500',
  EN_MORA: 'bg-danger-50 text-danger-600',
  CANCELADO: 'bg-danger-50 text-danger-500',
};

const ESTADO_LABELS: Record<Prestamo['estado'], string> = {
  ACTIVO: 'Activo',
  PAGADO: 'Pagado',
  REFINANCIADO: 'Refinanciado',
  RENOVADO: 'Renovado',
  EN_MORA: 'En mora',
  CANCELADO: 'Cancelado',
};

function formatoMoneda(v: number) {
  return v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

function KpiCard({ icono: Icono, etiqueta, valor, tono }: { icono: typeof Users; etiqueta: string; valor: string; tono: string }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
      <div className="flex items-center gap-2">
        <span className={`rounded-lg p-1.5 ${tono}`}>
          <Icono size={16} />
        </span>
        <p className="text-xs font-medium text-ink-400">{etiqueta}</p>
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-ink-800">{valor}</p>
    </div>
  );
}

export default function PrestamosPage() {
  const { data: prestamos, isLoading } = usePrestamos();
  const { data: dash } = useDashboardPrestamos();
  const [formAbierto, setFormAbierto] = useState(false);
  const [prestamoSeleccionadoId, setPrestamoSeleccionadoId] = useState<number | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-800">Préstamos y créditos</h1>
          <p className="mt-1 text-sm text-ink-400">Cuotas, renovaciones, recordatorios y comprobantes de pago.</p>
        </div>
        <button
          onClick={() => setFormAbierto(true)}
          className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700"
        >
          <Plus size={16} />
          Nuevo préstamo
        </button>
      </div>

      {dash && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <KpiCard icono={Wallet} etiqueta="Activos" valor={String(dash.prestamosActivos)} tono="bg-blue-100 text-blue-700" />
          <KpiCard icono={AlertTriangle} etiqueta="En mora" valor={String(dash.prestamosEnMora)} tono="bg-danger-50 text-danger-600" />
          <KpiCard icono={RefreshCcw} etiqueta="Renovados" valor={String(dash.prestamosRenovados)} tono="bg-ink-100 text-ink-600" />
          <KpiCard icono={Users} etiqueta="Elegibles p/ renovar" valor={String(dash.clientesElegiblesParaRenovar)} tono="bg-amber-100 text-amber-700" />
          <KpiCard icono={TrendingUp} etiqueta="Intereses generados" valor={formatoMoneda(dash.interesesGenerados)} tono="bg-success-50 text-success-600" />
          <KpiCard icono={Wallet} etiqueta="Total prestado" valor={formatoMoneda(dash.valorTotalPrestado)} tono="bg-blue-100 text-blue-700" />
        </div>
      )}

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
                      {p.renovadoDesdeId && ' · Renovado de otro préstamo'}
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
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_TONOS[p.estado]}`}>{ESTADO_LABELS[p.estado]}</span>
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
