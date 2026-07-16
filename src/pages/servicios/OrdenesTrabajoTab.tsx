import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useOrdenes, useCambiarEstadoOrden } from '@/hooks/useServicios';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { OrdenTrabajoFormModal } from '@/pages/servicios/OrdenTrabajoFormModal';
import type { OrdenTrabajo, EstadoOrden } from '@/api/servicios';

const ESTADO_LABELS: Record<EstadoOrden, string> = {
  RECIBIDA: 'Recibida',
  EN_PROCESO: 'En proceso',
  ESPERANDO_REPUESTOS: 'Esperando repuestos',
  LISTA: 'Lista',
  ENTREGADA: 'Entregada',
  CANCELADA: 'Cancelada',
};

const ESTADO_TONOS: Record<EstadoOrden, string> = {
  RECIBIDA: 'bg-ink-100 text-ink-600',
  EN_PROCESO: 'bg-blue-100 text-blue-700',
  ESPERANDO_REPUESTOS: 'bg-amber-100 text-amber-700',
  LISTA: 'bg-success-50 text-success-600',
  ENTREGADA: 'bg-ink-100 text-ink-400',
  CANCELADA: 'bg-danger-50 text-danger-500',
};

const SIGUIENTE: Partial<Record<EstadoOrden, EstadoOrden>> = {
  RECIBIDA: 'EN_PROCESO',
  EN_PROCESO: 'LISTA',
  ESPERANDO_REPUESTOS: 'EN_PROCESO',
  LISTA: 'ENTREGADA',
};

const PRIORIDAD_TONOS: Record<string, string> = {
  BAJA: 'text-ink-400',
  MEDIA: 'text-amber-600',
  ALTA: 'text-danger-500',
};

export function OrdenesTrabajoTab() {
  const [soloActivas, setSoloActivas] = useState(true);
  const { data: ordenes, isLoading } = useOrdenes(soloActivas);
  const cambiarEstado = useCambiarEstadoOrden();
  const [formAbierto, setFormAbierto] = useState(false);
  const [ordenEditar, setOrdenEditar] = useState<OrdenTrabajo | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-ink-600">
          <input type="checkbox" checked={soloActivas} onChange={(e) => setSoloActivas(e.target.checked)} />
          Solo activas
        </label>
        <button
          onClick={() => {
            setOrdenEditar(null);
            setFormAbierto(true);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700"
        >
          <Plus size={16} />
          Nueva orden
        </button>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <LoadingState />
        ) : ordenes && ordenes.length > 0 ? (
          <div className="space-y-2">
            {ordenes.map((o) => (
              <div
                key={o.id}
                onClick={() => {
                  setOrdenEditar(o);
                  setFormAbierto(true);
                }}
                className="flex cursor-pointer items-center justify-between rounded-xl border border-ink-100 bg-white px-4 py-3 shadow-card hover:border-ink-200"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-ink-800">{o.titulo}</p>
                    <span className={`text-xs font-semibold ${PRIORIDAD_TONOS[o.prioridad]}`}>● {o.prioridad}</span>
                  </div>
                  <p className="text-xs text-ink-400">
                    {o.clienteNombre ?? 'Sin cliente'} · Recibida {o.fechaRecepcion}
                    {o.fechaEstimadaEntrega ? ` · Entrega estimada ${o.fechaEstimadaEntrega}` : ''}
                    {o.asignadoANombre ? ` · Asignado a ${o.asignadoANombre}` : ''}
                  </p>
                </div>
                {SIGUIENTE[o.estado] ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      cambiarEstado.mutate({ id: o.id, data: { estado: SIGUIENTE[o.estado]! } });
                    }}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_TONOS[o.estado]}`}
                  >
                    {ESTADO_LABELS[o.estado]}
                  </button>
                ) : (
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_TONOS[o.estado]}`}>
                    {ESTADO_LABELS[o.estado]}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Sin órdenes de trabajo" description="Crea la primera para empezar a llevar el seguimiento." />
        )}
      </div>

      <OrdenTrabajoFormModal isOpen={formAbierto} onClose={() => setFormAbierto(false)} orden={ordenEditar} />
    </div>
  );
}
