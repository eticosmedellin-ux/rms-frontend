import {useState} from 'react';
import {CreditCard, Upload} from 'lucide-react';
import {apiClient} from '@/api/client';
import {getApiErrorMessage} from '@/api/errors';
import {CampoPassword} from '@/components/ui/CampoPassword';

type Datos={plan:{meses:number;monto:number;corte:string};historial:{id:number;corte:string;estado:string;motivo?:string}[]};
export function RecuperarServicio({token,usuarioId,cerrar,actualizar}:{token:string;usuarioId:number;cerrar:()=>void;actualizar:()=>void}){
 const [datos,setDatos]=useState<Datos|null>(null),[clave,setClave]=useState(''),[archivo,setArchivo]=useState<File|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const ultimo=datos?.historial.find(x=>x.corte===datos.plan.corte);
 async function enviar(){
  setBusy(true);setError('');
  try{
   const headers={'X-Sicom-Empresa':token};
   if(archivo){
    if(archivo.size>4*1024*1024)throw new Error('El comprobante debe pesar máximo 4 MB.');
    const form=new FormData();form.append('archivo',archivo);form.append('usuarioId',String(usuarioId));form.append('password',clave);
    setDatos((await apiClient.post<Datos>('/auth/empresa/comprobante',form,{headers:{...headers,'Content-Type':undefined}})).data);
    setArchivo(null);setClave('');
   }else setDatos((await apiClient.post<Datos>('/auth/empresa/comprobante/estado',{usuarioId,password:clave},{headers})).data);
  }catch(e){setError(getApiErrorMessage(e));}finally{setBusy(false);}
 }
 return <section className="mx-auto mt-6 max-w-lg rounded-2xl border border-amber-300/40 bg-slate-900 p-6 text-left shadow-xl">
  <div className="mb-4 flex items-center gap-3"><span className="rounded-xl bg-amber-400/15 p-3 text-amber-300"><CreditCard size={24}/></span><div>
   <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">{ultimo?.estado==='PENDIENTE'?'En espera de validación':'Pendiente de pago'}</p>
   <h2 className="text-xl font-semibold">Tu servicio está suspendido</h2>
  </div></div>
  <p className="mb-3 text-sm text-slate-300">Un superadministrador revisará el comprobante. El acceso se restablece cuando lo apruebe.</p>
  {datos&&<p className="mb-3 rounded-lg bg-slate-800 p-3 text-sm">Corte: {datos.plan.corte} · Plan de {datos.plan.meses} mes(es) · {Number(datos.plan.monto).toLocaleString('es-CO',{style:'currency',currency:'COP'})}</p>}
  {ultimo?.estado==='RECHAZADO'&&<p className="mb-3 rounded bg-red-900/50 p-2 text-sm">Comprobante no aceptado: {ultimo.motivo}</p>}
  {ultimo?.estado!=='PENDIENTE'&&<form onSubmit={e=>{e.preventDefault();void enviar();}} className="space-y-3">
   <label className="block text-sm">Contraseña de administrador<CampoPassword required autoComplete="current-password" value={clave} onChange={e=>setClave(e.target.value)} className="mt-1 w-full rounded-lg bg-slate-800 p-3"/></label>
   {datos&&<label className="block rounded-xl border border-dashed border-slate-500 p-4 text-sm"><Upload size={18}/> Adjunta un PDF, PNG o JPG (máx. 4 MB)<input required className="mt-2 block w-full" type="file" accept="application/pdf,image/png,image/jpeg" onChange={e=>setArchivo(e.target.files?.[0]??null)}/></label>}
   <button type="submit" disabled={busy||!clave||(!!datos&&!archivo)} className="rounded-lg bg-amber-300 px-4 py-2 font-semibold text-slate-900 disabled:opacity-50">{busy?'Procesando…':datos?'Subir comprobante':'Consultar corte'}</button>
  </form>}
  {error&&<p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
  <div className="mt-4 flex flex-wrap gap-4 text-sm"><button type="button" className="underline" onClick={()=>{actualizar();setDatos(null);setClave('');setArchivo(null);}}>Actualizar estado del servicio</button><button type="button" className="underline" onClick={cerrar}>Volver a perfiles</button></div>
 </section>;
}
