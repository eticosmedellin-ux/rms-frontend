import {useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {apiClient} from '@/api/client';
import {useEmpresasPlataforma} from '@/hooks/usePlataforma';
import {getApiErrorMessage} from '@/api/errors';
import {Modal} from '@/components/ui/Modal';
import type {Aplicacion} from './api';

export function GestionAplicaciones(){
 const qc=useQueryClient(), {data:empresas=[]}=useEmpresasPlataforma();
 const [empresa,setEmpresa]=useState(0),[edicion,setEdicion]=useState<Aplicacion|null>(null);
 const [version,setVersion]=useState(''),[novedades,setNovedades]=useState(''),[publicada,setPublicada]=useState(false);
 const [ocupado,setOcupado]=useState(false),[error,setError]=useState(''),[mensaje,setMensaje]=useState('');
 const apps=useQuery({queryKey:['gestionar-aplicaciones',empresa],queryFn:async()=>(await apiClient.get<Aplicacion[]>('/plataforma/aplicaciones',{params:{empresaId:empresa||undefined}})).data});
 async function ejecutar(fn:()=>Promise<unknown>,exito:string){
  setOcupado(true);setError('');setMensaje('');
  try{await fn();await Promise.all([qc.invalidateQueries({queryKey:['gestionar-aplicaciones']}),qc.invalidateQueries({queryKey:['tienda-aplicaciones']})]);setEdicion(null);setMensaje(exito);}
  catch(e){setError(getApiErrorMessage(e));}finally{setOcupado(false);}
 }
 return <section className="space-y-4">
  <header><h2 className="text-xl font-semibold">Tienda de aplicaciones</h2><p className="text-sm text-ink-600">Publica módulos y autoriza qué empresa puede instalarlos.</p></header>
  <label className="block text-sm">Empresa para autorizar<select className="input" disabled={ocupado} value={empresa} onChange={e=>{setEmpresa(Number(e.target.value));setMensaje('');setError('');}}><option value={0}>Catálogo general</option>{empresas.map(e=><option value={e.id} key={e.id}>{e.nombreComercial??e.nombre}</option>)}</select></label>
  {apps.isError&&<p role="alert">No se pudo consultar la tienda.</p>}
  {mensaje&&<p role="status">{mensaje}</p>}
  {!edicion&&error&&<p role="alert" className="text-danger-600">{error}</p>}
  <div className="grid gap-3 md:grid-cols-2">{apps.data?.map(a=><article className="space-y-2 rounded-xl border bg-white p-4" key={a.app.codigo}>
   <h3 className="font-semibold">{a.app.nombre}</h3><p className="text-sm text-ink-600">{a.app.descripcion}</p>
   <p className="text-xs">{a.publicada?'Publicada':'Sin publicar'} · Versión {a.version}{empresa&&a.instalada?' · Activa en el plan':''}</p>
   <div className="flex flex-wrap gap-3 text-sm">
    <button className="underline" type="button" disabled={ocupado} onClick={()=>{setError('');setEdicion(a);setVersion(a.version);setNovedades(a.novedades);setPublicada(a.publicada);}}>Editar publicación</button>
    {empresa>0&&<button className="underline" type="button" disabled={ocupado||(!a.publicada&&!a.autorizada)} onClick={()=>void ejecutar(
      ()=>apiClient.put(`/plataforma/empresas/${empresa}/aplicaciones/${a.app.codigo}`,{autorizada:!a.autorizada}),
      a.autorizada?'Autorización retirada. Las rutas activas se administran en el plan.':'Aplicación autorizada para esta empresa')}>{a.autorizada?'Retirar autorización':'Autorizar instalación'}</button>}
   </div>
  </article>)}</div>
  {edicion&&<Modal isOpen onClose={()=>{if(!ocupado){setEdicion(null);setError('');}}} title={edicion.app.nombre}>
   <form className="space-y-3" onSubmit={e=>{e.preventDefault();void ejecutar(
    ()=>apiClient.put(`/plataforma/aplicaciones/${edicion.app.codigo}`,{publicada,version,novedades}),'Publicación guardada');}}>
    <label className="block">Versión<input className="input" required maxLength={30} value={version} onChange={e=>setVersion(e.target.value)}/></label>
    <label className="block">Novedades<textarea className="input" maxLength={500} value={novedades} onChange={e=>setNovedades(e.target.value)}/></label>
    <label className="flex items-center gap-2"><input type="checkbox" checked={publicada} onChange={e=>setPublicada(e.target.checked)}/> Publicar en la tienda</label>
    {error&&<p role="alert" className="text-danger-600">{error}</p>}
    <button disabled={ocupado} className="rounded bg-ink-800 px-4 py-2 text-white">Guardar publicación</button>
   </form>
  </Modal>}
 </section>;
}
