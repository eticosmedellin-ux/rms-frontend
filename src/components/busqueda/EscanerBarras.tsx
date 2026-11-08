import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Camera, X } from 'lucide-react';

export function EscanerBarras({ alLeer, disabled }: { alLeer: (codigo: string) => void; disabled?: boolean }) {
  const [abierto, abrir] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState('');
  const video = useRef<HTMLVideoElement>(null);
  const cerrar = useRef<HTMLButtonElement>(null);
  const callback = useRef(alLeer);
  callback.current = alLeer;

  useEffect(() => {
    if (!abierto) return;
    let cancelado = false;
    let stream: MediaStream | undefined;
    let reloj: number | undefined;
    const detener = () => {
      cancelado = true;
      window.clearTimeout(reloj);
      stream?.getTracks().forEach(t => t.stop());
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); abrir(false); }
    };
    window.addEventListener('keydown', tecla, true);
    cerrar.current?.focus();
    async function iniciar() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('CAMARA_NO_DISPONIBLE');
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        const visor = video.current;
        if (cancelado || !visor) { detener(); return; }
        visor.srcObject = stream;
        await visor.play();
        if (cancelado) return;
        setListo(true);

        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        if (cancelado) return;
        const lector = new BrowserMultiFormatReader();
        const lienzo = document.createElement('canvas');
        const ctx = lienzo.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error('LECTOR_NO_DISPONIBLE');
        const leer = () => {
          if (cancelado) return;
          const { videoWidth: w, videoHeight: h } = visor;
          if (w && h && visor.readyState >= 2) {
            // El visor usa object-cover en un cuadrado: decodificar su área central visible.
            const lado = Math.round(Math.min(w, h) * 0.82);
            const salida = Math.min(lado, 800);
            if (lienzo.width !== salida || lienzo.height !== salida) {
              lienzo.width = salida;
              lienzo.height = salida;
            }
            ctx.drawImage(visor, (w - lado) / 2, (h - lado) / 2, lado, lado, 0, 0, salida, salida);
            let codigo: string | undefined;
            try { codigo = lector.decodeFromCanvas(lienzo).getText(); } catch { /* Todavía no hay un código legible. */ }
            if (codigo) {
              detener();
              abrir(false);
              callback.current(codigo);
              return;
            }
          }
          reloj = window.setTimeout(leer, 180);
        };
        reloj = window.setTimeout(leer, 350);
      } catch (e) {
        if (cancelado) return;
        detener();
        setError(e instanceof DOMException && e.name === 'NotAllowedError'
          ? 'Permite el acceso a la cámara en el navegador y vuelve a abrir el escáner.'
          : 'No se pudo iniciar la cámara. Revisa que esté disponible o escribe el código manualmente.');
      }
    }
    void iniciar();
    return () => { detener(); window.removeEventListener('keydown', tecla, true); };
  }, [abierto]);

  return <>
    <button type="button" disabled={disabled} className="rounded p-2 text-ink-600 hover:bg-ink-100 disabled:opacity-40"
      title="Escanear con cámara" aria-label="Escanear con cámara"
      onClick={() => { setError(''); setListo(false); abrir(true); }}><Camera size={19} /></button>
    {abierto && createPortal(
      <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4" onClick={() => abrir(false)}>
        <section role="dialog" aria-modal="true" aria-label="Escanear código" onClick={e => e.stopPropagation()}
          className="w-full max-w-[330px] rounded-2xl bg-white p-4 shadow-2xl">
          <header className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-ink-800">Escanear código</h2>
            <button ref={cerrar} type="button" onClick={() => abrir(false)} className="rounded p-2 hover:bg-ink-100" aria-label="Cerrar cámara"><X size={18}/></button>
          </header>
          {!error && <div className="relative mx-auto aspect-square w-full max-w-[260px] overflow-hidden rounded-xl bg-ink-900">
            <video ref={video} playsInline muted autoPlay className="absolute inset-0 h-full w-full object-cover" />
            {listo && <div aria-hidden="true" className="pointer-events-none absolute inset-[9%] overflow-hidden rounded-xl border-2 border-white/90 shadow-[0_0_0_24px_rgba(0,0,0,0.22)]">
              <style>{'@keyframes sicomEscaneo { from { top: 16%; } to { top: 84%; } } @media(prefers-reduced-motion:reduce){ .sicom-linea-escaneo { animation: none !important; top: 50% !important; } }'}</style>
              <div className="sicom-linea-escaneo absolute inset-x-2 h-0.5 bg-emerald-400 shadow-[0_0_10px_#34d399]" style={{animation:'sicomEscaneo 1.6s ease-in-out infinite alternate'}} />
            </div>}
            {!listo && <p className="absolute inset-0 grid place-items-center p-4 text-center text-sm text-white">Iniciando cámara…</p>}
          </div>}
          <p role={error ? 'alert' : 'status'} className="mt-3 text-center text-sm text-ink-600">
            {error || (listo ? 'Centra las barras o el QR dentro del recuadro.' : 'Autoriza la cámara para ver la imagen en vivo.')}
          </p>
        </section>
      </div>, document.body)}
  </>;
}
