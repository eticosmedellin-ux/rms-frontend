import {useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {apiClient} from '@/api/client';
import {useSucursales} from '@/hooks/useSucursales';
import {SelectorProductoOCombo,type ItemSeleccionable} from '@/components/SelectorProductoOCombo';
import {getApiErrorMessage} from '@/api/errors';
interface Regla{id:number;nombre:string;tipo:string;articulo_id:number;agotado:boolean;estacion:string;hora_desde:string|null;hora_hasta:string|null;}
export function CatalogoOperacion(){
 const {data:sucursales}=useSucursales();const [sucursal,setSucursal]=useState(''),[articulo,setArticulo]=useState<ItemSeleccionable|null>(null),[agotado,setAgotado]=useState(false),[estacion,setEstacion]=useState('COCINA'),[desde,setDesde]=useState(''),[hasta,setHasta]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const id=sucursal||String(sucursales?.[0]?.id||'');const client=useQueryClient();
 const {data:reglas,error:loadError}=useQuery({queryKey:['restaurante-catalogo',id],queryFn:async()=>(await apiClient.get<Regla[]>('/restaurante/catalogo',{params:{sucursalId:id}})).data,enabled:!!id});
 async function save(){if(!articulo)return;setBusy(true);setError('');try{await apiClient.put('/restaurante/catalogo',{sucursalId:Number(id),tipo:articulo.tipo,articuloId:articulo.id,agotado,estacion,desde:desde||null,hasta:hasta||null});await client.invalidateQueries({queryKey:['restaurante-catalogo',id]});setArticulo(null);}catch(e){setError(getApiErrorMessage(e,'No se pudo guardar la regla'));}finally{setBusy(false);}}
 return <details className="my-4 rounded-xl border bg-white p-4"><summary className="cursor-pointer font-semibold">Disponibilidad, horarios y estaciones de preparación</summary>
 <div className="mt-3"><select className="input" value={id} onChange={e=>setSucursal(e.target.value)}>{sucursales?.map(s=><option key={s.id} value={s.id}>{s.nombre}</option>)}</select>
 {(error||loadError)&&<p role="alert" className="text-danger-600">{error||getApiErrorMessage(loadError,'No se pudieron consultar las reglas')}</p>}
 <div className="mt-3 grid gap-2 sm:grid-cols-2">{reglas?.map(r=><button key={r.id} className="rounded border p-2 text-left" onClick={()=>{setArticulo({id:r.articulo_id,tipo:r.tipo as 'PRODUCTO'|'COMBO',nombre:r.nombre,precioVenta:0,imagen:null});setAgotado(r.agotado);setEstacion(r.estacion);setDesde(r.hora_desde?.slice(0,5)||'');setHasta(r.hora_hasta?.slice(0,5)||'');}}>{r.nombre} · {r.agotado?'Agotado':'Habilitado'} · {r.estacion} · {r.hora_desde?.slice(0,5)||'Todo el día'} {r.hora_hasta?.slice(0,5)}</button>)}</div>
 {!articulo?<div className="mt-3"><SelectorProductoOCombo onSeleccionar={a=>{setArticulo(a);setAgotado(false);setEstacion('COCINA');setDesde('');setHasta('');}}/></div>:<div className="mt-3 space-y-2"><p className="font-semibold">{articulo.nombre}</p><label className="block"><input type="checkbox" checked={agotado} onChange={e=>setAgotado(e.target.checked)}/> Marcar agotado</label><label className="block">Estación<input className="input" maxLength={80} value={estacion} onChange={e=>setEstacion(e.target.value)}/></label><div className="flex gap-3"><label>Desde<input className="input" type="time" value={desde} onChange={e=>setDesde(e.target.value)}/></label><label>Hasta<input className="input" type="time" value={hasta} onChange={e=>setHasta(e.target.value)}/></label></div><p className="text-xs">Hora de Colombia. Ambos vacíos habilitan todo el día. Un horario de 22:00 a 02:00 cruza medianoche.</p><button disabled={busy} className="rounded bg-ink-800 px-3 py-2 text-white" onClick={save}>Guardar regla</button><button className="ml-3" onClick={()=>setArticulo(null)}>Cancelar</button></div>}
 </div></details>;
}
