import { useState } from 'react';
import { Plus, Pencil, History, Calendar } from 'lucide-react';
import { useTrabajadores } from '@/hooks/useNomina';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { TrabajadorFormModal } from '@/pages/nomina/TrabajadorFormModal';
import { HistorialPagoModal } from '@/pages/nomina/HistorialPagoModal';
import type { Trabajador } from '@/api/nomina';

const FRECUENCIA_LABELS: Record<Trabajador['frecuenciaPago'], string> = {
  MENSUAL: 'Mensual',
  QUINCENAL: 'Quincenal',
  SEMANAL: 'Semanal',
};

function formatoMoneda(valor: number | null) {
  if (valor === null) return '—';
  return valor.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

function formatoFecha(fecha: string | null) {
  if (!fecha) return '—';
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function estaProxima(fecha: string | null) {
  if (!fecha) return false;
  const dias = (new Date(fecha + 'T00:00:00').getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return dias <= 3;
}

export default function NominaPage() {
  const { data: trabajadores, isLoading } = useTrabajadores();
  const [formAbierto, setFormAbierto] = useState(false);
  const [trabajadorEditar, setTrabajadorEditar] = useState<Trabajador | null>(null);
  const [trabajadorHistorial, setTrabajadorHistorial] = useState<Trabajador | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-800">Nómina</h1>
          <p className="mt-1 text-sm text-ink-400">Trabajadores, fechas de pago y comprobantes.</p>
        </div>
        <button
          onClick={() => {
            setTrabajadorEditar(null);
            setFormAbierto(true);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700"
        >
          <Plus size={16} />
          Nuevo trabajador
        </button>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <LoadingState />
        ) : trabajadores && trabajadores.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white shadow-card">
            <table className="w-full text-sm">
              <thead className="border-b border-ink-100 bg-ink-50 text-xs text-ink-500">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Trabajador</th>
                  <th className="px-4 py-3 text-left font-medium">Cargo</th>
                  <th className="px-4 py-3 text-left font-medium">Sucursal</th>
                  <th className="px-4 py-3 text-right font-medium">Salario</th>
                  <th className="px-4 py-3 text-left font-medium">Frecuencia</th>
                  <th className="px-4 py-3 text-left font-medium">Próximo pago</th>
                  <th className="px-4 py-3 text-left font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {trabajadores.map((t) => (
                  <tr key={t.id} className="hover:bg-ink-50/60">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink-800">
                        {t.nombre} {t.apellido ?? ''}
                      </p>
                      {t.documento && <p className="text-xs text-ink-400">{t.documento}</p>}
                    </td>
                    <td className="px-4 py-3 text-ink-600">{t.cargo ?? '—'}</td>
                    <td className="px-4 py-3 text-ink-500">{t.sucursalNombre ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-ink-700">{formatoMoneda(t.salario)}</td>
                    <td className="px-4 py-3 text-ink-600">{FRECUENCIA_LABELS[t.frecuenciaPago]}</td>
                    <td className="px-4 py-3">
                      {t.estado ? (
                        <span
                          className={`flex items-center gap-1 text-xs font-medium ${
                            estaProxima(t.proximaFechaPago) ? 'text-amber-600' : 'text-ink-500'
                          }`}
                        >
                          <Calendar size={13} />
                          {formatoFecha(t.proximaFechaPago)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          t.estado ? 'bg-success-50 text-success-600' : 'bg-ink-100 text-ink-500'
                        }`}
                      >
                        {t.estado ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setTrabajadorHistorial(t)}
                          title="Historial de pagos"
                          className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                        >
                          <History size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setTrabajadorEditar(t);
                            setFormAbierto(true);
                          }}
                          title="Editar"
                          className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                        >
                          <Pencil size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="Sin trabajadores registrados" description="Agrega el primero para empezar a llevar la nómina." />
        )}
      </div>

      <TrabajadorFormModal isOpen={formAbierto} onClose={() => setFormAbierto(false)} trabajador={trabajadorEditar} />
      <HistorialPagoModal
        isOpen={trabajadorHistorial !== null}
        onClose={() => setTrabajadorHistorial(null)}
        trabajador={trabajadorHistorial}
      />
    </div>
  );
}
