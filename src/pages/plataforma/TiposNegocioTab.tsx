import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, Loader2 } from 'lucide-react';
import {
  useTiposNegocio,
  useCrearTipoNegocio,
  useActualizarTipoNegocio,
  useDesactivarTipoNegocio,
  useAgregarModuloTipoNegocio,
  useEliminarModuloTipoNegocio,
} from '@/hooks/usePlataforma';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { getApiErrorMessage } from '@/api/errors';
import type { TipoNegocio } from '@/api/plataforma';

export function TiposNegocioTab() {
  const { data: tipos, isLoading } = useTiposNegocio();
  const crear = useCrearTipoNegocio();
  const [expandidoId, setExpandidoId] = useState<number | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleCrear() {
    setError(null);
    if (!nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    try {
      await crear.mutateAsync({ nombre, descripcion: descripcion || undefined });
      setNombre('');
      setDescripcion('');
      setMostrarForm(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo crear el tipo de negocio'));
    }
  }

  return (
    <div>
      <p className="text-sm text-ink-400">
        Catálogo de tipos de negocio y los módulos que cada uno activa automáticamente cuando una empresa nueva se
        registra eligiéndolo.
      </p>

      <div className="mt-4">
        {!mostrarForm ? (
          <button
            onClick={() => setMostrarForm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700"
          >
            <Plus size={16} />
            Nuevo tipo de negocio
          </button>
        ) : (
          <div className="rounded-lg border border-ink-100 bg-ink-50 p-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-600">Nombre</span>
                <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-600">Descripción (opcional)</span>
                <input className="input" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
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
              <TipoNegocioRow
                key={t.id}
                tipo={t}
                expandido={expandidoId === t.id}
                onToggle={() => setExpandidoId(expandidoId === t.id ? null : t.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="Sin tipos de negocio en el catálogo" />
        )}
      </div>
    </div>
  );
}

function TipoNegocioRow({
  tipo,
  expandido,
  onToggle,
}: {
  tipo: TipoNegocio;
  expandido: boolean;
  onToggle: () => void;
}) {
  const actualizar = useActualizarTipoNegocio();
  const desactivar = useDesactivarTipoNegocio();
  const agregarModulo = useAgregarModuloTipoNegocio();
  const eliminarModulo = useEliminarModuloTipoNegocio();

  const [moduloClave, setModuloClave] = useState('');
  const [moduloEtiqueta, setModuloEtiqueta] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleAgregarModulo() {
    setError(null);
    if (!moduloClave.trim() || !moduloEtiqueta.trim()) {
      setError('Completa clave y etiqueta del módulo');
      return;
    }
    try {
      await agregarModulo.mutateAsync({ tipoNegocioId: tipo.id, data: { moduloClave: moduloClave.trim(), moduloEtiqueta: moduloEtiqueta.trim() } });
      setModuloClave('');
      setModuloEtiqueta('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo agregar el módulo'));
    }
  }

  return (
    <div className="rounded-xl border border-ink-100 bg-white shadow-card">
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <button onClick={onToggle} className="flex flex-1 items-center gap-2 text-left">
          {expandido ? <ChevronUp size={16} className="text-ink-400" /> : <ChevronDown size={16} className="text-ink-400" />}
          <div>
            <p className={`text-sm font-medium ${tipo.activo ? 'text-ink-800' : 'text-ink-300 line-through'}`}>{tipo.nombre}</p>
            {tipo.descripcion && <p className="text-xs text-ink-400">{tipo.descripcion}</p>}
          </div>
        </button>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs text-ink-500">{tipo.modulos.length} módulos</span>
          <button
            onClick={() => actualizar.mutate({ id: tipo.id, data: { nombre: tipo.nombre, activo: !tipo.activo } })}
            className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-50"
          >
            {tipo.activo ? 'Desactivar' : 'Activar'}
          </button>
        </div>
      </div>

      {expandido && (
        <div className="border-t border-ink-100 px-4 py-3">
          <div className="space-y-1.5">
            {tipo.modulos.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-1.5 text-xs">
                <div>
                  <span className="font-medium text-ink-700">{m.moduloEtiqueta}</span>{' '}
                  <span className="font-mono text-ink-400">({m.moduloClave})</span>
                  {m.esFuturo && (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                      Futuro — Parte VI
                    </span>
                  )}
                </div>
                <button
                  onClick={() => eliminarModulo.mutate(m.id)}
                  className="rounded p-1 text-ink-300 hover:text-danger-500"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {tipo.modulos.length === 0 && <p className="text-xs text-ink-400">Sin módulos asociados todavía.</p>}
          </div>

          <div className="mt-3 grid grid-cols-[1fr_1fr_auto] items-end gap-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-ink-500">Clave (ruta o clave futura)</span>
              <input
                className="input text-xs"
                placeholder="ej: combos o modulo-restaurante"
                value={moduloClave}
                onChange={(e) => setModuloClave(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-ink-500">Etiqueta</span>
              <input className="input text-xs" value={moduloEtiqueta} onChange={(e) => setModuloEtiqueta(e.target.value)} />
            </label>
            <button
              onClick={handleAgregarModulo}
              disabled={agregarModulo.isPending}
              className="flex items-center gap-1 rounded-lg bg-ink-800 px-3 py-2 text-xs font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
            >
              {agregarModulo.isPending && <Loader2 size={13} className="animate-spin" />}
              Agregar
            </button>
          </div>
          {error && <p className="mt-1.5 text-xs text-danger-500">{error}</p>}
          <p className="mt-1.5 text-[11px] text-ink-400">
            Si la clave coincide con una ruta real del sistema (ej. "combos", "cuentas-por-cobrar"), se activa
            automáticamente para las empresas nuevas que elijan este tipo. Si no coincide con ninguna, queda marcada
            como "Futuro" para cuando se construya en la Parte VI.
          </p>
        </div>
      )}
    </div>
  );
}
