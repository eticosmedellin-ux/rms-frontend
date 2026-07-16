import { useState } from 'react';
import { Plus, Clock, User as UserIcon } from 'lucide-react';
import { useCitas, useCambiarEstadoCita } from '@/hooks/useServicios';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { CitaFormModal } from '@/pages/servicios/CitaFormModal';
import type { Cita, EstadoCita } from '@/api/servicios';

const ESTADO_LABELS: Record<EstadoCita, string> = {
  PROGRAMADA: 'Programada',
  CONFIRMADA: 'Confirmada',
  EN_CURSO: 'En curso',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada',
  NO_ASISTIO: 'No asistió',
};

const ESTADO_TONOS: Record<EstadoCita, string> = {
  PROGRAMADA: 'bg-ink-100 text-ink-600',
  CONFIRMADA: 'bg-amber-100 text-amber-700',
  EN_CURSO: 'bg-blue-100 text-blue-700',
  COMPLETADA: 'bg-success-50 text-success-600',
  CANCELADA: 'bg-danger-50 text-danger-500',
  NO_ASISTIO: 'bg-danger-50 text-danger-500',
};

const SIGUIENTE: Partial<Record<EstadoCita, EstadoCita>> = {
  PROGRAMADA: 'CONFIRMADA',
  CONFIRMADA: 'EN_CURSO',
  EN_CURSO: 'COMPLETADA',
};

function formatoFechaHora(iso: string) {
  return new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
}

export function CitasTab() {
  const { data: citas, isLoading } = useCitas();
  const cambiarEstado = useCambiarEstadoCita();
  const [formAbierto, setFormAbierto] = useState(false);
  const [citaEditar, setCitaEditar] = useState<Cita | null>(null);

  return (
    <div>
      <div className="flex justify-end">
        <button
          onClick={() => {
            setCitaEditar(null);
            setFormAbierto(true);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700"
        >
          <Plus size={16} />
          Nueva cita
        </button>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <LoadingState />
        ) : citas && citas.length > 0 ? (
          <div className="space-y-2">
            {citas.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  setCitaEditar(c);
                  setFormAbierto(true);
                }}
                className="flex cursor-pointer items-center justify-between rounded-xl border border-ink-100 bg-white px-4 py-3 shadow-card hover:border-ink-200"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-sm text-ink-500">
                    <Clock size={14} />
                    {formatoFechaHora(c.fechaHora)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink-800">{c.clienteNombre ?? 'Sin cliente'}</p>
                    <p className="text-xs text-ink-400">
                      {c.tipoServicioNombre ?? 'Sin tipo de servicio'} · {c.sucursalNombre}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {c.asignadoANombre && (
                    <span className="flex items-center gap-1 text-xs text-ink-400">
                      <UserIcon size={12} />
                      {c.asignadoANombre}
                    </span>
                  )}
                  {SIGUIENTE[c.estado] ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cambiarEstado.mutate({ id: c.id, estado: SIGUIENTE[c.estado]! });
                      }}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_TONOS[c.estado]}`}
                    >
                      {ESTADO_LABELS[c.estado]}
                    </button>
                  ) : (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_TONOS[c.estado]}`}>
                      {ESTADO_LABELS[c.estado]}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Sin citas próximas" description="Agenda la primera cita." />
        )}
      </div>

      <CitaFormModal isOpen={formAbierto} onClose={() => setFormAbierto(false)} cita={citaEditar} />
    </div>
  );
}
