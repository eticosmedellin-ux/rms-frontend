import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { useMiPlan } from '@/hooks/usePlataforma';
import { useAuthStore } from '@/stores/authStore';
import { ShieldAlert } from 'lucide-react';

const MENSAJE_LICENCIA: Record<string, string> = {
  SUSPENDIDA: 'La licencia de tu empresa está suspendida temporalmente.',
  VENCIDA: 'La licencia de tu empresa venció.',
};

export function AppLayout() {
  const esSuperadmin = useAuthStore((state) => state.esSuperadmin);
  const { data: miPlan } = useMiPlan();

  if (!esSuperadmin && miPlan && miPlan.estadoLicencia !== 'ACTIVA') {
    return (
      <div className="flex h-screen items-center justify-center bg-ink-50 px-6">
        <div className="max-w-md rounded-xl border border-ink-100 bg-white p-8 text-center shadow-card">
          <ShieldAlert size={36} className="mx-auto mb-3 text-amber-500" />
          <h1 className="font-display text-lg font-semibold text-ink-800">Acceso no disponible</h1>
          <p className="mt-2 text-sm text-ink-500">
            {MENSAJE_LICENCIA[miPlan.estadoLicencia] ?? 'Tu licencia no está activa.'}
          </p>
          <p className="mt-1 text-sm text-ink-500">Contacta a tu proveedor del sistema para regularizarla.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-ink-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
