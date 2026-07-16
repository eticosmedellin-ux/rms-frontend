import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { useTiposServicio, useCrearTipoServicio, useActualizarTipoServicio } from '@/hooks/useServicios';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { getApiErrorMessage } from '@/api/errors';

function formatoMoneda(v: number | null) {
  if (v === null) return '—';
  return v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

export function TiposServicioTab() {
  const { data: tipos, isLoading } = useTiposServicio();
  const crear = useCrearTipoServicio();
  const actualizar = useActualizarTipoServicio();

  const [mostrarForm, setMostrarForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [duracionMinutos, setDuracionMinutos] = useState('30');
  const [precio, setPrecio] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleCrear() {
    setError(null);
    if (!nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    try {
      await crear.mutateAsync({
        nombre,
        duracionMinutos: duracionMinutos ? Number(duracionMinutos) : undefined,
        precio: precio ? Number(precio) : undefined,
      });
      setNombre('');
      setDuracionMinutos('30');
      setPrecio('');
      setMostrarForm(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo crear el tipo de servicio'));
    }
  }

  return (
    <div>
      <p className="text-sm text-ink-400">Catálogo de servicios que ofreces — se usan al agendar citas.</p>

      <div className="mt-4">
        {!mostrarForm ? (
          <button
            onClick={() => setMostrarForm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700"
          >
            <Plus size={16} />
            Nuevo tipo de servicio
          </button>
        ) : (
          <div className="rounded-lg border border-ink-100 bg-ink-50 p-4">
            <div className="grid grid-cols-3 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-600">Nombre</span>
                <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-600">Duración (min)</span>
                <input type="number" className="input" value={duracionMinutos} onChange={(e) => setDuracionMinutos(e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-600">Precio (opcional)</span>
                <input type="number" className="input" value={precio} onChange={(e) => setPrecio(e.target.value)} />
              </label>
            </div>
            {error && <p className="mt-2 text-xs text-danger-500">{error}</p>}
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => setMostrarForm(false)}
                className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleCrear}
                disabled={crear.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
              >
                {crear.isPending && <Loader2 size={13} className="animate-spin" />}
                Crear
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4">
        {isLoading ? (
          <LoadingState />
        ) : tipos && tipos.length > 0 ? (
          <div className="space-y-2">
            {tipos.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-xl border border-ink-100 bg-white px-4 py-3 shadow-card">
                <div>
                  <p className={`text-sm font-medium ${t.activo ? 'text-ink-800' : 'text-ink-300 line-through'}`}>{t.nombre}</p>
                  <p className="text-xs text-ink-400">
                    {t.duracionMinutos ?? '—'} min · {formatoMoneda(t.precio)}
                  </p>
                </div>
                <button
                  onClick={() => actualizar.mutate({ id: t.id, data: { nombre: t.nombre, activo: !t.activo } })}
                  className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-50"
                >
                  {t.activo ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Sin tipos de servicio" description="Crea el primero para poder agendar citas." />
        )}
      </div>
    </div>
  );
}
