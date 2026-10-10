import {useApariencia} from '@/features/apariencia/AparienciaProvider';
import {fondo} from '@/features/apariencia/tema';
import { useState } from 'react';
import { getApiErrorMessage } from '@/api/errors';
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
 const apariencia=useApariencia();
  const [estacion,setEstacion]=useState('TODAS');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const { data: comandas, isLoading } = useComandasActivas();
  const cambiarEstadoItem = useCambiarEstadoItem();

  const items = (comandas ?? [])
    .flatMap((c) =>
      c.items
        .filter((i) => i.estado !== 'ENTREGADO' && (estacion==='TODAS'||(i.estacion||'COCINA')===estacion))
        .map((i) => ({ ...i, mesaNumero: c.mesaNumero, comandaId: c.id }))
    )
    .sort((a, b) => a.id - b.id);

  return (
    <div style={apariencia.activo?fondo(apariencia.sistema):undefined} className="sicom-sistema min-h-screen bg-ink-900 text-white">
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
        <select className="mb-3 rounded bg-ink-800 p-2" value={estacion} onChange={e=>setEstacion(e.target.value)}><option value="TODAS">Todas las estaciones</option>{[...new Set((comandas||[]).flatMap(c=>c.items.map(i=>i.estacion||'COCINA')))].sort().map(s=><option key={s} value={s}>{s}</option>)}</select>
        {error && <p role="alert" className="mb-3 text-red-300">{error}</p>}
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
                {item.motivoCancelacion && <p className="mt-1 text-sm text-red-300">Cancelación: {item.motivoCancelacion}</p>}
                {item.creadoEn && <p className="text-xs text-ink-300">Recibido: {new Date(item.creadoEn).toLocaleTimeString('es-CO')}</p>}
                {item.notas && <p className="mt-1 text-sm text-amber-300">{item.notas}</p>}
                {SIGUIENTE[item.estado] && (
                  <button
                    onClick={() => cambiarEstadoItem.mutate({ comandaId: item.comandaId, itemId: item.id, estado: SIGUIENTE[item.estado]! }, {onError: err => setError(getApiErrorMessage(err, 'No se pudo actualizar el pedido'))})}
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
