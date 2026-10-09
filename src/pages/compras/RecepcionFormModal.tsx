import {useProductos} from '@/hooks/useInventario';
import { useState, useEffect } from 'react';
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
  const {data:productos=[]}=useProductos();
  const [lineas, setLineas] = useState<LineaDetalle[]>([{ productoId: '', cantidad: '', costoUnitario: '' }]);
  const [tecnica,setTecnica]=useState<Record<string,{lote:string;vencimiento:string;condicionesRecepcion:string;cantidadRechazada:string;motivoRechazo:string}>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && orden) {
      setLineas(orden.detalles.filter(d => d.cantidadPedida > d.cantidadRecibida).map(d => ({
        productoId: d.productoId, cantidad: String(d.cantidadPedida - d.cantidadRecibida), costoUnitario: String(d.costoUnitarioEstimado)
      })));
      setError(null);
      setTecnica({});
    }
  }, [isOpen, orden]);
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
        ordenId: orden!.id,
        sucursalId: orden!.sucursalId,
        detalles: detallesValidos.map((l) => ({
          productoId: Number(l.productoId),
          cantidadRecibida: Number(l.cantidad),
          costoUnitario: Number(l.costoUnitario),
          lote:tecnica[String(l.productoId)]?.lote||undefined,
          vencimiento:tecnica[String(l.productoId)]?.vencimiento||undefined,
          condicionesRecepcion:tecnica[String(l.productoId)]?.condicionesRecepcion,
          cantidadRechazada:Number(tecnica[String(l.productoId)]?.cantidadRechazada||0),
          motivoRechazo:tecnica[String(l.productoId)]?.motivoRechazo,
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

        <section className="border rounded p-3 space-y-3"><h3 className="font-medium">Recepción técnica y lotes</h3><p className="text-xs">Obligatorio para productos con control por lote. Cantidad recibida significa cantidad aceptada; los rechazos no entran al inventario.</p>{Array.from(new Set(lineas.filter(l=>l.productoId!=='').map(l=>String(l.productoId)))).map(id=><div key={id} className="grid sm:grid-cols-2 gap-2"><label className="text-xs sm:col-span-2">Convertir una presentación a unidades base<select className="input" value="" onChange={e=>{const p=productos.find(x=>x.id===Number(id))?.presentaciones?.find(x=>x.id===Number(e.target.value));if(p)setLineas(lineas.map(l=>String(l.productoId)===id?{...l,cantidad:String(Number(l.cantidad)*p.unidades),costoUnitario:String(Math.round(Number(l.costoUnitario)/p.unidades*100)/100)}:l));}}><option value="">Cantidad y costo ya expresados en unidades base</option>{productos.find(x=>x.id===Number(id))?.presentaciones?.map(p=><option key={p.id} value={p.id}>{p.nombre} · {p.unidades} unidades base</option>)}</select></label><strong className="text-sm sm:col-span-2">{orden.detalles.find(d=>d.productoId===Number(id))?.producto??`Producto ${id}`}</strong>{(['lote','vencimiento','condicionesRecepcion','cantidadRechazada','motivoRechazo'] as const).map(k=><label key={k} className="text-xs">{{lote:'Lote',vencimiento:'Vencimiento',condicionesRecepcion:'Condiciones de entrega',cantidadRechazada:'Cantidad rechazada',motivoRechazo:'Motivo del rechazo'}[k]}<input className="input" type={k==='vencimiento'?'date':k==='cantidadRechazada'?'number':'text'} value={tecnica[id]?.[k]??''} onChange={e=>setTecnica({...tecnica,[id]:{...(tecnica[id]??{lote:'',vencimiento:'',condicionesRecepcion:'',cantidadRechazada:'',motivoRechazo:''}),[k]:e.target.value}})}/></label>)}</div>)}</section>
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
