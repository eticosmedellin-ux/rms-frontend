import { useCitasHistorial } from '@/hooks/useServicios';
import { useOrdenes } from '@/hooks/useServicios';
import { LoadingState, EmptyState } from '@/components/ui/States';
import type { EstadoCita, EstadoOrden } from '@/api/servicios';

const ESTADO_CITA_LABELS: Record<EstadoCita, string> = {
  PROGRAMADA: 'Programada',
  CONFIRMADA: 'Confirmada',
  EN_CURSO: 'En curso',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada',
  NO_ASISTIO: 'No asistió',
};

const ESTADO_ORDEN_LABELS: Record<EstadoOrden, string> = {
  RECIBIDA: 'Recibida',
  EN_PROCESO: 'En proceso',
  ESPERANDO_REPUESTOS: 'Esperando repuestos',
  LISTA: 'Lista',
  ENTREGADA: 'Entregada',
  CANCELADA: 'Cancelada',
};

export function HistorialTab() {
  const { data: citas, isLoading: cargandoCitas } = useCitasHistorial();
  const { data: ordenes, isLoading: cargandoOrdenes } = useOrdenes(false);
  const ordenesFinalizadas = ordenes?.filter((o) => o.estado === 'ENTREGADA' || o.estado === 'CANCELADA') ?? [];

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-semibold text-ink-700">Citas pasadas</p>
        {cargandoCitas ? (
          <LoadingState />
        ) : citas && citas.length > 0 ? (
          <div className="space-y-1.5">
            {citas.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm">
                <div>
                  <p className="font-medium text-ink-800">{c.clienteNombre ?? 'Sin cliente'}</p>
                  <p className="text-xs text-ink-400">
                    {new Date(c.fechaHora).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })} ·{' '}
                    {c.tipoServicioNombre ?? 'Sin tipo'}
                  </p>
                </div>
                <span className="text-xs font-medium text-ink-500">{ESTADO_CITA_LABELS[c.estado]}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Sin citas pasadas todavía" />
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-ink-700">Órdenes de trabajo finalizadas</p>
        {cargandoOrdenes ? (
          <LoadingState />
        ) : ordenesFinalizadas.length > 0 ? (
          <div className="space-y-1.5">
            {ordenesFinalizadas.map((o) => (
              <div key={o.id} className="flex items-center justify-between rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm">
                <div>
                  <p className="font-medium text-ink-800">{o.titulo}</p>
                  <p className="text-xs text-ink-400">
                    {o.clienteNombre ?? 'Sin cliente'} · Recibida {o.fechaRecepcion}
                    {o.fechaEntregaReal ? ` · Entregada ${o.fechaEntregaReal}` : ''}
                  </p>
                </div>
                <span className="text-xs font-medium text-ink-500">{ESTADO_ORDEN_LABELS[o.estado]}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Sin órdenes finalizadas todavía" />
        )}
      </div>
    </div>
  );
}
