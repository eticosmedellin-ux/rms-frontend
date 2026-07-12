import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import {
  useNodosAyudaAdmin, useCrearNodoAyuda, useActualizarNodoAyuda, useEliminarNodoAyuda,
  useCrearOpcionAyuda, useEliminarOpcionAyuda, useConsultasSinRespuesta, useMarcarConsultaAtendida,
} from '@/hooks/useAyuda';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { Modal } from '@/components/ui/Modal';
import { getApiErrorMessage } from '@/api/errors';
import type { NodoAyuda } from '@/types/ayuda';

export function AyudaAdminTab() {
  const { data: nodos, isLoading } = useNodosAyudaAdmin();
  const eliminarNodo = useEliminarNodoAyuda();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<NodoAyuda | null>(null);
  const [nodoOpciones, setNodoOpciones] = useState<NodoAyuda | null>(null);

  const { data: consultas } = useConsultasSinRespuesta();
  const marcarAtendida = useMarcarConsultaAtendida();

  function abrirCrear() {
    setEditando(null);
    setModalAbierto(true);
  }
  function abrirEditar(n: NodoAyuda) {
    setEditando(n);
    setModalAbierto(true);
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="font-display text-base font-semibold text-ink-800">Árbol del asistente</h3>
            <p className="text-xs text-ink-400">
              Crea primero tus respuestas, luego las preguntas que apuntan hacia ellas.
            </p>
          </div>
          <button
            onClick={abrirCrear}
            className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700"
          >
            <Plus size={16} />
            Nuevo nodo
          </button>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : nodos && nodos.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white shadow-card">
            <table className="w-full text-sm">
              <thead className="border-b border-ink-100 bg-ink-50 text-xs text-ink-500">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium">Título</th>
                  <th className="px-4 py-3 text-left font-medium">Opciones</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {nodos.map((n) => (
                  <tr key={n.id} className="hover:bg-ink-50/60">
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          n.tipo === 'PREGUNTA' ? 'bg-sky-50 text-sky-700' : 'bg-violet-50 text-violet-700'
                        }`}
                      >
                        {n.tipo}
                      </span>
                      {n.esRaiz && (
                        <span className="ml-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                          Inicio
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-700">
                      {n.titulo || <span className="text-ink-300">(sin título — nodo "sin respuesta")</span>}
                    </td>
                    <td className="px-4 py-3 text-ink-500">
                      {n.tipo === 'PREGUNTA' ? (
                        <button onClick={() => setNodoOpciones(n)} className="text-ink-600 underline hover:text-ink-800">
                          {n.opciones.length} opción(es)
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => abrirEditar(n)} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700">
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => eliminarNodo.mutate(n.id)}
                          className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-danger-500"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="Sin nodos todavía" description="Crea el primero (normalmente empieza por una pregunta raíz)." />
        )}
      </section>

      <section>
        <h3 className="mb-3 font-display text-base font-semibold text-ink-800">Preguntas sin respuesta</h3>
        <p className="mb-3 text-xs text-ink-400">
          Cada vez que un usuario llega a un punto del árbol sin respuesta preparada y avisa, aparece aquí.
        </p>
        {consultas && consultas.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white shadow-card">
            <table className="w-full text-sm">
              <thead className="border-b border-ink-100 bg-ink-50 text-xs text-ink-500">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Empresa</th>
                  <th className="px-4 py-3 text-left font-medium">Usuario</th>
                  <th className="px-4 py-3 text-left font-medium">Ruta recorrida</th>
                  <th className="px-4 py-3 text-left font-medium">Fecha</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {consultas.map((c) => (
                  <tr key={c.id} className={`hover:bg-ink-50/60 ${c.atendida ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 text-ink-700">{c.empresaNombre}</td>
                    <td className="px-4 py-3 text-ink-500">{c.usuario}</td>
                    <td className="px-4 py-3 text-ink-600">{c.rutaResumen}</td>
                    <td className="px-4 py-3 text-ink-400">{new Date(c.fecha).toLocaleString('es-CO')}</td>
                    <td className="px-4 py-3 text-right">
                      {!c.atendida && (
                        <button
                          onClick={() => marcarAtendida.mutate(c.id)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-success-600"
                        >
                          <CheckCircle2 size={14} />
                          Marcar atendida
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="Sin preguntas sin respuesta todavía" />
        )}
      </section>

      <NodoFormModal isOpen={modalAbierto} onClose={() => setModalAbierto(false)} editando={editando} />
      <OpcionesModal nodo={nodoOpciones} nodos={nodos ?? []} onClose={() => setNodoOpciones(null)} />
    </div>
  );
}

function NodoFormModal({ isOpen, onClose, editando }: { isOpen: boolean; onClose: () => void; editando: NodoAyuda | null }) {
  const crear = useCrearNodoAyuda();
  const actualizar = useActualizarNodoAyuda();

  const [tipo, setTipo] = useState<'PREGUNTA' | 'RESPUESTA'>('PREGUNTA');
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [esRaiz, setEsRaiz] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editando) {
      setTipo(editando.tipo);
      setTitulo(editando.titulo);
      setContenido(editando.contenido ?? '');
      setVideoUrl(editando.videoUrl ?? '');
      setEsRaiz(editando.esRaiz);
    } else {
      setTipo('PREGUNTA');
      setTitulo('');
      setContenido('');
      setVideoUrl('');
      setEsRaiz(false);
    }
    setError(null);
  }, [editando, isOpen]);

  async function handleGuardar() {
    setError(null);
    if (!titulo.trim() && tipo === 'PREGUNTA') {
      setError('El título es obligatorio para una pregunta');
      return;
    }
    const data = {
      tipo,
      titulo,
      contenido: tipo === 'RESPUESTA' ? contenido || null : null,
      videoUrl: tipo === 'RESPUESTA' ? videoUrl || null : null,
      esRaiz,
    };
    try {
      if (editando) await actualizar.mutateAsync({ id: editando.id, data });
      else await crear.mutateAsync(data);
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo guardar el nodo'));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editando ? 'Editar nodo' : 'Nuevo nodo'} size="lg">
      <div className="space-y-4">
        <div className="flex gap-1 rounded-lg bg-ink-50 p-1 text-sm font-medium">
          <button
            onClick={() => setTipo('PREGUNTA')}
            className={`flex-1 rounded-md py-1.5 ${tipo === 'PREGUNTA' ? 'bg-white text-ink-800 shadow-sm' : 'text-ink-400'}`}
          >
            Pregunta (con opciones)
          </button>
          <button
            onClick={() => setTipo('RESPUESTA')}
            className={`flex-1 rounded-md py-1.5 ${tipo === 'RESPUESTA' ? 'bg-white text-ink-800 shadow-sm' : 'text-ink-400'}`}
          >
            Respuesta final
          </button>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Título</span>
          <input className="input" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          <span className="mt-1 block text-xs text-ink-400">
            {tipo === 'PREGUNTA'
              ? 'El texto de la pregunta que verá el usuario.'
              : 'El nombre corto de esta respuesta (aparece como opción en las preguntas que la usen).'}
          </span>
        </label>

        {tipo === 'RESPUESTA' && (
          <>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-700">
                Contenido (déjalo vacío para "sin respuesta preparada")
              </span>
              <textarea className="input" rows={6} value={contenido} onChange={(e) => setContenido(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-700">Video (opcional, enlace de YouTube)</span>
              <input
                className="input"
                placeholder="https://youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
            </label>
          </>
        )}

        {tipo === 'PREGUNTA' && (
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={esRaiz} onChange={(e) => setEsRaiz(e.target.checked)} className="h-4 w-4" />
            <span className="text-sm text-ink-700">Esta es la pregunta de inicio del asistente</span>
          </label>
        )}

        {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50">
            Cancelar
          </button>
          <button onClick={handleGuardar} className="rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700">
            Guardar
          </button>
        </div>
      </div>
    </Modal>
  );
}

function OpcionesModal({ nodo, nodos, onClose }: { nodo: NodoAyuda | null; nodos: NodoAyuda[]; onClose: () => void }) {
  const crearOpcion = useCrearOpcionAyuda();
  const eliminarOpcion = useEliminarOpcionAyuda();
  const [etiqueta, setEtiqueta] = useState('');
  const [destinoId, setDestinoId] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!nodo) return null;

  async function handleAgregar() {
    setError(null);
    if (!etiqueta.trim() || !destinoId) {
      setError('Completa la etiqueta y elige a qué nodo lleva');
      return;
    }
    try {
      await crearOpcion.mutateAsync({ nodoOrigenId: nodo!.id, nodoDestinoId: Number(destinoId), etiqueta });
      setEtiqueta('');
      setDestinoId('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo agregar la opción'));
    }
  }

  return (
    <Modal isOpen={nodo !== null} onClose={onClose} title={`Opciones de: ${nodo.titulo}`}>
      <div className="space-y-4">
        <div className="space-y-2">
          {nodo.opciones.map((op) => (
            <div key={op.id} className="flex items-center justify-between rounded-lg border border-ink-100 px-3 py-2 text-sm">
              <span>
                {op.etiqueta} → {nodos.find((n) => n.id === op.nodoDestinoId)?.titulo ?? `#${op.nodoDestinoId}`}
              </span>
              <button onClick={() => eliminarOpcion.mutate(op.id)} className="text-ink-300 hover:text-danger-500">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {nodo.opciones.length === 0 && <p className="text-xs text-ink-400">Sin opciones todavía.</p>}
        </div>

        <div className="border-t border-ink-100 pt-3">
          <p className="mb-2 text-xs font-medium text-ink-600">Agregar opción</p>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Texto del botón"
              value={etiqueta}
              onChange={(e) => setEtiqueta(e.target.value)}
            />
            <select className="input flex-1" value={destinoId} onChange={(e) => setDestinoId(e.target.value)}>
              <option value="">Lleva a…</option>
              {nodos
                .filter((n) => n.id !== nodo.id)
                .map((n) => (
                  <option key={n.id} value={n.id}>
                    [{n.tipo}] {n.titulo || '(sin respuesta)'}
                  </option>
                ))}
            </select>
            <button onClick={handleAgregar} className="rounded-lg bg-ink-800 px-3 py-2 text-xs font-semibold text-white hover:bg-ink-700">
              Agregar
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-danger-600">{error}</p>}
        </div>
      </div>
    </Modal>
  );
}
