import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export function Topbar() {
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
    <header className="flex h-16 items-center justify-between border-b border-ink-100 bg-white px-6 dark:border-ink-700 dark:bg-ink-800">
      <div>
        <p className="text-sm font-semibold text-ink-800 dark:text-ink-100">{nombreEmpresa}</p>
        <p className="text-xs text-ink-400 dark:text-ink-400">{roles.join(' · ')}</p>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-ink-600">{nombreCompleto}</span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg border border-ink-100 px-3 py-1.5 text-sm font-medium text-ink-600 transition-colors hover:border-danger-500 hover:text-danger-500"
        >
          <LogOut size={16} />
          Salir
        </button>
      </div>
    </header>
  );
}
