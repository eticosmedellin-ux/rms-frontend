import { useNavigate } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export function Topbar({ onAbrirMenu }: { onAbrirMenu: () => void }) {
  const navigate = useNavigate();
  const nombreCompleto = useAuthStore((state) => state.nombreCompleto);
  const nombreEmpresa = useAuthStore((state) => state.nombreEmpresa);
  const roles = useAuthStore((state) => state.roles);
  const logout = useAuthStore((state) => state.logout);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="flex h-16 items-center justify-between gap-2 border-b border-ink-100 bg-white px-3 dark:border-ink-700 dark:bg-ink-800 sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <button onClick={onAbrirMenu} className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-50 md:hidden">
          <Menu size={22} />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink-800 dark:text-ink-100">{nombreEmpresa}</p>
          <p className="truncate text-xs text-ink-400 dark:text-ink-400">{roles.join(' · ')}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <span className="hidden text-sm text-ink-600 sm:inline">{nombreCompleto}</span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg border border-ink-100 px-2.5 py-1.5 text-sm font-medium text-ink-600 transition-colors hover:border-danger-500 hover:text-danger-500 sm:px-3"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}
