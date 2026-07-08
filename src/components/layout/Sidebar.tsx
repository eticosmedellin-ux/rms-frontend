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
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/inventario', label: 'Inventario', icon: Package },
  { to: '/compras', label: 'Compras', icon: ShoppingCart },
  { to: '/pos', label: 'Punto de venta', icon: Store },
  { to: '/gastos', label: 'Gastos', icon: Receipt },
  { to: '/reportes', label: 'Reportes', icon: BarChart3 },
  { to: '/alertas', label: 'Alertas', icon: Bell },
  { to: '/administracion', label: 'Administración', icon: Users },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
];

export function Sidebar() {
  const esSuperadmin = useAuthStore((state) => state.esSuperadmin);

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-ink-800 text-ink-100 md:flex">
      <div className="flex h-16 items-center gap-2 px-6">
        <span className="font-display text-lg font-semibold tracking-tight text-white">
          RMS
        </span>
        <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-300">
          Beta
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
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

        {esSuperadmin && (
          <>
            <div className="my-2 border-t border-ink-700" />
            <NavLink
              to="/plataforma"
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
          </>
        )}
      </nav>

      <div className="border-t border-ink-700 px-6 py-4 text-xs text-ink-400">
        Retail Management System
      </div>
    </aside>
  );
}
