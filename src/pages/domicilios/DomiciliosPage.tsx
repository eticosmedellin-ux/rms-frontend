import { useState } from 'react';
import { Plus, MapPin, Phone } from 'lucide-react';
import { useDomicilios } from '@/hooks/useDomicilios';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { DomicilioFormModal } from '@/pages/domicilios/DomicilioFormModal';
import { DomicilioDetalleModal } from '@/pages/domicilios/DomicilioDetalleModal';
import type { Domicilio, EstadoDomicilio } from '@/api/domicilios';

const ESTADO_LABELS: Record<EstadoDomicilio, string> = {
  RECIBIDO: 'Recibido',
  EN_PREPARACION: 'En preparación',
  EN_CAMINO: 'En camino',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

const ESTADO_TONOS: Record<EstadoDomicilio, string> = {
  RECIBIDO: 'bg-ink-100 text-ink-600',
  EN_PREPARACION: 'bg-amber-100 text-amber-700',
  EN_CAMINO: 'bg-blue-100 text-blue-700',
  ENTREGADO: 'bg-success-50 text-success-600',
  CANCELADO: 'bg-danger-50 text-danger-500',
};

function formatoMoneda(v: number) {
  return v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

export default function DomiciliosPage() {
  const [soloActivos, setSoloActivos] = useState(true);
  const { data: domicilios, isLoading } = useDomicilios(soloActivos);
  const [formAbierto, setFormAbierto] = useState(false);
  const [domicilioSeleccionado, setDomicilioSeleccionado] = useState<Domicilio | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-800">Domicilios</h1>
          <p className="mt-1 text-sm text-ink-400">Pedidos externos — teléfono, WhatsApp, página web, Rappi...</p>
        </div>
        <button
          onClick={() => setFormAbierto(true)}
          className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700"
        >
          <Plus size={16} />
          Nuevo pedido
        </button>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-ink-600">
        <input type="checkbox" checked={soloActivos} onChange={(e) => setSoloActivos(e.target.checked)} />
        Solo activos
      </label>

      <div className="mt-4">
        {isLoading ? (
          <LoadingState />
        ) : domicilios && domicilios.length > 0 ? (
          <div className="space-y-2">
            {domicilios.map((d) => (
              <div
                key={d.id}
                onClick={() => setDomicilioSeleccionado(d)}
                className="flex cursor-pointer items-center justify-between rounded-xl border border-ink-100 bg-white px-4 py-3 shadow-card hover:border-ink-200"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-ink-800">{d.clienteNombre ?? 'Cliente sin registrar'}</p>
                    <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-ink-500">{d.canal}</span>
                  </div>
                  <p className="mt-0.5 flex items-center gap-3 text-xs text-ink-400">
                    <span className="flex items-center gap-1">
                      <MapPin size={11} />
                      {d.direccionEntrega}
                    </span>
                    {d.telefonoContacto && (
                      <span className="flex items-center gap-1">
                        <Phone size={11} />
                        {d.telefonoContacto}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-ink-700">{formatoMoneda(d.total)}</span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_TONOS[d.estado]}`}>
                    {ESTADO_LABELS[d.estado]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Sin pedidos" description="Registra el primer pedido a domicilio." />
        )}
      </div>

      <DomicilioFormModal isOpen={formAbierto} onClose={() => setFormAbierto(false)} />
      <DomicilioDetalleModal
        isOpen={domicilioSeleccionado !== null}
        onClose={() => setDomicilioSeleccionado(null)}
        domicilioId={domicilioSeleccionado?.id ?? null}
      />
    </div>
  );
}
