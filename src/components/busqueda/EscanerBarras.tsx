import { useEffect, useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

export function EscanerBarras({ alLeer }: { alLeer: (codigo: string) => void }) {
  const [abierto, abrir] = useState(false);
  const [error, setError] = useState('');
  const video = useRef<HTMLVideoElement>(null);
  const callback = useRef(alLeer);
  callback.current = alLeer;

  useEffect(() => {
    if (!abierto) return;
    let cancelado = false;
    let stream: MediaStream | undefined;
    let controles: { stop: () => void } | undefined;
    async function iniciar() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError('La cámara no está disponible. Escribe el código o usa un lector físico.');
          return;
        }
        const { BrowserMultiFormatOneDReader } = await import('@zxing/browser');
        if (cancelado) return;
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' }, aspectRatio: { ideal: 1 } },
        });
        if (cancelado || !video.current) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        controles = await new BrowserMultiFormatOneDReader().decodeFromStream(stream, video.current, (resultado, _, control) => {
          const codigo = resultado?.getText();
          if (cancelado || !codigo) return;
          cancelado = true;
          control.stop();
          stream?.getTracks().forEach(t => t.stop());
          abrir(false);
          callback.current(codigo);
        });
        if (cancelado) controles.stop();
      } catch {
        stream?.getTracks().forEach(t => t.stop());
        if (!cancelado) setError('No pudimos abrir la cámara. Revisa el permiso del navegador o escribe el código.');
      }
    }
    void iniciar();
    return () => {
      cancelado = true;
      controles?.stop();
      stream?.getTracks().forEach(t => t.stop());
    };
  }, [abierto]);

  return <>
    <button type="button" className="rounded p-2 text-ink-600 hover:bg-ink-100" title="Escanear código de barras"
      aria-label="Escanear código de barras" onClick={() => { setError(''); abrir(true); }}>
      <Camera size={19} />
    </button>
    <Modal isOpen={abierto} onClose={() => abrir(false)} title="Escanear código de barras" size="sm">
      {error ? <p role="alert" className="text-sm text-danger-500">{error}</p> : <>
        <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-xl bg-black">
          <video ref={video} playsInline muted autoPlay className="h-full w-full object-cover" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-[10%] rounded-xl border-2 border-white/90">
            <div className="absolute inset-x-3 top-1/2 border-t-2 border-red-400" />
          </div>
        </div>
        <p className="mt-3 text-center text-sm text-ink-600">Centra el código dentro del recuadro.</p>
      </>}
    </Modal>
  </>;
}
