import {useEffect,useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {Play,Plus,Pencil,Save} from 'lucide-react';
import {apiClient} from '@/api/client';
import {getApiErrorMessage} from '@/api/errors';
import {Modal} from '@/components/ui/Modal';
import {coincide} from '@/features/tutorial/guia';
import {useAuthStore} from '@/stores/authStore';

type Problema={id:number;categoria:string;titulo:string;solucion:string;publicado:boolean;tieneVideo:boolean};
const vacio={id:0,categoria:'',titulo:'',solucion:'',publicado:false,tieneVideo:false};
const ruta='/ayuda/problemas',adminRuta='/plataforma'+ruta;

function VideoAyuda({id,titulo}:{id:number;titulo:string}){
 const [url,setUrl]=useState(''),[error,setError]=useState('');
 useEffect(()=>{
  const abort=new AbortController();let objeto='';
  void apiClient.get<Blob>(`${ruta}/${id}/video`,{responseType:'blob',signal:abort.signal}).then(r=>{
   if(!abort.signal.aborted){objeto=URL.createObjectURL(r.data);setUrl(objeto);}
  }).catch(()=>{if(!abort.signal.aborted)setError('No se pudo cargar el video. Cierra la ventana e inténtalo otra vez.');});
  return ()=>{abort.abort();if(objeto)URL.revokeObjectURL(objeto);};
 },[id]);
 if(error)return <p role="alert">{error}</p>;
 if(!url)return <p role="status">Cargando video…</p>;
 return <video aria-label={titulo} className="w-full rounded-xl bg-black" src={url} controls playsInline preload="metadata" onError={()=>setError('El navegador no pudo reproducir el video. Prueba con MP4 (H.264).')}/>;
}

export function ProblemasAyuda({admin=false}:{admin?:boolean}){
 const empresa=useAuthStore(s=>s.empresaId),usuario=useAuthStore(s=>s.usuarioId);
 const qc=useQueryClient();
 const q=useQuery({queryKey:['ayuda-problemas',admin,empresa,usuario],queryFn:async()=>(await apiClient.get<Problema[]>(admin?adminRuta:ruta)).data,retry:false});
 const [busqueda,setBusqueda]=useState(''),[viendo,setViendo]=useState<Problema|null>(null);
 const [edicion,setEdicion]=useState<Problema|null>(null),[archivo,setArchivo]=useState<File|null>(null);
 const [quitar,setQuitar]=useState(false),[ocupado,setOcupado]=useState(false),[error,setError]=useState('');
 function editar(p:Problema){setEdicion(p);setArchivo(null);setQuitar(false);setError('');}
 async function guardar(){
  if(!edicion||ocupado)return;
  setError('');
  if(archivo&&(archivo.size>5*1024*1024||!archivo.size||!(/\.(mp4|webm)$/i.test(archivo.name)))){setError('Elige un MP4 o WebM de máximo 5 MB.');return;}
  setOcupado(true);
  const form=new FormData();
  if(edicion.id)form.set('id',String(edicion.id));
  for(const campo of ['categoria','titulo','solucion','publicado'] as const)form.set(campo,String(edicion[campo]));
  form.set('quitarVideo',String(quitar));
  if(archivo)form.set('video',archivo);
  try{
   await apiClient.post(adminRuta,form,{headers:{'Content-Type':'multipart/form-data'}});
   await qc.invalidateQueries({queryKey:['ayuda-problemas']});setEdicion(null);
  }catch(e){setError(getApiErrorMessage(e,'No se pudo guardar el problema.'));}
  finally{setOcupado(false);}
 }
 const resultados=(q.data??[]).filter(p=>coincide(p.categoria+' '+p.titulo+' '+p.solucion,busqueda));
 return <section className="space-y-3">
  <div className="flex flex-wrap items-center justify-between gap-2">
   <div><h3 className="font-semibold">Problemas frecuentes</h3><p className="text-xs text-ink-600">{admin?'Publica soluciones y videos para los usuarios de SICOM.':'Busca lo que te pasó y consulta cómo resolverlo.'}</p></div>
   {admin&&<button type="button" className="sicom-accion sicom-accion-principal" onClick={()=>editar(vacio)}><Plus size={16}/> Nuevo problema</button>}
  </div>
  <input type="search" className="input" aria-label="Buscar problema frecuente" placeholder="Ej. Error al ingresar una compra" value={busqueda} onChange={e=>setBusqueda(e.target.value)}/>
  {q.isLoading&&<p role="status">Cargando problemas…</p>}
  {q.isError&&<p role="alert">No se pudieron cargar los problemas. <button className="underline" onClick={()=>void q.refetch()}>Reintentar</button></p>}
  {q.isSuccess&&!resultados.length&&<p className="text-sm text-ink-600">{busqueda?'No hay coincidencias.':'Todavía no hay problemas de ayuda disponibles.'}</p>}
  {resultados.map(p=><article key={p.id} className="space-y-2 rounded-xl border bg-white p-3">
   <p className="text-xs text-ink-500">{p.categoria}{admin&&(p.publicado?' · Publicado':' · Borrador')}</p>
   <h4 className="text-sm font-semibold">{p.titulo}</h4>
   <div className="flex flex-wrap gap-2">
    <button type="button" className="sicom-accion" onClick={()=>setViendo(p)}>{p.tieneVideo&&<Play size={15}/>} {p.tieneVideo?'Ver solución y video':'Ver solución'}</button>
    {admin&&<button type="button" className="sicom-accion" onClick={()=>editar(p)}><Pencil size={15}/> Editar</button>}
   </div>
  </article>)}
  {viendo&&<Modal isOpen title={viendo.titulo} size="lg" onClose={()=>setViendo(null)}>
   <div className="space-y-4"><p className="whitespace-pre-line text-sm">{viendo.solucion}</p>{viendo.tieneVideo&&<VideoAyuda key={viendo.id} id={viendo.id} titulo={viendo.titulo}/>}</div>
  </Modal>}
  {edicion&&<Modal isOpen title={edicion.id?'Editar problema frecuente':'Nuevo problema frecuente'} size="lg" onClose={()=>{if(!ocupado)setEdicion(null);}}>
   <form onSubmit={e=>{e.preventDefault();void guardar();}}><fieldset className="space-y-3" disabled={ocupado}>
    <label className="block">Categoría<input required maxLength={80} className="input" placeholder="Ej. Compras" value={edicion.categoria} onChange={e=>setEdicion({...edicion,categoria:e.target.value})}/></label>
    <label className="block">Problema<input required maxLength={140} className="input" placeholder="Ej. No puedo registrar una compra" value={edicion.titulo} onChange={e=>setEdicion({...edicion,titulo:e.target.value})}/></label>
    <label className="block">Cómo resolverlo<textarea required maxLength={3000} rows={5} className="input" placeholder="Escribe los pasos que debe seguir el usuario" value={edicion.solucion} onChange={e=>setEdicion({...edicion,solucion:e.target.value})}/></label>
    <label className="block">Video opcional · MP4 o WebM, máximo 5 MB<input className="input" type="file" accept=".mp4,.webm,video/mp4,video/webm" onChange={e=>{setArchivo(e.target.files?.[0]??null);setQuitar(false);}}/></label>
    {edicion.tieneVideo&&<label className="flex gap-2"><input type="checkbox" disabled={!!archivo} checked={quitar} onChange={e=>setQuitar(e.target.checked)}/> Quitar el video actual</label>}
    <label className="flex gap-2"><input type="checkbox" checked={edicion.publicado} onChange={e=>setEdicion({...edicion,publicado:e.target.checked})}/> Publicar en el asistente de ayuda</label>
    {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
    <button type="submit" className="sicom-accion sicom-accion-principal"><Save size={16}/> {ocupado?'Guardando…':'Guardar problema'}</button>
   </fieldset></form>
  </Modal>}
 </section>;
}
