import { useRef, useState, type ChangeEvent } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { comprimirImagen } from '@/api/imagen';
import { useActualizarImagenProducto } from '@/hooks/useInventario';
import { getApiErrorMessage } from '@/api/errors';
import type { Producto } from '@/types/inventario';

export function ImagenProductoModal({
  isOpen,
  onClose,
  producto,
}: {
  isOpen: boolean;
  onClose: () => void;
  producto: Producto | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const actualizar = useActualizarImagenProducto();
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

  if (!producto) return null;

  async function handleArchivo(e: ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setProcesando(true);
    try {
      const dataUrl = await comprimirImagen(file);
      setPreview(dataUrl);
    } catch {
      setError('No se pudo procesar la imagen. Intenta con otra foto.');
    } finally {
      setProcesando(false);
    }
  }

  async function handleGuardar() {
    if (!preview || !producto) return;
    setError(null);
    try {
      await actualizar.mutateAsync({ id: producto.id, imagen: preview });
      handleClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo guardar la imagen'));
    }
  }

  function handleClose() {
    setPreview(null);
    setError(null);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Foto de ${producto.nombre}`} size="sm">
      <div className="space-y-4">
        <div className="flex justify-center">
          {preview || producto.imagen ? (
            <img
              src={preview ?? producto.imagen ?? undefined}
              alt={producto.nombre}
              className="h-48 w-48 rounded-xl border border-ink-100 object-cover"
            />
          ) : (
            <div className="flex h-48 w-48 items-center justify-center rounded-xl border border-dashed border-ink-200 bg-ink-50 text-ink-300">
              <Camera size={32} />
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleArchivo}
        />

        <button
          onClick={() => inputRef.current?.click()}
          disabled={procesando}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-ink-200 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50 disabled:opacity-60"
        >
          {procesando ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
          {procesando ? 'Procesando…' : 'Tomar o elegir foto'}
        </button>

        {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={handleClose} className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50">
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={!preview || actualizar.isPending}
            className="flex items-center gap-2 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
          >
            {actualizar.isPending && <Loader2 size={16} className="animate-spin" />}
            Guardar foto
          </button>
        </div>
      </div>
    </Modal>
  );
}
