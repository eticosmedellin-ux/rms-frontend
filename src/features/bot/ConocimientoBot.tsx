import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {apiClient} from '@/api/client';
import {getApiErrorMessage} from '@/api/errors';
import {normal} from './resolver';
import {useConsultasSinRespuesta,useMarcarConsultaAtendida} from '@/hooks/useAyuda';
import {entender,tipos} from './lenguaje';
const ruta='/plataforma/ayuda/bot/conocimiento';
type Regla={id:number;expresion:string;intencion:string;publicado:boolean};
export function ConocimientoBot(){
 const q=useQuery({queryKey:['admin-bot-conocimiento'],queryFn:async()=>(await apiClient.get<Regla[]>(ruta)).data,retry:false});
 const [expresion,setExpresion]=useState(''),[intencion,setIntencion]=useState('ventas'),[revisada,setRevisada]=useState<number|null>(null),[prueba,setPrueba]=useState(''),[error,setError]=useState(''),[ocupado,setOcupado]=useState(false);
 const dudas=useConsultasSinRespuesta(),atender=useMarcarConsultaAtendida();
 const grupos=new Map<string,NonNullable<typeof dudas.data>>();
 for(const d of dudas.data??[]){
  if(d.atendida||d.rutaResumen!=='SICOM BOT'||!d.comentarioAdicional)continue;
  const clave=normal(d.comentarioAdicional);if(!clave)continue;
  const grupo=grupos.get(clave)??[];grupo.push(d);grupos.set(clave,grupo);
 }
 async function ejecutar(fn:()=>Promise<unknown>){setOcupado(true);setError('');try{await fn();await q.refetch();}catch(e){setError(getApiErrorMessage(e));}finally{setOcupado(false);}}
 return <section className="space-y-3 rounded border bg-white p-4">
  <h3 className="font-bold">Conocimiento general de SICOM BOT</h3>
  <p className="text-sm">Convierte una duda revisada en una expresión general. Omite nombres, documentos y datos de empresas. Publicar cambia cómo el bot interpreta esa expresión para todos los usuarios.</p>
  <details className="rounded border p-3">
   <summary>Dudas de SICOM BOT por revisar: {grupos.size} grupos</summary>
   {dudas.isError&&<p>No se pudieron cargar las dudas.</p>}
   {[...grupos.entries()].sort((a,b)=>b[1].length-a[1].length).slice(0,30).map(([clave,grupo])=><article key={clave} className="my-2 rounded border p-2 text-sm">
    <p>{grupo[0].comentarioAdicional} · {grupo.length} reportes</p>
    <button type="button" className="sicom-accion" onClick={()=>{setPrueba(grupo[0].comentarioAdicional??'');setExpresion('');}}>Preparar borrador</button>
    <button type="button" className="sicom-accion" disabled={atender.isPending} onClick={()=>void ejecutar(async()=>{if(!window.confirm('¿Ya verificaste la solución? Esto marca los reportes del grupo como atendidos.'))return;for(const d of grupo)await atender.mutateAsync(d.id);})}>Marcar grupo atendido</button>
   </article>)}
  </details>
  <form className="flex flex-wrap gap-2" onSubmit={e=>{e.preventDefault();void ejecutar(async()=>{await apiClient.post(ruta,{expresion,intencion});setExpresion('');});}}>
   {prueba&&<p className="basis-full text-sm">Pregunta de referencia: {prueba}</p>}
   <label>Expresión general<input className="input" required maxLength={100} value={expresion} onChange={e=>setExpresion(e.target.value)}/></label>
   <label>Intención<select className="input" value={intencion} onChange={e=>setIntencion(e.target.value)}>{tipos.map(t=><option key={t}>{t}</option>)}</select></label>
   <button className="sicom-accion sicom-accion-principal self-end" disabled={ocupado}>Guardar borrador</button>
  </form>
  {q.isError&&<p role="alert">No se pudo cargar el conocimiento.</p>}
  {error&&<p role="alert">{error}</p>}
  {q.data?.map(r=><article className="space-y-2 rounded border p-2" key={r.id}>
   <p><strong>{r.expresion}</strong> → {r.intencion} · {r.publicado?'Publicada':'Borrador'}</p>
   {r.publicado?<button className="sicom-accion" disabled={ocupado} onClick={()=>void ejecutar(()=>apiClient.put(ruta+'/'+r.id,{publica:false,revisada:false}))}>Retirar</button>:<>
    <button className="sicom-accion" onClick={()=>{setPrueba(prueba||r.expresion);setRevisada(r.id);}}>Revisar interpretación</button>
    {revisada===r.id&&<div className="space-y-2">
     <label>Pregunta de prueba<input className="input" maxLength={160} value={prueba} onChange={e=>setPrueba(e.target.value)}/></label>
     <p>Intención detectada: {entender(prueba,[],undefined,[r]).consulta?.tipo??'Requiere aclaración'}</p>
     <button className="sicom-accion sicom-accion-principal" disabled={ocupado||entender(prueba,[],undefined,[r]).consulta?.tipo!==r.intencion} onClick={()=>{if(window.confirm('Confirmo que revisé la intención y que la expresión no contiene información privada.'))void ejecutar(()=>apiClient.put(ruta+'/'+r.id,{publica:true,revisada:true}));}}>Aprobar y publicar</button>
    </div>}
   </>}
  </article>)}
 </section>;
}
