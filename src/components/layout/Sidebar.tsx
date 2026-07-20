import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Store,
  Receipt,
  BarChart3,
  Settings,
  Bell,
  Users,
  ShieldAlert,
  Tag,
  FileStack,
  Calculator,
  Users2,
  UtensilsCrossed,
  CalendarClock,
  Landmark,
  Bike,
  X,
  Briefcase,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { puedeVerRuta, incluidaEnPlan } from '@/lib/permisos';
import { useMiPlan } from '@/hooks/usePlataforma';

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; end?: boolean };

const NAV_GROUPS_DEF: { titulo: string | null; items: NavItem[] }[] = [
  {
    titulo: null,
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    titulo: 'Ventas',
    items: [
      { to: '/pos', label: 'Punto de venta', icon: Store },
      { to: '/documentos', label: 'Documentos', icon: FileStack },
      { to: '/descuentos', label: 'Descuentos', icon: Tag },
    ],
  },
  {
    titulo: 'Operación',
    items: [
      { to: '/inventario', label: 'Inventario', icon: Package },
      { to: '/compras', label: 'Compras', icon: ShoppingCart },
      { to: '/gastos', label: 'Gastos', icon: Receipt },
      { to: '/restaurante', label: 'Restaurante', icon: UtensilsCrossed },
      { to: '/servicios', label: 'Servicios', icon: CalendarClock },
      { to: '/prestamos', label: 'Préstamos', icon: Landmark },
      { to: '/domicilios', label: 'Domicilios', icon: Bike },
    ],
  },
  {
    titulo: 'Análisis',
    items: [
      { to: '/reportes', label: 'Reportes', icon: BarChart3 },
      { to: '/alertas', label: 'Alertas', icon: Bell },
      { to: '/contabilidad', label: 'Contabilidad', icon: Calculator },
      { to: '/mis-clientes-contables', label: 'Mis clientes contables', icon: Briefcase },
      { to: '/nomina', label: 'Nómina', icon: Users2 },
    ],
  },
  {
    titulo: 'Sistema',
    items: [
      { to: '/administracion', label: 'Administración', icon: Users },
      { to: '/configuracion', label: 'Configuración', icon: Settings },
    ],
  },
];

export function Sidebar({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const esSuperadmin = useAuthStore((state) => state.esSuperadmin);
  const esAdministradorTotal = useAuthStore((state) => state.esAdministradorTotal);
  const permisos = useAuthStore((state) => state.permisos);
  const { data: miPlan } = useMiPlan();

  const gruposVisibles = NAV_GROUPS_DEF.map((grupo) => ({
    ...grupo,
    items: grupo.items.filter((item) => {
      if (esSuperadmin) return true;
      // El administrador general de la empresa siempre ve todo lo que el PLAN permite,
      // sin depender de si el permiso puntual quedó bien sincronizado en su rol.
      const tienePermiso = esAdministradorTotal || puedeVerRuta(permisos, item.to);
      return tienePermiso && incluidaEnPlan(miPlan?.rutasHabilitadas, item.to);
    }),
  })).filter((grupo) => grupo.items.length > 0);

  return (
    <>
      {abierto && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onCerrar} aria-hidden="true" />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col bg-ink-800 text-ink-100 transition-transform duration-200 md:static md:z-auto md:flex md:translate-x-0 ${
          abierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between gap-2 px-6">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-bold tracking-tight">
              <span className="text-white">SIC</span>
              <span className="text-sicom-greenLight">OM</span>
            </span>
            <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-300">
              Beta
            </span>
          </div>
          <button onClick={onCerrar} className="rounded p-1 text-ink-300 hover:text-white md:hidden">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
          {gruposVisibles.map((grupo, i) => (
            <div key={grupo.titulo ?? `grupo-${i}`}>
              {grupo.titulo && (
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                  {grupo.titulo}
                </p>
              )}
              <div className="space-y-1">
                {grupo.items.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={onCerrar}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-ink-700 text-white'
                          : 'text-ink-300 hover:bg-ink-700/60 hover:text-white'
                      }`
                    }
                  >
                    <Icon size={18} strokeWidth={2} />
                    {label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}

          {esSuperadmin && (
            <div>
              <div className="mb-2 border-t border-ink-700" />
              <NavLink
                to="/plataforma"
                onClick={onCerrar}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-amber-400/20 text-amber-300'
                      : 'text-amber-400/80 hover:bg-amber-400/10 hover:text-amber-300'
                  }`
                }
              >
                <ShieldAlert size={18} strokeWidth={2} />
                Plataforma
              </NavLink>
            </div>
          )}
        </nav>

        <div className="border-t border-ink-700 px-6 py-4 text-xs text-ink-400">
          Retail Management System
        </div>
      </aside>
    </>
  );
}
