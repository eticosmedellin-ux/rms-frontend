import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { DetalleLineasEditor, type LineaDetalle } from '@/components/ui/DetalleLineasEditor';
import { useSucursales } from '@/hooks/useSucursales';
import { useProveedores } from '@/hooks/useCompras';
import { useCrearOrdenCompra } from '@/hooks/useCompras';
import { getApiErrorMessage } from '@/api/errors';
import { Loader2 } from 'lucide-react';

export function OrdenCompraFormModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data: sucursales } = useSucursales();
  const { data: proveedores } = useProveedores();
  const crear = useCrearOrdenCompra();

  const [sucursalId, setSucursalId] = useState('');
  const [proveedorId, setProveedorId] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [lineas, setLineas] = useState<LineaDetalle[]>([{ productoId: '', cantidad: '', costoUnitario: '' }]);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    const detallesValidos = lineas.filter((l) => l.productoId !== '' && l.cantidad !== '');
    if (!sucursalId || !proveedorId || detallesValidos.length === 0) {
      setError('Completa sucursal, proveedor y al menos un producto');
      return;
    }

    try {
      await crear.mutateAsync({
        sucursalId: Number(sucursalId),
        proveedorId: Number(proveedorId),
        observaciones: observaciones || undefined,
        detalles: detallesValidos.map((l) => ({
          productoId: Number(l.productoId),
          cantidadPedida: Number(l.cantidad),
          costoUnitarioEstimado: l.costoUnitario ? Number(l.costoUnitario) : undefined,
        })),
      });
      setSucursalId('');
      setProveedorId('');
      setObservaciones('');
      setLineas([{ productoId: '', cantidad: '', costoUnitario: '' }]);
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo crear la orden de compra'));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva orden de compra" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Sucursal</span>
            <select className="input" value={sucursalId} onChange={(e) => setSucursalId(e.target.value)}>
              <option value="">Selecciona…</option>
              {sucursales?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Proveedor</span>
            <select className="input" value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
              <option value="">Selecciona…</option>
              {proveedores?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Observaciones</span>
          <input className="input" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
        </label>

        <DetalleLineasEditor lineas={lineas} onChange={setLineas} labelCantidad="Cant. pedida" />

        {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={crear.isPending}
            className="flex items-center gap-2 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
          >
            {crear.isPending && <Loader2 size={16} className="animate-spin" />}
            Crear orden
          </button>
        </div>
      </div>
    </Modal>
  );
}
