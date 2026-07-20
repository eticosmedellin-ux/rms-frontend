import { useState } from 'react';
import { CitasTab } from '@/pages/servicios/CitasTab';
import { OrdenesTrabajoTab } from '@/pages/servicios/OrdenesTrabajoTab';
import { TiposServicioTab } from '@/pages/servicios/TiposServicioTab';
import { HistorialTab } from '@/pages/servicios/HistorialTab';
import { useAuthStore } from '@/stores/authStore';
import { useMiPlan } from '@/hooks/usePlataforma';
import { incluidaEnPlanDirecta, puedeVerModulo, MODULO_SERVICIOS_CITAS, MODULO_SERVICIOS_ORDENES, PLAN_SERVICIOS_CITAS, PLAN_SERVICIOS_ORDENES } from '@/lib/permisos';

const TODOS_LOS_TABS = [
  { id: 'citas', label: 'Citas' },
  { id: 'ordenes', label: 'Órdenes de trabajo' },
  { id: 'tipos', label: 'Tipos de servicio' },
  { id: 'historial', label: 'Historial' },
] as const;

export default function ServiciosPage() {
  const esAdministradorTotal = useAuthStore((state) => state.esAdministradorTotal);
  const esSuperadmin = useAuthStore((state) => state.esSuperadmin);
  const permisos = useAuthStore((state) => state.permisos);
  const { data: miPlan } = useMiPlan();

  // "Servicios" son dos cosas independientes: Citas (barbería, spa, consultorios) y
  // Órdenes de trabajo/Casos (talleres, abogados, contadores) — un negocio con el plan de
  // Barbería NO debe ver los casos legales de Abogados, y viceversa.
  const puedeCitas =
    esSuperadmin ||
    (incluidaEnPlanDirecta(miPlan?.rutasHabilitadas, PLAN_SERVICIOS_CITAS) &&
      (esAdministradorTotal || puedeVerModulo(permisos, MODULO_SERVICIOS_CITAS)));
  const puedeOrdenes =
    esSuperadmin ||
    (incluidaEnPlanDirecta(miPlan?.rutasHabilitadas, PLAN_SERVICIOS_ORDENES) &&
      (esAdministradorTotal || puedeVerModulo(permisos, MODULO_SERVICIOS_ORDENES)));

  const TABS = TODOS_LOS_TABS.filter((t) => {
    if (t.id === 'citas') return puedeCitas;
    if (t.id === 'ordenes') return puedeOrdenes;
    if (t.id === 'tipos') return puedeCitas || puedeOrdenes; // tipos de servicio alimenta a Citas
    return true; // historial sirve para cualquiera de los dos
  });

  const [tab, setTab] = useState<(typeof TODOS_LOS_TABS)[number]['id']>(TABS[0]?.id ?? 'historial');

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
        {tab === 'citas' && puedeCitas && <CitasTab />}
        {tab === 'ordenes' && puedeOrdenes && <OrdenesTrabajoTab />}
        {tab === 'tipos' && <TiposServicioTab />}
        {tab === 'historial' && <HistorialTab />}
      </div>
    </div>
  );
}
