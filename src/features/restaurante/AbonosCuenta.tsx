import {useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {apiClient} from '@/api/client';
import {getApiErrorMessage} from '@/api/errors';
import {useCalculoVenta,agruparLineas} from '@/features/sicom/useCalculoVenta';
import type {Comanda} from '@/api/restaurante';
interface Abono {id:number;monto:number;metodo:string;persona:string|null;referencia:string|null;revertido_en:string|null;usuario:string;item_id:number|null;cantidad_item:number|null;}
export function useAbonosCuenta(id:number|null){return useQuery({queryKey:['rest-abonos',id],queryFn:async()=>(await apiClient.get<Abono[]>(`/restaurante/operacion/comandas/${id}/abonos`)).data,enabled:!!id});}
const dinero=(n:number)=>n.toLocaleString('es-CO',{style:'currency',currency:'COP'});
export function AbonosCuenta({comanda,cajaId}:{comanda:Comanda;cajaId:number|null}){
 const client=useQueryClient();const {data:abonos,error:loadError}=useAbonosCuenta(comanda.id);
 const [modo,setModo]=useState('IMPORTE'),[monto,setMonto]=useState(''),[metodo,setMetodo]=useState('EFECTIVO'),[persona,setPersona]=useState(''),[referencia,setReferencia]=useState(''),[itemId,setItemId]=useState(''),[cantidad,setCantidad]=useState('1'),[personas,setPersonas]=useState('2'),[error,setError]=useState(''),[busy,setBusy]=useState(false),[clave,setClave]=useState(()=>crypto.randomUUID());
 const item=comanda.items.find(i=>i.id===Number(itemId));
 const calc=useCalculoVenta({detalles:item?[{productoId:item.productoId,comboId:item.comboId,cantidad:Number(cantidad)||1,precioUnitario:item.precioUnitario}]:[]},modo==='PRODUCTO'&&!!item,'restaurante');
 const total=useCalculoVenta({detalles:agruparLineas(comanda.items.filter(i=>i.estado!=='CANCELADO').map(i=>({productoId:i.productoId,comboId:i.comboId,cantidad:i.cantidad,precioUnitario:i.precioUnitario})))},comanda.items.some(i=>i.estado!=='CANCELADO'),'restaurante');
 const pagado=(abonos??[]).filter(a=>!a.revertido_en).reduce((a,b)=>a+Number(b.monto),0),saldo=(total.data?.total??0)-pagado;
 const valor=modo==='PRODUCTO'?calc.data?.total??0:Number(monto);
 async function refresh(){await Promise.all([client.invalidateQueries({queryKey:['rest-abonos',comanda.id]}),client.invalidateQueries({queryKey:['rest-cuenta',comanda.id]}),client.invalidateQueries({queryKey:['caja']}),client.invalidateQueries({queryKey:['rest-operacion']})]);}
 async function pagar(){if(!cajaId){setError('Abre caja en esta sucursal antes de registrar el abono');return;}if(modo==='PRODUCTO'&&(!calc.data||calc.isFetching)){setError('Espera el cálculo del producto');return;}setBusy(true);setError('');try{await apiClient.post(`/restaurante/operacion/comandas/${comanda.id}/abonos`,{clave,cajaSesionId:cajaId,metodo,monto:valor,persona:persona||null,referencia:referencia||null,itemId:modo==='PRODUCTO'?Number(itemId):null,cantidadItem:modo==='PRODUCTO'?Number(cantidad):null});setClave(crypto.randomUUID());setMonto('');setPersona('');setReferencia('');await refresh();}catch(e){setError(getApiErrorMessage(e,'No se pudo registrar el abono'));}finally{setBusy(false);}}
 async function revertir(a:Abono){const motivo=window.prompt('Motivo del reintegro. Requiere autorización.');if(!motivo)return;if(!cajaId){setError('Abre caja para registrar el reintegro');return;}setBusy(true);try{await apiClient.post(`/restaurante/operacion/comandas/${comanda.id}/abonos/${a.id}/revertir`,{cajaSesionId:cajaId,motivo});await refresh();}catch(e){setError(getApiErrorMessage(e,'No se pudo reintegrar'));}finally{setBusy(false);}}
 return <details className="rounded-lg border p-3"><summary className="cursor-pointer font-semibold">Abonos y división de cuenta · pagado {dinero(pagado)}</summary><div className="mt-3 space-y-3">
 <p>Saldo actual: {total.isFetching?'Calculando…':dinero(saldo)}. La cuenta permanece abierta después de un abono.</p>
 {(error||loadError||total.isError||calc.isError)&&<p role="alert" className="text-danger-600">{error||getApiErrorMessage(loadError||total.error||calc.error,'No se pudo calcular la cuenta')}</p>}
 <div className="grid gap-2 sm:grid-cols-2"><label>Dividir por<select className="input" value={modo} onChange={e=>setModo(e.target.value)}><option value="IMPORTE">Importe</option><option value="PERSONA">Persona</option><option value="PRODUCTO">Producto</option></select></label>
 <label>Medio<select className="input" value={metodo} onChange={e=>setMetodo(e.target.value)}>{['EFECTIVO','TARJETA','TRANSFERENCIA'].map(m=><option key={m}>{m}</option>)}</select></label>
 {modo==='PERSONA'&&<label>Personas para dividir el saldo<input type="number" min={1} className="input" value={personas} onChange={e=>setPersonas(e.target.value)}/><button type="button" onClick={()=>setMonto((saldo/Math.max(1,Number(personas))).toFixed(2))}>Sugerir parte igual</button></label>}
 {modo==='PRODUCTO'?<><label>Producto<select className="input" value={itemId} onChange={e=>setItemId(e.target.value)}><option value="">Selecciona</option>{comanda.items.filter(i=>i.estado!=='CANCELADO').map(i=><option key={i.id} value={i.id}>{i.cantidad} × {i.comboNombre||i.productoNombre}</option>)}</select></label><label>Cantidad<input className="input" type="number" min="0.01" step="0.01" value={cantidad} onChange={e=>setCantidad(e.target.value)}/></label><p>Importe con impuestos: {dinero(valor)}</p></>:<label>Importe<input className="input" type="number" min="0.01" step="0.01" value={monto} onChange={e=>setMonto(e.target.value)}/></label>}
 <label>Persona o identificación<input className="input" maxLength={100} value={persona} onChange={e=>setPersona(e.target.value)}/></label><label>Referencia de tarjeta / transferencia<input className="input" maxLength={150} value={referencia} onChange={e=>setReferencia(e.target.value)}/></label></div>
 <button disabled={busy||!cajaId||!navigator.onLine||valor<=0||total.isFetching||total.isError} className="rounded bg-ink-800 px-3 py-2 text-white disabled:opacity-50" onClick={pagar}>Registrar abono {dinero(valor||0)}</button>
 {(abonos??[]).map(a=><div className="flex flex-wrap justify-between gap-2 border-t py-2" key={a.id}><span>#{a.id} · {a.persona||a.usuario} · {a.metodo} · {dinero(Number(a.monto))} {a.revertido_en?'· Reintegrado':''}</span>{!a.revertido_en&&<button disabled={busy} className="text-danger-600" onClick={()=>revertir(a)}>Reintegrar con autorización</button>}</div>)}
 </div></details>;
}
