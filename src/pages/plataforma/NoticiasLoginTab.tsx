import { useState } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import {
  useNoticiasLogin,
  useCrearNoticiaLogin,
  useActualizarNoticiaLogin,
  useEliminarNoticiaLogin,
} from '@/hooks/usePlataforma';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { getApiErrorMessage } from '@/api/errors';
import type { NoticiaLogin } from '@/api/plataforma';

const TIPO_LABELS: Record<NoticiaLogin['tipo'], string> = {
  INFO: 'Informativo',
  ADVERTENCIA: 'Advertencia',
  EXITO: 'Novedad',
};

const TIPO_TONES: Record<NoticiaLogin['tipo'], string> = {
  INFO: 'bg-ink-100 text-ink-600',
  ADVERTENCIA: 'bg-amber-100 text-amber-700',
  EXITO: 'bg-success-50 text-success-600',
};

export function NoticiasLoginTab() {
  const { data: noticias, isLoading } = useNoticiasLogin();
  const crear = useCrearNoticiaLogin();
  const actualizar = useActualizarNoticiaLogin();
  const eliminar = useEliminarNoticiaLogin();

  const [mostrarForm, setMostrarForm] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [tipo, setTipo] = useState<NoticiaLogin['tipo']>('INFO');
  const [error, setError] = useState<string | null>(null);

  async function handleCrear() {
    setError(null);
    if (!mensaje.trim()) {
      setError('El mensaje es obligatorio');
      return;
    }
    try {
      await crear.mutateAsync({ mensaje, tipo });
      setMensaje('');
      setTipo('INFO');
      setMostrarForm(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo crear la noticia'));
    }
  }

  return (
    <div>
      <p className="text-sm text-ink-400">
        Se muestran en la pantalla de login para TODAS las empresas que usan el sistema. Úsalas para avisos de
        mantenimiento, nuevas funciones, etc.
      </p>

      <div className="mt-4">
        {!mostrarForm ? (
          <button
            onClick={() => setMostrarForm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700"
          >
            <Plus size={16} />
            Nueva noticia
          </button>
        ) : (
          <div className="rounded-lg border border-ink-100 bg-ink-50 p-4">
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-600">Mensaje</span>
                <input
                  className="input"
                  placeholder="Ej: Mantenimiento programado el sábado de 2am a 4am"
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  maxLength={500}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-600">Tipo</span>
                <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value as NoticiaLogin['tipo'])}>
                  <option value="INFO">Informativo</option>
                  <option value="ADVERTENCIA">Advertencia</option>
                  <option value="EXITO">Novedad</option>
                </select>
              </label>
            </div>
            {error && <p className="mt-2 text-xs text-danger-500">{error}</p>}
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => {
                  setMostrarForm(false);
                  setError(null);
                }}
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
                Publicar
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4">
        {isLoading ? (
          <LoadingState />
        ) : noticias && noticias.length > 0 ? (
          <div className="space-y-2">
            {noticias.map((n) => (
              <div
                key={n.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-ink-100 bg-white px-4 py-3 shadow-card"
              >
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${TIPO_TONES[n.tipo]}`}>
                    {TIPO_LABELS[n.tipo]}
                  </span>
                  <p className={`text-sm ${n.activa ? 'text-ink-700' : 'text-ink-300 line-through'}`}>{n.mensaje}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => actualizar.mutate({ id: n.id, data: { mensaje: n.mensaje, tipo: n.tipo, activa: !n.activa } })}
                    className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-50"
                  >
                    {n.activa ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => eliminar.mutate(n.id)}
                    title="Eliminar"
                    className="rounded-lg p-1.5 text-ink-300 hover:bg-danger-50 hover:text-danger-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Sin noticias publicadas" description="Crea una para que aparezca en la pantalla de login." />
        )}
      </div>
    </div>
  );
}
