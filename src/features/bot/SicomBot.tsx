import {Link} from 'react-router-dom';
import {usePosStore} from '@/stores/posStore';
import {consultar,detectar} from './consultas';
import {useEffect,useRef,useState} from 'react';
import {Bot,Minus,Send,Trash2,X} from 'lucide-react';
import {useGuias,urlPractica} from '../tutorial/practica/bibliotecaApi';
import {resolver,type Respuesta} from './resolver';
import {apiClient} from '@/api/client';

type Turno={pregunta:string;respuesta:Respuesta;enviada?:boolean};
function leer(k:string):Turno[]{try{const v=JSON.parse(localStorage.getItem(k)??'[]');return Array.isArray(v)?v.filter(x=>typeof x?.pregunta==='string'&&typeof x?.respuesta?.texto==='string').slice(-30):[];}catch{return [];}}
export function SicomBot({identidad}:{identidad:string}){
 const sede=usePosStore(s=>s.sucursalId);
 const solicitud=useRef<AbortController|null>(null);
 const [consultando,setConsultando]=useState(false);
 useEffect(()=>()=>solicitud.current?.abort(),[]);
 const clave='sicom-bot-v1:'+identidad;
 const [estado,setEstado]=useState<'cerrado'|'abierto'|'minimizado'>('cerrado'),[texto,setTexto]=useState('');
 const [historial,setHistorial]=useState<Turno[]>(()=>leer(clave)),[aviso,setAviso]=useState(''),[enviando,setEnviando]=useState(false);
 const final=useRef<HTMLDivElement>(null),campo=useRef<HTMLInputElement>(null),boton=useRef<HTMLButtonElement>(null);
 const guias=useGuias(false,estado!=='cerrado');
 useEffect(()=>{try{localStorage.setItem(clave,JSON.stringify(historial.filter(t=>!t.respuesta.datoVivo)));}catch{}},[clave,historial]);
 useEffect(()=>{if(estado==='abierto')campo.current?.focus();},[estado]);
 useEffect(()=>{if(estado==='abierto')final.current?.scrollIntoView({block:'nearest'});},[historial,estado]);
 function cerrar(modo:'cerrado'|'minimizado'){setEstado(modo);boton.current?.focus();}
 async function enviar(){
  const pregunta=texto.trim();if(!pregunta||solicitud.current)return;
  const ultimo=historial.at(-1),consulta=detectar(pregunta,ultimo?.respuesta.pendiente);
  setTexto('');setAviso('');
  if(consulta){
   const ac=new AbortController();solicitud.current=ac;setConsultando(true);
   try{
    const respuesta=await consultar(consulta,sede,ac.signal);
    if(!ac.signal.aborted&&usePosStore.getState().sucursalId===sede)setHistorial(prev=>[...prev,{pregunta,respuesta}].slice(-30));
   }finally{if(solicitud.current===ac){solicitud.current=null;setConsultando(false);}}
   return;
  }
  const respuesta=resolver(pregunta,guias.data??[],ultimo?.respuesta.aclarar?ultimo.pregunta:'');
  setHistorial(prev=>[...prev,{pregunta,respuesta}].slice(-30));
 }
 useEffect(()=>{solicitud.current?.abort();setHistorial(prev=>prev.filter(t=>!t.respuesta.datoVivo));},[sede]);
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
   <div role="log" aria-live="polite" className="min-h-32 flex-1 space-y-3 overflow-auto p-3 text-sm">
    {!historial.length&&<p>¿Qué necesitas hacer en SICOM? Escríbeme con tus propias palabras.</p>}
    {historial.map((t,i)=><div key={i} className="space-y-2">
     <p className="ml-6 rounded-xl bg-emerald-100 p-2"><strong>Tú: </strong>{t.pregunta}</p>
     <div className="mr-4 space-y-2 rounded-xl bg-ink-50 p-2"><p className="whitespace-pre-line">{t.respuesta.texto}</p>
      {t.respuesta.fuente&&<Link className="sicom-accion" to={t.respuesta.fuente}>Abrir fuente en SICOM</Link>}
      {t.respuesta.opciones?.map(o=><a key={o.id} className="sicom-accion" target="_blank" rel="noopener noreferrer" href={urlPractica(o.id,'solucion',o.titulo,o.nota)}>Abrir práctica: {o.titulo}</a>)}
     </div>
    </div>)}<div ref={final}/>
   </div>
   {guias.isError&&<p className="px-3 text-xs text-ink-600">Las guías adicionales no cargaron. Puedes usar el catálogo base.</p>}
   {consultando&&<p role="status" className="px-3 text-xs">Consultando la sucursal…</p>}
   {aviso&&<p role="status" className="px-3 text-xs">{aviso}</p>}
   <form className="flex gap-2 border-t p-3" onSubmit={e=>{e.preventDefault();enviar();}}>
    <input ref={campo} className="input min-w-0" aria-label="Escribe tu pregunta" placeholder="Ej. Puse dos cafés y solo era uno" maxLength={400} value={texto} onChange={e=>setTexto(e.target.value)}/>
    <button className="sicom-accion sicom-accion-principal" aria-label="Enviar pregunta" disabled={!texto.trim()||consultando}><Send size={17}/></button>
   </form>
   {!!historial.length&&<div className="flex justify-between gap-2 px-3 pb-3 text-xs">
    <button type="button" className="inline-flex items-center gap-1 underline" disabled={enviando||consultando} onClick={()=>{setHistorial([]);setAviso('');}}><Trash2 size={13}/> Borrar historial</button>
    <button type="button" className="underline" disabled={enviando||consultando||historial.at(-1)?.enviada||historial.at(-1)?.respuesta.datoVivo} onClick={()=>void reportar()}>{historial.at(-1)?.enviada?'Duda enviada':enviando?'Enviando…':'No me resolvió · enviar duda'}</button>
   </div>}
  </section>}
 </>;
}
