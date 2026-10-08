import {useQuery} from '@tanstack/react-query';
import {apiClient} from '@/api/client';
import {Modal} from '@/components/ui/Modal';
interface Registro {id:number;fecha?:string;fecha_emision?:string;responsable?:string;numero_factura_proveedor?:string;total?:number;saldo_pendiente?:number;estado?:string;monto?:number;metodo_pago?:string}
export function HistorialOrden({id,onClose}:{id:number;onClose:()=>void}){
 const {data,isLoading,isError}=useQuery({queryKey:['historial-orden',id],queryFn:async()=>(await apiClient.get<{recepciones:Registro[];facturas:Registro[];pagos:Registro[]}>(`/ordenes-compra/${id}/historial`)).data});
 return <Modal isOpen={true} onClose={onClose} title="Seguimiento de la compra" size="lg">{isLoading?<p>Cargando…</p>:isError?<p>No se pudo consultar el historial.</p>:<div className="space-y-5">{(['recepciones','facturas','pagos'] as const).map(tipo=><section key={tipo}><h3 className="font-semibold capitalize">{tipo}</h3>{data?.[tipo].length===0?<p className="text-sm text-ink-400">Sin registros</p>:data?.[tipo].map(r=><div className="border-t py-2 text-sm" key={r.id}><p>{r.fecha??r.fecha_emision} · {r.numero_factura_proveedor??`#${r.id}`} {r.estado} {r.responsable}</p>{r.total!=null&&<p>Total: ${Number(r.total).toLocaleString('es-CO')} · Saldo: ${Number(r.saldo_pendiente??0).toLocaleString('es-CO')}</p>}{r.monto!=null&&<p>{r.metodo_pago}: ${Number(r.monto).toLocaleString('es-CO')}</p>}</div>)}</section>)}</div>}</Modal>
}
