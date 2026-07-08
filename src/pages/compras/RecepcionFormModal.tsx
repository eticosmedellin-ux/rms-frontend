import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { DetalleLineasEditor, type LineaDetalle } from '@/components/ui/DetalleLineasEditor';
import { useRegistrarRecepcion } from '@/hooks/useCompras';
import { getApiErrorMessage } from '@/api/errors';
import type { OrdenCompra } from '@/types/compras';
import { Loader2 } from 'lucide-react';

interface RecepcionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  orden: OrdenCompra | null;
}

export function RecepcionFormModal({ isOpen, onClose, orden }: RecepcionFormModalProps) {
  const registrar = useRegistrarRecepcion();
  const [lineas, setLineas] = useState<LineaDetalle[]>([{ productoId: '', cantidad: '', costoUnitario: '' }]);
  const [error, setError] = useState<string | null>(null);

  if (!orden) return null;

  async function handleSubmit() {
    setError(null);
    const detallesValidos = lineas.filter((l) => l.productoId !== '' && l.cantidad !== '' && l.costoUnitario !== '');
    if (detallesValidos.length === 0) {
      setError('Agrega al menos un producto con cantidad y costo unitario');
      return;
    }

    try {
      await registrar.mutateAsync({
        ordenId: orden.id,
        sucursalId: orden.sucursalId,
        detalles: detallesValidos.map((l) => ({
          productoId: Number(l.productoId),
          cantidadRecibida: Number(l.cantidad),
          costoUnitario: Number(l.costoUnitario),
        })),
      });
      setLineas([{ productoId: '', cantidad: '', costoUnitario: '' }]);
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo registrar la recepción'));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Recibir mercancía — orden ${orden.numero}`} size="lg">
      <div className="space-y-4">
        <p className="text-sm text-ink-500">
          Pedido original: {orden.detalles.map((d) => `${d.producto} (${d.cantidadPedida})`).join(', ')}
        </p>

        <DetalleLineasEditor lineas={lineas} onChange={setLineas} labelCantidad="Cant. recibida" />

        {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={registrar.isPending}
            className="flex items-center gap-2 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
          >
            {registrar.isPending && <Loader2 size={16} className="animate-spin" />}
            Confirmar recepción
          </button>
        </div>
      </div>
    </Modal>
  );
}
