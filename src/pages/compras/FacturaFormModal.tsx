import {useSucursales} from '@/hooks/useSucursales';
import {useCajaAbierta} from '@/hooks/usePos';
import {usePosStore} from '@/stores/posStore';
import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { DetalleLineasEditor, type LineaDetalle } from '@/components/ui/DetalleLineasEditor';
import { useRegistrarFactura } from '@/hooks/useCompras';
import { getApiErrorMessage } from '@/api/errors';
import { Loader2 } from 'lucide-react';

import type { OrdenCompra } from '@/types/compras';

interface FacturaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  proveedorId: number;
  orden?: OrdenCompra | null;
}

export function FacturaFormModal({ isOpen, onClose, proveedorId, orden }: FacturaFormModalProps) {
  const {sucursalId}=usePosStore(); const {data:caja}=useCajaAbierta(sucursalId);
  const [metodoPago,setMetodoPago]=useState('EFECTIVO'); const [montoInicial,setMontoInicial]=useState('0');
  const {data:sucursales}=useSucursales(); const [recibirAhora,setRecibirAhora]=useState(false); const [sucursalRecepcion,setSucursalRecepcion]=useState<number|''>('');
  const registrar = useRegistrarFactura();
  const [numeroFactura, setNumeroFactura] = useState('');
  const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().slice(0, 10));
  const [esCredito, setEsCredito] = useState(false);
  const [lineas, setLineas] = useState<LineaDetalle[]>([{ productoId: '', cantidad: '', costoUnitario: '' }]);
  const [error, setError] = useState<string | null>(null);

  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [impuestos, setImpuestos] = useState('0');
  useEffect(() => {
    if (isOpen) {
      setNumeroFactura(''); setError(null);
      setLineas(orden ? orden.detalles.filter(d => d.cantidadRecibida > (d.cantidadFacturada ?? 0)).map(d => ({productoId: d.productoId, cantidad: String(d.cantidadRecibida - (d.cantidadFacturada ?? 0)), costoUnitario: String(d.costoUnitarioEstimado)})) : [{productoId:'',cantidad:'',costoUnitario:''}]);
    }
  }, [isOpen, orden]);
  async function handleSubmit() {
    setError(null);
    const detallesValidos = lineas.filter((l) => l.productoId !== '' && l.cantidad !== '' && l.costoUnitario !== '');
    if (detallesValidos.length === 0) {
      setError('Agrega al menos un producto con cantidad y costo unitario');
      return;
    }

    if(recibirAhora && !sucursalRecepcion){setError('Selecciona la sucursal de recepción');return;}
    try {
      await registrar.mutateAsync({
        proveedorId,
        ordenId: orden?.id,
        fechaVencimiento: fechaVencimiento || undefined,
        impuestos: Number(impuestos),
        metodoPago,
        cajaSesionId: metodoPago === "EFECTIVO" ? caja?.id : undefined,
        montoInicial: esCredito ? Number(montoInicial) : undefined,
        recibirEnSucursalId: recibirAhora && !orden && sucursalRecepcion ? sucursalRecepcion : undefined,
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

        <div className="grid grid-cols-2 gap-4"><label>Medio de pago<select className="input" value={metodoPago} onChange={e=>setMetodoPago(e.target.value)}><option value="EFECTIVO">Efectivo de caja abierta</option><option value="TRANSFERENCIA">Transferencia</option><option value="CHEQUE">Cheque</option></select></label>{esCredito && <label>Abono inicial<input className="input" type="number" min="0" value={montoInicial} onChange={e=>setMontoInicial(e.target.value)} /></label>}</div>
        {!esCredito && <p className="text-sm text-ink-600">Al confirmar se registrará el pago completo. La operación no envía dinero al banco.</p>}
        {!orden && <div className="rounded-lg bg-teal-50 p-3"><label><input type="checkbox" checked={recibirAhora} onChange={e=>setRecibirAhora(e.target.checked)}/> Compra rápida: recibir esta mercancía al confirmar</label>{recibirAhora&&<select className="input mt-2" value={sucursalRecepcion} onChange={e=>setSucursalRecepcion(e.target.value?Number(e.target.value):'')}><option value="">Sucursal de recepción</option>{sucursales?.map(s=><option key={s.id} value={s.id}>{s.nombre}</option>)}</select>}<p className="text-xs text-ink-500">Actívalo solo si esta mercancía todavía no ingresó al inventario.</p></div>}
        {orden && <p className="text-sm text-ink-600">Factura vinculada a {orden.numero}. Verifica las cantidades facturadas por el proveedor; los costos son estimados.</p>}
        <div className="grid grid-cols-2 gap-4">
          <label>Vencimiento<input type="date" className="input" value={fechaVencimiento} onChange={e=>setFechaVencimiento(e.target.value)} /></label>
          <label>Impuestos de la factura<input type="number" min="0" className="input" value={impuestos} onChange={e=>setImpuestos(e.target.value)} /></label>
        </div>
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
