import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, UtensilsCrossed, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useMesas, useCambiarEstadoMesa } from '@/hooks/useRestaurante';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { ComandaModal } from '@/pages/restaurante/ComandaModal';
import type { Mesa } from '@/api/restaurante';

const ESTADO_TONOS: Record<Mesa['estado'], string> = {
  LIBRE: 'border-success-400 bg-success-50',
  OCUPADA: 'border-amber-400 bg-amber-50',
  RESERVADA: 'border-ink-300 bg-ink-50',
  LIMPIEZA: 'border-blue-300 bg-blue-50',
};

const ESTADO_LABELS: Record<Mesa['estado'], string> = {
  LIBRE: 'Libre',
  OCUPADA: 'Ocupada',
  RESERVADA: 'Reservada',
  LIMPIEZA: 'Limpieza',
};

/** App simplificada para meseros — pantalla completa, solo mesas y comandas, sin el
 *  menú administrativo (reportes, configuración, etc.). Ideal para dejar en el celular
 *  de cada mesero o en una tablet mostrador. */
export default function AppMeseroPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const { data: mesas, isLoading } = useMesas();
  const cambiarEstadoMesa = useCambiarEstadoMesa();
  const [mesaSeleccionada, setMesaSeleccionada] = useState<Mesa | null>(null);

  function manejarClic(m: Mesa) {
    if (m.estado === 'LIMPIEZA') {
      cambiarEstadoMesa.mutate({ id: m.id, estado: 'LIBRE' });
      return;
    }
    setMesaSeleccionada(m);
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="flex items-center justify-between border-b border-ink-100 bg-white px-4 py-3 sm:px-6">
        <p className="flex items-center gap-2 font-display text-lg font-bold text-ink-800">
          <UtensilsCrossed size={22} />
          Mesero
        </p>
        <button
          onClick={() => {
            logout();
            navigate('/login', { replace: true });
          }}
          className="flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-sm font-medium text-ink-600 hover:border-danger-500 hover:text-danger-500"
        >
          <LogOut size={16} />
          Salir
        </button>
      </header>

      <div className="p-4 sm:p-6">
        {isLoading ? (
          <LoadingState />
        ) : mesas && mesas.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {mesas.map((m) => (
              <button
                key={m.id}
                onClick={() => manejarClic(m)}
                className={`rounded-2xl border-2 p-5 text-left shadow-card active:scale-[0.98] ${ESTADO_TONOS[m.estado]}`}
              >
                <p className="font-display text-2xl font-bold text-ink-800">Mesa {m.numero}</p>
                <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-ink-500">{ESTADO_LABELS[m.estado]}</p>
                {m.zona && <p className="mt-1 text-xs text-ink-400">{m.zona}</p>}
                {m.estado === 'LIMPIEZA' && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-blue-600">
                    <Sparkles size={12} />
                    Toca para liberar
                  </p>
                )}
              </button>
            ))}
          </div>
        ) : (
          <EmptyState title="Sin mesas configuradas" />
        )}
      </div>

      <ComandaModal isOpen={mesaSeleccionada !== null} onClose={() => setMesaSeleccionada(null)} mesa={mesaSeleccionada} />
    </div>
  );
}
