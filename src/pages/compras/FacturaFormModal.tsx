import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { DetalleLineasEditor, type LineaDetalle } from '@/components/ui/DetalleLineasEditor';
import { useRegistrarFactura } from '@/hooks/useCompras';
import { getApiErrorMessage } from '@/api/errors';
import { Loader2 } from 'lucide-react';

interface FacturaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  proveedorId: number;
}

export function FacturaFormModal({ isOpen, onClose, proveedorId }: FacturaFormModalProps) {
  const registrar = useRegistrarFactura();
  const [numeroFactura, setNumeroFactura] = useState('');
  const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().slice(0, 10));
  const [esCredito, setEsCredito] = useState(false);
  const [lineas, setLineas] = useState<LineaDetalle[]>([{ productoId: '', cantidad: '', costoUnitario: '' }]);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    const detallesValidos = lineas.filter((l) => l.productoId !== '' && l.cantidad !== '' && l.costoUnitario !== '');
    if (detallesValidos.length === 0) {
      setError('Agrega al menos un producto con cantidad y costo unitario');
      return;
    }

    try {
      await registrar.mutateAsync({
        proveedorId,
        numeroFacturaProveedor: numeroFactura || undefined,
        fechaEmision,
        esCredito,
        detalles: detallesValidos.map((l) => ({
          productoId: Number(l.productoId),
          cantidad: Number(l.cantidad),
          costoUnitario: Number(l.costoUnitario),
        })),
      });
      setNumeroFactura('');
      setLineas([{ productoId: '', cantidad: '', costoUnitario: '' }]);
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo registrar la factura'));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar factura de compra" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">N.º de factura del proveedor</span>
            <input className="input" value={numeroFactura} onChange={(e) => setNumeroFactura(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Fecha de emisión</span>
            <input
              type="date"
              className="input"
              value={fechaEmision}
              onChange={(e) => setFechaEmision(e.target.value)}
            />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input type="checkbox" checked={esCredito} onChange={(e) => setEsCredito(e.target.checked)} />
          Es una compra a crédito (genera cuenta por pagar)
        </label>

        <DetalleLineasEditor lineas={lineas} onChange={setLineas} />

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
            Registrar factura
          </button>
        </div>
      </div>
    </Modal>
  );
}
