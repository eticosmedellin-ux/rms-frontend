import { useState } from 'react';
import { HelpCircle, X, ArrowLeft, RotateCcw, MessageCircleWarning, CheckCircle2 } from 'lucide-react';
import { useRaizAyuda, useNodoAyuda, useRegistrarConsultaSinRespuesta } from '@/hooks/useAyuda';
import { LoadingState } from '@/components/ui/States';

/** Convierte una URL de YouTube normal en su versión "embed" para poder mostrarla dentro
 *  del panel; si no es de YouTube, se muestra como enlace simple. */
function urlIncrustable(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export function AsistenteAyuda() {
  const [abierto, setAbierto] = useState(false);
  const [nodoActualId, setNodoActualId] = useState<number | null>(null);
  const [pila, setPila] = useState<{ id: number; titulo: string }[]>([]);
  const [avisado, setAvisado] = useState(false);

  const { data: raiz, isLoading: cargandoRaiz } = useRaizAyuda(abierto && nodoActualId === null);
  const { data: nodoNavegado, isLoading: cargandoNodo } = useNodoAyuda(nodoActualId);
  const registrarSinRespuesta = useRegistrarConsultaSinRespuesta();

  const nodo = nodoActualId === null ? raiz : nodoNavegado;
  const cargando = nodoActualId === null ? cargandoRaiz : cargandoNodo;

  function abrir() {
    setAbierto(true);
    setNodoActualId(null);
    setPila([]);
    setAvisado(false);
  }

  function cerrar() {
    setAbierto(false);
  }

  function elegirOpcion(destinoId: number) {
    if (nodo) setPila((prev) => [...prev, { id: nodo.id, titulo: nodo.titulo }]);
    setNodoActualId(destinoId);
    setAvisado(false);
  }

  function volverAtras() {
    if (pila.length === 0) {
      setNodoActualId(null);
      return;
    }
    const anterior = pila[pila.length - 1];
    setPila((prev) => prev.slice(0, -1));
    setNodoActualId(anterior.id === raiz?.id ? null : anterior.id);
  }

  function reiniciar() {
    setNodoActualId(null);
    setPila([]);
    setAvisado(false);
  }

  function rutaResumen(): string {
    const nombres = [...pila.map((p) => p.titulo), nodo?.titulo ?? ''];
    return nombres.filter(Boolean).join(' > ');
  }

  async function avisarSoporte() {
    await registrarSinRespuesta.mutateAsync({ rutaResumen: rutaResumen() });
    setAvisado(true);
  }

  const esRespuestaVacia = nodo?.tipo === 'RESPUESTA' && !nodo.contenido && !nodo.videoUrl;
  const video = nodo?.videoUrl ? urlIncrustable(nodo.videoUrl) : null;

  return (
    <>
      <button
        onClick={abrir}
        title="Asistente de ayuda"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-ink-800 text-white shadow-lg hover:bg-ink-700"
      >
        <HelpCircle size={26} />
      </button>

      {abierto && (
        <div className="fixed bottom-24 right-6 z-40 flex max-h-[70vh] w-96 flex-col rounded-xl border border-ink-100 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
            <div className="flex items-center gap-2">
              {(pila.length > 0 || nodoActualId !== null) && (
                <button onClick={volverAtras} className="rounded-lg p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700">
                  <ArrowLeft size={16} />
                </button>
              )}
              <span className="font-display text-sm font-semibold text-ink-800">Asistente de ayuda</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={reiniciar} title="Volver al inicio" className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700">
                <RotateCcw size={15} />
              </button>
              <button onClick={cerrar} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {cargando || !nodo ? (
              <LoadingState />
            ) : nodo.tipo === 'PREGUNTA' ? (
              <div>
                <p className="mb-3 text-sm font-medium text-ink-800">{nodo.titulo}</p>
                <div className="space-y-2">
                  {nodo.opciones.map((op) => (
                    <button
                      key={op.id}
                      onClick={() => elegirOpcion(op.nodoDestinoId)}
                      className="block w-full rounded-lg border border-ink-100 px-3 py-2 text-left text-sm text-ink-700 hover:border-ink-300 hover:bg-ink-50"
                    >
                      {op.etiqueta}
                    </button>
                  ))}
                  {nodo.opciones.length === 0 && (
                    <p className="text-xs text-ink-400">Este paso todavía no tiene opciones configuradas.</p>
                  )}
                </div>
              </div>
            ) : esRespuestaVacia ? (
              <div>
                <div className="mb-3 flex items-center gap-2 text-amber-600">
                  <MessageCircleWarning size={18} />
                  <p className="text-sm font-medium">Todavía no tengo una respuesta preparada para esto.</p>
                </div>
                <p className="mb-3 text-xs text-ink-500">
                  Te recomiendo contactar directamente a soporte. Si quieres, puedes avisarles que llegaste hasta
                  aquí sin encontrar respuesta, para que la agreguen pronto.
                </p>
                {avisado ? (
                  <div className="flex items-center gap-2 rounded-lg bg-success-50 px-3 py-2 text-xs text-success-600">
                    <CheckCircle2 size={14} />
                    Avisado — gracias por ayudarnos a mejorar el asistente.
                  </div>
                ) : (
                  <button
                    onClick={avisarSoporte}
                    disabled={registrarSinRespuesta.isPending}
                    className="rounded-lg bg-ink-800 px-3 py-2 text-xs font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
                  >
                    Avisar a soporte
                  </button>
                )}
              </div>
            ) : (
              <div>
                <p className="mb-2 text-sm font-semibold text-ink-800">{nodo.titulo}</p>
                {nodo.contenido && (
                  <p className="whitespace-pre-line text-sm text-ink-700">{nodo.contenido}</p>
                )}
                {video && (
                  <div className="mt-3 aspect-video overflow-hidden rounded-lg">
                    <iframe
                      src={video}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="Video de ayuda"
                    />
                  </div>
                )}
                {!video && nodo.videoUrl && (
                  <a href={nodo.videoUrl} target="_blank" rel="noreferrer" className="mt-3 block text-xs text-ink-500 underline">
                    Ver video de ayuda
                  </a>
                )}
                <button
                  onClick={reiniciar}
                  className="mt-4 rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-50"
                >
                  Hacer otra pregunta
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
