import { useState } from 'react';
import { Plus, Users, MapPin, History as HistoryIcon } from 'lucide-react';
import { useMesas, useComandasHistorial } from '@/hooks/useRestaurante';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { MesaFormModal } from '@/pages/restaurante/MesaFormModal';
import { ComandaModal } from '@/pages/restaurante/ComandaModal';
import type { Mesa } from '@/api/restaurante';

const ESTADO_TONOS: Record<Mesa['estado'], string> = {
  LIBRE: 'border-success-200 bg-success-50 hover:border-success-300',
  OCUPADA: 'border-amber-300 bg-amber-50 hover:border-amber-400',
  RESERVADA: 'border-ink-300 bg-ink-50 hover:border-ink-400',
};

const ESTADO_LABELS: Record<Mesa['estado'], string> = {
  LIBRE: 'Libre',
  OCUPADA: 'Ocupada',
  RESERVADA: 'Reservada',
};

function formatoMoneda(v: number) {
  return v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

export default function RestaurantePage() {
  const { data: mesas, isLoading } = useMesas();
  const [formAbierto, setFormAbierto] = useState(false);
  const [mesaEditar, setMesaEditar] = useState<Mesa | null>(null);
  const [mesaSeleccionada, setMesaSeleccionada] = useState<Mesa | null>(null);
  const [vista, setVista] = useState<'mesas' | 'historial'>('mesas');

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-800">Restaurante</h1>
          <p className="mt-1 text-sm text-ink-400">Mesas y comandas en tiempo real.</p>
        </div>
        <button
          onClick={() => {
            setMesaEditar(null);
            setFormAbierto(true);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700"
        >
          <Plus size={16} />
          Nueva mesa
        </button>
      </div>

      <div className="mt-4 flex gap-1 border-b border-ink-100">
        <button
          onClick={() => setVista('mesas')}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            vista === 'mesas' ? 'border-ink-800 text-ink-800' : 'border-transparent text-ink-400 hover:text-ink-600'
          }`}
        >
          Mesas
        </button>
        <button
          onClick={() => setVista('historial')}
          className={`flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            vista === 'historial' ? 'border-ink-800 text-ink-800' : 'border-transparent text-ink-400 hover:text-ink-600'
          }`}
        >
          <HistoryIcon size={14} />
          Historial
        </button>
      </div>

      {vista === 'mesas' ? (
      <div className="mt-6">
        {isLoading ? (
          <LoadingState />
        ) : mesas && mesas.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {mesas.map((m) => (
              <button
                key={m.id}
                onClick={() => setMesaSeleccionada(m)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setMesaEditar(m);
                  setFormAbierto(true);
                }}
                className={`flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left shadow-card transition-colors ${ESTADO_TONOS[m.estado]}`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-display text-lg font-bold text-ink-800">Mesa {m.numero}</span>
                  <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-600">
                    {ESTADO_LABELS[m.estado]}
                  </span>
                </div>
                {m.zona && (
                  <span className="flex items-center gap-1 text-xs text-ink-500">
                    <MapPin size={12} />
                    {m.zona}
                  </span>
                )}
                {m.capacidad && (
                  <span className="flex items-center gap-1 text-xs text-ink-500">
                    <Users size={12} />
                    {m.capacidad} personas
                  </span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <EmptyState title="Sin mesas configuradas" description="Agrega tu primera mesa para empezar a tomar comandas." />
        )}
      </div>
      ) : (
        <HistorialComandas />
      )}

      <p className="mt-3 text-xs text-ink-400">Clic para abrir/gestionar la comanda · clic derecho para editar la mesa.</p>

      <MesaFormModal isOpen={formAbierto} onClose={() => setFormAbierto(false)} mesa={mesaEditar} />
      <ComandaModal isOpen={mesaSeleccionada !== null} onClose={() => setMesaSeleccionada(null)} mesa={mesaSeleccionada} />
    </div>
  );
}

function HistorialComandas() {
  const { data: comandas, isLoading } = useComandasHistorial();

  return (
    <div className="mt-6">
      {isLoading ? (
        <LoadingState />
      ) : comandas && comandas.length > 0 ? (
        <div className="space-y-2">
          {comandas.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-xl border border-ink-100 bg-white px-4 py-3 shadow-card">
              <div>
                <p className="text-sm font-medium text-ink-800">Mesa {c.mesaNumero}</p>
                <p className="text-xs text-ink-400">
                  {c.meseroNombre} · {c.fechaCierre ? new Date(c.fechaCierre).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                  {c.ventaId ? ` · Venta #${c.ventaId}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-ink-700">{formatoMoneda(c.total)}</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    c.estado === 'CERRADA' ? 'bg-success-50 text-success-600' : 'bg-danger-50 text-danger-500'
                  }`}
                >
                  {c.estado === 'CERRADA' ? 'Facturada' : 'Cancelada'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="Sin historial todavía" description="Aquí verás las comandas ya cerradas o canceladas." />
      )}
    </div>
  );
}
