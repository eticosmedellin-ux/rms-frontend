import {Link} from 'react-router-dom';
import {entender} from './lenguaje';
import {consultar,cargarSedes,cargarConocimiento} from './consultas';
import {useEffect,useRef,useState} from 'react';
import {Bot,Minus,Send,Trash2,X} from 'lucide-react';
import {useGuias,urlPractica} from '../tutorial/practica/bibliotecaApi';
import {resolver,type Respuesta} from './resolver';
import {apiClient} from '@/api/client';
import {getApiErrorMessage} from '@/api/errors';
import {useQuery} from '@tanstack/react-query';

type Fuente={titulo:string;url:string};
type Turno={pregunta:string;respuesta:Respuesta & {externa?:{fuentes:Fuente[];consultado:string}};enviada?:boolean};
type Chat={id:number;titulo:string};
const ruta='/ayuda/bot/chats',web='/ayuda/bot/web';
const enlaceSeguro=(url:string)=>{try{const x=new URL(url);return x.protocol==='https:'&&!x.username&&!x.password;}catch{return false;}};
const temaPublico=(q:string)=>{
 const n=q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 return (/medicamento|acetaminofen|minoxidil|efectos secundarios|dosis|farmaco/.test(n)?'salud':
 /cemento|broca|pintura|metal/.test(n)?'ferreteria':/conserva|leche|alimento/.test(n)?'alimentos':
 /aceite|vehiculo|motocicleta|bateria/.test(n)?'repuestos':/ddr[45]|ram|procesador|componente/.test(n)?'tecnologia':
 /hialuronico|cosmetico|maquillaje/.test(n)?'belleza':'general');
};
function leer(k:string):Turno[]{try{const v=JSON.parse(localStorage.getItem(k)??'[]');return Array.isArray(v)?v.filter(x=>typeof x?.pregunta==='string'&&typeof x?.respuesta?.texto==='string').slice(-30):[];}catch{return [];}}
export function SicomBot({identidad}:{identidad:string}){
 const solicitud=useRef<AbortController|null>(null);
 const [consultando,setConsultando]=useState(false);
 useEffect(()=>()=>solicitud.current?.abort(),[]);
 const clave='sicom-bot-v1:'+identidad;
 const [estado,setEstado]=useState<'cerrado'|'abierto'|'minimizado'>('cerrado'),[texto,setTexto]=useState('');
 const [historial,setHistorial]=useState<Turno[]>(()=>leer(clave)),[aviso,setAviso]=useState(''),[enviando,setEnviando]=useState(false);
 const final=useRef<HTMLDivElement>(null),campo=useRef<HTMLInputElement>(null),boton=useRef<HTMLButtonElement>(null);
 const [chat,setChat]=useState<number|null>(null),[memoria,setMemoria]=useState<string|null>(null);
 const [titulo,setTitulo]=useState(''),[gestion,setGestion]=useState(false);
 const [publica,setPublica]=useState<string|null>(null),[confirmada,setConfirmada]=useState(false),[sugerencia,setSugerencia]=useState('');
 const [tema,setTema]=useState('general');
 const chats=useQuery({queryKey:['bot-chats',identidad],queryFn:async()=>(await apiClient.get<Chat[]>(ruta)).data,enabled:estado==='abierto',retry:false});
 const estadoWeb=useQuery({queryKey:['bot-web',identidad],queryFn:async()=>(await apiClient.get<{activo:boolean}>(web)).data,enabled:estado==='abierto',retry:false});
 async function gestionar(fn:()=>Promise<void>){if(gestion||consultando||solicitud.current)return;setGestion(true);setAviso('');try{await fn();}catch(e){setAviso(getApiErrorMessage(e,'No se pudo completar el cambio.'));}finally{setGestion(false);}}
 function abrirChat(id:number){void gestionar(async()=>{
  const {data}=await apiClient.get<Turno[]>(ruta+'/'+id);
  setHistorial(data);setChat(id);setTitulo(chats.data?.find(c=>c.id===id)?.titulo??'');setSugerencia('');setPublica(null);
 });}
 function nuevo(){void gestionar(async()=>{
  const nombre=titulo.trim()||'Nueva conversación';
  const {data}=await apiClient.post<{id:number}>(ruta,{titulo:nombre});
  setChat(data.id);setTitulo(nombre);setHistorial([]);setPublica(null);setSugerencia('');await chats.refetch();
 });}
 async function externa(){
  if(!publica?.trim()||!confirmada||solicitud.current||gestion)return;
  const pregunta=publica.trim(),ac=new AbortController();solicitud.current=ac;setConsultando(true);setAviso('');
  try{
   const {data}=await apiClient.post<{texto:string;fuentes:Fuente[];consultado:string}>(web,{pregunta,publica:confirmada,tema},{signal:ac.signal});
   if(!ac.signal.aborted){setHistorial(prev=>[...prev,{pregunta,respuesta:{texto:data.texto,datoVivo:true,externa:{fuentes:data.fuentes,consultado:data.consultado}}}].slice(-100));setPublica(null);setSugerencia('');}
  }catch(e){if(!ac.signal.aborted)setAviso(getApiErrorMessage(e,'La búsqueda externa no está disponible en este momento.'));}
  finally{if(solicitud.current===ac){solicitud.current=null;setConsultando(false);}}
 }
 const guias=useGuias(false,estado!=='cerrado');
 useEffect(()=>{if(chat!==null)return;try{localStorage.setItem(clave,JSON.stringify(historial.filter(t=>!t.respuesta.datoVivo)));}catch{}},[clave,historial,chat]);
 useEffect(()=>{if(estado==='abierto')campo.current?.focus();},[estado]);
 useEffect(()=>{if(estado==='abierto')final.current?.scrollIntoView({block:'nearest'});},[historial,estado]);
 function cerrar(modo:'cerrado'|'minimizado'){setEstado(modo);boton.current?.focus();}
 async function enviar(){
  const pregunta=texto.trim();if(!pregunta||solicitud.current||gestion)return;
  const ultimo=historial.at(-1),contexto=ultimo?.respuesta.contexto;
  const ac=new AbortController();solicitud.current=ac;setConsultando(true);setTexto('');setAviso('');setSugerencia('');
  try{
   const recuperar=pregunta.match(/^\s*(?:retoma|busca en mis chats)\s+(.+)/i);
   if(recuperar){
    const {data}=await apiClient.get<{id:number;titulo:string;pregunta:string}[]>(ruta+'/antecedentes',{params:{tema:recuperar[1].slice(0,160)},signal:ac.signal});
    if(!ac.signal.aborted)setHistorial(prev=>[...prev,{pregunta,respuesta:{datoVivo:true,texto:data.length?'Encontré estos antecedentes en tus chats: '+data.map(x=>x.titulo+' · '+x.pregunta).join('\n'):'No encontré antecedentes sobre ese tema.',antecedentes:data.map(({id,titulo})=>({id,titulo}))}}].slice(-100));
    return;
   }
   if(/^\s*(?:que|qué) (?:recuerdas|guardaste) de mi\s*\??$/i.test(pregunta)){
    const {data}=await apiClient.get<{nota:string}>(ruta+'/memoria',{signal:ac.signal});
    if(!ac.signal.aborted)setHistorial(prev=>[...prev,{pregunta,respuesta:{datoVivo:true,texto:data.nota||'Todavía no tienes una nota guardada en Mi memoria.'}}].slice(-100));
    return;
   }
   const pistas=entender(pregunta,[],contexto);
   const reglas=await cargarConocimiento(ac.signal).catch(()=>[]);
   const previa=entender(pregunta,[],contexto,reglas);
   const sedes=(previa.consulta||previa.aclarar||pistas.consulta)?await cargarSedes(ac.signal):[];
   const analisis=entender(pregunta,sedes,contexto,reglas);
   let respuesta=analisis.consulta?await consultar(analisis.consulta,ac.signal):analisis.aclarar?
    {texto:analisis.aclarar,datoVivo:true,contexto}:resolver(pregunta,guias.data??[],ultimo?.respuesta.aclarar?ultimo.pregunta:'');
   if(analisis.guia&&analisis.consulta){
    const g=resolver(analisis.guia,guias.data??[]);respuesta={...respuesta,texto:respuesta.texto+'\n\n'+g.texto,opciones:g.opciones};
   }
   if(!ac.signal.aborted){
    setHistorial(prev=>[...prev,{pregunta,respuesta}].slice(chat===null?-30:-100));
    if(!analisis.consulta&&!analisis.aclarar&&respuesta.sinGuia&&estadoWeb.data?.activo)setSugerencia(pregunta);
    if(chat!==null&&!respuesta.datoVivo){
     try{await apiClient.post(ruta+'/'+chat,{pregunta,respuesta},{signal:ac.signal});void chats.refetch();}
     catch{if(!ac.signal.aborted)setAviso('La respuesta se muestra, pero no se pudo guardar en el chat.');}
    }
   }
  }catch{
   if(!ac.signal.aborted)setHistorial(prev=>[...prev,{pregunta,respuesta:{texto:'No pude consultar las sucursales autorizadas. Revisa tus permisos de Reportes o inténtalo de nuevo.',datoVivo:true}}].slice(-30));
  }finally{if(solicitud.current===ac){solicitud.current=null;setConsultando(false);}}
 }
 async function reportar(){
  const t=historial.at(-1);if(!t||t.enviada||enviando||t.respuesta.datoVivo)return;
  setEnviando(true);setAviso('');
  try{
   await apiClient.post('/ayuda/consulta-sin-respuesta',{rutaResumen:'SICOM BOT',comentarioAdicional:t.pregunta});
   setHistorial(prev=>prev.map(x=>x===t?{...x,enviada:true}:x));setAviso('Duda enviada a soporte.');
  }catch{setAviso('No se pudo enviar la duda. Inténtalo de nuevo.');}finally{setEnviando(false);}
 }
 return <>
  <button ref={boton} type="button" title="SICOM BOT" aria-label="Abrir SICOM BOT" aria-expanded={estado==='abierto'} className="sicom-accion px-2" onClick={()=>estado==='abierto'?cerrar('minimizado'):setEstado('abierto')}><Bot size={19}/><span className="hidden lg:inline">SICOM BOT</span></button>
  {estado==='minimizado'&&<button type="button" className="sicom-accion sicom-accion-principal fixed bottom-24 right-4 z-40" onClick={()=>setEstado('abierto')}><Bot size={18}/> SICOM BOT</button>}
  {estado==='abierto'&&<section aria-label="Conversación con SICOM BOT" className="fixed bottom-20 right-3 z-50 flex max-h-[min(36rem,78dvh)] w-[min(26rem,calc(100vw-1.5rem))] flex-col rounded-xl border bg-white shadow-xl" onKeyDown={e=>{if(e.key==='Escape')cerrar('cerrado');}}>
   <header className="flex items-center gap-2 rounded-t-xl border-b bg-ink-50 p-3"><Bot size={19}/><h2 className="flex-1 font-bold">SICOM BOT</h2>
    <button type="button" className="rounded p-2" aria-label="Minimizar chat" onClick={()=>cerrar('minimizado')}><Minus size={17}/></button>
    <button type="button" className="rounded p-2" aria-label="Cerrar chat" onClick={()=>cerrar('cerrado')}><X size={17}/></button>
   </header>
   <div className="space-y-2 border-b p-2 text-xs">
    <div className="flex flex-wrap gap-2">
     <select className="input flex-1" aria-label="Conversaciones" disabled={gestion||consultando} value={chat??''} onChange={e=>{if(e.target.value)abrirChat(Number(e.target.value));else {setChat(null);setHistorial(leer(clave));setTitulo('');setPublica(null);setSugerencia('');}}}>
      <option value="">Chat local anterior</option>{chats.data?.map(c=><option key={c.id} value={c.id}>{c.titulo}</option>)}
     </select>
     <button type="button" className="sicom-accion" disabled={gestion||consultando} onClick={nuevo}>Nuevo chat</button>
     <button type="button" className="sicom-accion" disabled={gestion||consultando} onClick={()=>void gestionar(async()=>{setMemoria((await apiClient.get<{nota:string}>(ruta+'/memoria')).data.nota);})}>Mi memoria</button>
    </div>
    {chats.isError&&<p>El historial privado no está disponible. Puedes seguir usando el chat local.</p>}
    {chat!==null&&<div className="flex flex-wrap gap-2"><input className="input flex-1" aria-label="Título del chat" maxLength={100} value={titulo} onChange={e=>setTitulo(e.target.value)}/>
      <button type="button" disabled={gestion||consultando||!titulo.trim()} className="sicom-accion" onClick={()=>void gestionar(async()=>{await apiClient.patch(ruta+'/'+chat,{titulo});await chats.refetch();})}>Renombrar</button>
      <button type="button" disabled={gestion||consultando} className="sicom-accion" onClick={()=>{if(window.confirm('¿Eliminar esta conversación guardada?'))void gestionar(async()=>{await apiClient.delete(ruta+'/'+chat);setChat(null);setHistorial(leer(clave));setTitulo('');setPublica(null);setSugerencia('');await chats.refetch();});}}>Eliminar chat</button>
    </div>}
    {memoria!==null&&<div className="space-y-1"><label>Nota privada para todos tus chats<textarea className="input" value={memoria} maxLength={1000} onChange={e=>setMemoria(e.target.value)}/></label><p>Puedes consultarla diciendo «Qué recuerdas de mi». Guarda en blanco para eliminarla.</p>
      <button type="button" className="sicom-accion" disabled={gestion||consultando} onClick={()=>void gestionar(async()=>{await apiClient.put(ruta+'/memoria',{nota:memoria});setMemoria(null);setAviso('Memoria actualizada.');})}>Guardar memoria</button>
      <button type="button" className="sicom-accion" onClick={()=>setMemoria(null)}>Cerrar</button>
    </div>}
   </div>
   <div role="log" aria-live="polite" className="min-h-32 flex-1 space-y-3 overflow-auto p-3 text-sm">
    {!historial.length&&<p>¿Qué necesitas hacer en SICOM? Escríbeme con tus propias palabras.</p>}
    {historial.map((t,i)=><div key={i} className="space-y-2">
     <p className="ml-6 rounded-xl bg-emerald-100 p-2"><strong>Tú: </strong>{t.pregunta}</p>
     <div className="mr-4 space-y-2 rounded-xl bg-ink-50 p-2"><p className="whitespace-pre-line">{t.respuesta.texto}</p>
      {t.respuesta.antecedentes?.map((a,i)=><button key={i} type="button" className="sicom-accion" disabled={gestion||consultando} onClick={()=>abrirChat(a.id)}>Abrir: {a.titulo}</button>)}
      {t.respuesta.externa&&<div className="space-y-1 text-xs"><p>Consulta web · {new Date(t.respuesta.externa.consultado).toLocaleString('es-CO')}</p>{t.respuesta.externa.fuentes.filter(f=>enlaceSeguro(f.url)).map(f=><a key={f.url} className="block underline" target="_blank" rel="noopener noreferrer" href={f.url}>{f.titulo||f.url}</a>)}</div>}
      {t.respuesta.fuente?.startsWith('/')&&!t.respuesta.fuente.startsWith('//')&&<Link className="sicom-accion" to={t.respuesta.fuente}>Abrir fuente en SICOM</Link>}
      {t.respuesta.opciones?.map(o=><a key={o.id} className="sicom-accion" target="_blank" rel="noopener noreferrer" href={urlPractica(o.id,'solucion',o.titulo,o.nota)}>Abrir práctica: {o.titulo}</a>)}
     </div>
    </div>)}<div ref={final}/>
   </div>
   {guias.isError&&<p className="px-3 text-xs text-ink-600">Las guías adicionales no cargaron. Puedes usar el catálogo base.</p>}
   {consultando&&<p role="status" className="px-3 text-xs">Interpretando la pregunta…</p>}
   {aviso&&<p role="status" className="px-3 text-xs">{aviso}</p>}
   {estadoWeb.data?.activo&&publica===null&&<button type="button" disabled={consultando||gestion} className="mx-3 my-1 self-start text-xs underline" onClick={()=>{const q=sugerencia||texto;setPublica(q);setTema(temaPublico(q));setConfirmada(false);}}>Buscar información pública en Internet</button>}
   {publica!==null&&<form className="space-y-2 border-t p-3 text-xs" onSubmit={e=>{e.preventDefault();void externa();}}>
    <label>Pregunta pública que se enviará al proveedor<textarea className="input" required maxLength={500} value={publica} onChange={e=>{setPublica(e.target.value);setTema(temaPublico(e.target.value));setConfirmada(false);}}/></label>
    <label>Tema<select className="input" value={tema} onChange={e=>setTema(e.target.value)}>{['general','salud','ferreteria','alimentos','repuestos','tecnologia','belleza'].map(t=><option key={t}>{t}</option>)}</select></label>
    <label className="flex gap-2"><input type="checkbox" checked={confirmada} onChange={e=>setConfirmada(e.target.checked)}/> Confirmo que no contiene datos privados, comerciales ni de pacientes.</label>
    <button className="sicom-accion sicom-accion-principal" disabled={!confirmada||!publica.trim()||consultando||gestion}>Consultar web</button>
    <button type="button" className="sicom-accion ml-2" onClick={()=>setPublica(null)}>Cancelar</button>
   </form>}
   <form className="flex gap-2 border-t p-3" onSubmit={e=>{e.preventDefault();enviar();}}>
    <input ref={campo} className="input min-w-0" aria-label="Escribe tu pregunta" placeholder="Ej. Puse dos cafés y solo era uno" maxLength={400} value={texto} onChange={e=>setTexto(e.target.value)}/>
    <button className="sicom-accion sicom-accion-principal" aria-label="Enviar pregunta" disabled={!texto.trim()||consultando||gestion}><Send size={17}/></button>
   </form>
   {!!historial.length&&<div className="flex justify-between gap-2 px-3 pb-3 text-xs">
    {chat===null&&<button type="button" className="inline-flex items-center gap-1 underline" disabled={enviando||consultando} onClick={()=>{setHistorial([]);setAviso('');}}><Trash2 size={13}/> Borrar historial</button>}
    <button type="button" className="underline" disabled={enviando||consultando||historial.at(-1)?.enviada||historial.at(-1)?.respuesta.datoVivo} onClick={()=>void reportar()}>{historial.at(-1)?.enviada?'Duda enviada':enviando?'Enviando…':'No me resolvió · enviar duda'}</button>
   </div>}
  </section>}
 </>;
}
