import { useState } from 'react';
import { CitasTab } from '@/pages/servicios/CitasTab';
import { OrdenesTrabajoTab } from '@/pages/servicios/OrdenesTrabajoTab';
import { TiposServicioTab } from '@/pages/servicios/TiposServicioTab';
import { HistorialTab } from '@/pages/servicios/HistorialTab';

const TABS = [
  { id: 'citas', label: 'Citas' },
  { id: 'ordenes', label: 'Órdenes de trabajo' },
  { id: 'tipos', label: 'Tipos de servicio' },
  { id: 'historial', label: 'Historial' },
] as const;

export default function ServiciosPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('citas');

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-800">Servicios</h1>
      <p className="mt-1 text-sm text-ink-400">Citas y órdenes de trabajo.</p>

      <div className="mt-5 flex gap-1 border-b border-ink-100">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.id ? 'border-ink-800 text-ink-800' : 'border-transparent text-ink-400 hover:text-ink-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === 'citas' && <CitasTab />}
        {tab === 'ordenes' && <OrdenesTrabajoTab />}
        {tab === 'tipos' && <TiposServicioTab />}
        {tab === 'historial' && <HistorialTab />}
      </div>
    </div>
  );
}
