import {useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {apiClient} from '@/api/client';
import {getApiErrorMessage} from '@/api/errors';

type Empresa={id:number;nombre:string;meses:number|null;monto:number|null;corte:string|null;suspendida_por_pago:boolean};
type Comprobante={id:number;corte:string;estado:string;motivo:string|null;subido_en:string};
export function PlanesCobrosTab(){
 const qc=useQueryClient();
 const base='/plataforma/cobros-manuales';
 const empresas=useQuery({queryKey:['cobros-manuales'],queryFn:async()=>(await apiClient.get<Empresa[]>(base)).data});
 const [id,setId]=useState(0),[meses,setMeses]=useState(1),[monto,setMonto]=useState(''),[corte,setCorte]=useState(''),[archivo,setArchivo]=useState<File|null>(null),[mensaje,setMensaje]=useState(''),[ocupado,setOcupado]=useState(false);
 const empresa=empresas.data?.find(e=>e.id===id);
 const path=`${base}/${id}/comprobantes`;
 const historial=useQuery({queryKey:['comprobantes-plan',id],enabled:!!empresa?.meses,queryFn:async()=>(await apiClient.get<Comprobante[]>(path)).data});
 async function ejecutar(fn:()=>Promise<unknown>,exito:string){
  setOcupado(true);setMensaje('');
  try{await fn();await Promise.all([qc.invalidateQueries({queryKey:['cobros-manuales']}),qc.invalidateQueries({queryKey:['comprobantes-plan',id]})]);setMensaje(exito);}
  catch(e){setMensaje(getApiErrorMessage(e));}finally{setOcupado(false);}
 }
 async function descargar(c:Comprobante){
  const r=await apiClient.get<Blob>(`${path}/${c.id}`,{responseType:'blob'});
  const url=URL.createObjectURL(r.data), a=document.createElement('a');
  a.href=url;a.download=`comprobante-${c.id}.${r.data.type==='application/pdf'?'pdf':r.data.type==='image/png'?'png':'jpg'}`;
  a.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 return <section className="space-y-4">
  <div><h2 className="text-xl font-semibold">Planes y cobros</h2><p className="text-sm text-ink-600">Configura el corte y revisa los comprobantes de cada empresa.</p></div>
  {empresas.isError&&<p role="alert">No se pudieron cargar las empresas.</p>}
  <label className="block text-sm">Empresa<select className="input" value={id} disabled={ocupado} onChange={e=>{
   const n=Number(e.target.value), p=empresas.data?.find(x=>x.id===n);
   setId(n);setMeses(p?.meses??1);setMonto(String(p?.monto??''));setCorte(p?.corte??'');setArchivo(null);setMensaje('');
  }}><option value={0}>Selecciona una empresa</option>{empresas.data?.map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}</select></label>
  {empresa&&<><form className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-3" onSubmit={e=>{e.preventDefault();void ejecutar(()=>apiClient.put(`${base}/${id}`,{meses,monto:Number(monto),corte}),'Plan guardado');}}>
   <label>Frecuencia<select className="input" value={meses} onChange={e=>setMeses(Number(e.target.value))}><option value={1}>Mensual</option><option value={6}>Semestral</option><option value={12}>Anual</option></select></label>
   <label>Monto por período<input className="input" type="number" min="0.01" step="0.01" required value={monto} onChange={e=>setMonto(e.target.value)}/></label>
   <label>Fecha de corte<input className="input" type="date" required value={corte} onChange={e=>setCorte(e.target.value)}/></label>
   <button className="rounded-lg bg-ink-800 px-4 py-2 text-white disabled:opacity-50" disabled={ocupado||empresa.suspendida_por_pago}>Guardar plan</button>
   {empresa.suspendida_por_pago&&<p className="text-danger-600">Suspendida por pago</p>}
  </form>
  {empresa.meses&&<div className="space-y-3 rounded-xl border bg-white p-4">
   <h3 className="font-semibold">Comprobantes · corte {empresa.corte}</h3>
   <input key={id} type="file" aria-label="Comprobante de pago" accept="application/pdf,image/png,image/jpeg" onChange={e=>setArchivo(e.target.files?.[0]??null)}/>
   <button type="button" className="rounded border px-3 py-1" disabled={!archivo||ocupado} onClick={()=>void ejecutar(async()=>{
    const form=new FormData();form.append('archivo',archivo!);
    await apiClient.post(path,form,{headers:{'Content-Type':undefined}});setArchivo(null);
   },'Comprobante en espera de validación')}>Subir comprobante</button>
   {historial.isError&&<p role="alert">No se pudieron consultar los comprobantes.</p>}
   {historial.data?.map(c=><div className="flex flex-wrap items-center gap-3 border-t py-2 text-sm" key={c.id}>
    <span>#{c.id} · Corte {c.corte} · {c.estado==='PENDIENTE'?'En espera de validación':c.estado}{c.motivo?` · ${c.motivo}`:''}</span>
    <button className="underline" disabled={ocupado} onClick={()=>void ejecutar(()=>descargar(c),'Comprobante descargado')}>Ver comprobante</button>
    {c.estado==='PENDIENTE'&&<>
     <button className="font-medium text-emerald-700" disabled={ocupado} onClick={()=>{if(window.confirm('¿Aceptar el comprobante y registrar el pago de este corte?'))void ejecutar(()=>apiClient.post(`${path}/${c.id}/revisar`,{aceptar:true}),'Comprobante aceptado y corte actualizado');}}>Aceptar</button>
     <button className="font-medium text-danger-600" disabled={ocupado} onClick={()=>{const motivo=window.prompt('Motivo de rechazo');if(motivo?.trim())void ejecutar(()=>apiClient.post(`${path}/${c.id}/revisar`,{aceptar:false,motivo}),'Comprobante rechazado');}}>No aceptar</button>
    </>}
   </div>)}
  </div>}</>}
  {mensaje&&<p role="status" className="rounded border p-3">{mensaje}</p>}
 </section>;
}
