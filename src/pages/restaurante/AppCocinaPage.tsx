import { useNavigate } from 'react-router-dom';
import { LogOut, ChefHat } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useComandasActivas, useCambiarEstadoItem } from '@/hooks/useRestaurante';
import { LoadingState, EmptyState } from '@/components/ui/States';
import type { EstadoItemComanda } from '@/api/restaurante';

const ESTADO_LABELS: Record<EstadoItemComanda, string> = {
  PENDIENTE: 'Pendiente',
  PREPARANDO: 'Preparando',
  LISTO: 'Listo',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

const SIGUIENTE: Partial<Record<EstadoItemComanda, EstadoItemComanda>> = {
  PENDIENTE: 'PREPARANDO',
  PREPARANDO: 'LISTO',
  LISTO: 'ENTREGADO',
};

/** App simplificada de Cocina/Bar — pantalla completa, sin el menú administrativo, para
 *  dejar montada en una tablet de cocina o el celular del ayudante de cocina. */
export default function AppCocinaPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const { data: comandas, isLoading } = useComandasActivas();
  const cambiarEstadoItem = useCambiarEstadoItem();

  const items = (comandas ?? [])
    .flatMap((c) =>
      c.items
        .filter((i) => i.estado !== 'CANCELADO' && i.estado !== 'ENTREGADO')
        .map((i) => ({ ...i, mesaNumero: c.mesaNumero, comandaId: c.id }))
    )
    .sort((a, b) => a.id - b.id);

  return (
    <div className="min-h-screen bg-ink-900 text-white">
      <header className="flex items-center justify-between border-b border-ink-700 px-4 py-3 sm:px-6">
        <p className="flex items-center gap-2 font-display text-lg font-bold">
          <ChefHat size={22} />
          Cocina / Bar
        </p>
        <button
          onClick={() => {
            logout();
            navigate('/login', { replace: true });
          }}
          className="flex items-center gap-1.5 rounded-lg border border-ink-600 px-3 py-1.5 text-sm font-medium text-ink-200 hover:border-danger-500 hover:text-danger-400"
        >
          <LogOut size={16} />
          Salir
        </button>
      </header>

      <div className="p-4 sm:p-6">
        {isLoading ? (
          <LoadingState />
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <div key={item.id} className="rounded-xl border border-ink-700 bg-ink-800 p-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-ink-900">Mesa {item.mesaNumero}</span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${
                      item.estado === 'PENDIENTE' ? 'bg-ink-600 text-ink-100' : 'bg-amber-400/90 text-ink-900'
                    }`}
                  >
                    {ESTADO_LABELS[item.estado]}
                  </span>
                </div>
                <p className="mt-3 font-display text-xl font-bold">
                  {item.cantidad}× {item.comboNombre ?? item.productoNombre}
                </p>
                {item.notas && <p className="mt-1 text-sm text-amber-300">{item.notas}</p>}
                {SIGUIENTE[item.estado] && (
                  <button
                    onClick={() => cambiarEstadoItem.mutate({ comandaId: item.comandaId, itemId: item.id, estado: SIGUIENTE[item.estado]! })}
                    className="mt-4 w-full rounded-xl bg-success-600 py-3 text-base font-bold text-white hover:bg-success-500 active:scale-[0.98]"
                  >
                    Marcar {ESTADO_LABELS[SIGUIENTE[item.estado]!]}
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="pt-16">
            <EmptyState title="Sin pedidos pendientes" description="Los nuevos pedidos aparecen aquí solos." />
          </div>
        )}
      </div>
    </div>
  );
}
