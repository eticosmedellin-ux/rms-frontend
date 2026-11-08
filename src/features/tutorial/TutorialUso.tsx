import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,CheckCircle2,Gamepad2,Lightbulb,RotateCcw,X} from 'lucide-react';
import {useAuthStore} from '@/stores/authStore';
import {coincide,abrirTutorial} from './interaccion';
import {ejercicios,modulos,type ModuloDemo} from './simulador/catalogo';
import {GuiaDemo} from './simulador/controles';
import {VentasDemo} from './simulador/VentasDemo';
import {RegistrosDemo} from './simulador/RegistrosDemo';

const clave=(empresa:unknown,usuario:unknown)=>`sicom-practica-v1:${empresa}:${usuario}`;
function leer(key:string):string[]{try{const a=JSON.parse(localStorage.getItem(key)??'[]');return Array.isArray(a)?a.filter(x=>typeof x==='string'):[];}catch{return [];}}
export function CatalogoTutorial(){
 const a=useAuthStore(),key=clave(a.empresaId,a.usuarioId);
 const [texto,setTexto]=useState(''),[version,setVersion]=useState(0);
 useEffect(()=>{const cambiar=()=>setVersion(x=>x+1);window.addEventListener('sicom-practica-progreso',cambiar);return()=>window.removeEventListener('sicom-practica-progreso',cambiar);},[]);
 const hechos=leer(key),visibles=modulos.filter(m=>coincide(m.nombre+' '+m.acciones.join(' '),texto));
 return <section className="space-y-4" data-progreso={version}>
  <div className="rounded-xl bg-ink-800 p-4 text-white"><Gamepad2/><h2 className="text-lg font-semibold">Centro de práctica</h2><p>Elige un módulo y prueba sus controles con datos demo.</p></div>
  <input type="search" className="input" aria-label="Buscar simulador" placeholder="Ventas, caja, proveedores…" value={texto} onChange={e=>setTexto(e.target.value)}/>
  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{visibles.map(m=>{
   const n=ejercicios(m).length,h=hechos.filter(x=>x.startsWith(m.id+':')).length;
   return <article key={m.id} className="space-y-2 rounded-xl border bg-white p-4"><h3 className="font-bold">{m.nombre}</h3><p className="text-sm">{h? `${h} de ${n} ejercicios completados`:'Pendiente'}</p><progress className="w-full accent-emerald-600" aria-label={`Progreso de ${m.nombre}`} max={n} value={h}/><button type="button" className="sicom-accion sicom-accion-principal w-full" onClick={()=>abrirTutorial(m.id)}>Abrir tutorial de {m.nombre}</button></article>;
  })}</div>
  {!visibles.length&&<p>No hay simuladores que coincidan.</p>}
 </section>;
}
function EjercicioDemo({modulo:m}:{modulo:ModuloDemo}){
 const a=useAuthStore(),key=clave(a.empresaId,a.usuarioId),opciones=ejercicios(m);
 const [elegido,setElegido]=useState(opciones[0].id),[libre,setLibre]=useState(false),[indice,setIndice]=useState(0),[hechos,setHechos]=useState<number[]>([]),[omitidos,setOmitidos]=useState<number[]>([]);
 const [revision,setRevision]=useState(0),[ayuda,setAyuda]=useState(false),[aviso,setAviso]=useState(''),[error,setError]=useState('');
 const ejercicio=opciones.find(e=>e.id===elegido)??opciones[0],paso=ejercicio.pasos[indice],total=ejercicio.pasos.length;
 const completado=hechos.length===total,fin=hechos.length+omitidos.length===total;
 const lienzo=useRef<HTMLDivElement>(null);
 function reiniciar(){setIndice(0);setHechos([]);setOmitidos([]);setRevision(x=>x+1);setAyuda(false);setAviso('');setError('');}
 function ir(i:number){setIndice(Math.max(0,Math.min(total-1,i)));setAyuda(false);setError('');}
 function orientar(){
  setAyuda(true);const objetivos=Array.from(lienzo.current?.querySelectorAll<HTMLElement>('[data-demo]')??[]);
  const elemento=objetivos.find(x=>x.dataset.demo?.split('|').includes(paso.id));
  elemento?.scrollIntoView({block:'nearest',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 }
 function omitir(){
  if(hechos.includes(indice)||omitidos.includes(indice)){ir(indice+1);return;}
  setOmitidos([...omitidos,indice]);ir(indice+1);
 }
 function accion(...ids:string[]){
  setError('');setAviso('');
  if(libre||completado)return;
  if(!ids.includes(paso.id)){setAviso('Acción aplicada en la práctica. Continúa con el control señalado.');return;}
  const nuevos=[...new Set([...hechos,indice])],pendientes=omitidos.filter(x=>x!==indice);setHechos(nuevos);setOmitidos(pendientes);
  if(nuevos.length===total){
   try{localStorage.setItem(key,JSON.stringify([...new Set([...leer(key),`${m.id}:${ejercicio.id}`])]));window.dispatchEvent(new Event('sicom-practica-progreso'));}catch{}
  }else{
   const siguiente=ejercicio.pasos.findIndex((_,i)=>i>indice&&!nuevos.includes(i)&&!pendientes.includes(i));
   const destino=siguiente>=0?siguiente:ejercicio.pasos.findIndex((_,i)=>!nuevos.includes(i)&&!pendientes.includes(i));
   if(destino>=0)ir(destino);
  }
 }
 function mostrarError(s:string){setError(s);setAviso('');}
 const objetivo=!libre&&!fin?paso.id:libre&&ayuda?(m.id==='pos'?'abrir|buscar|agregar|pago|finalizar':'crear|buscar|consultar'):'';
 return <div className="space-y-4">
  <div className="flex flex-wrap items-end gap-3">
   <label className="min-w-0 flex-1">Ejercicio<select className="input" value={elegido} onChange={e=>{setElegido(e.target.value);setLibre(false);reiniciar();}}>{opciones.map(e=><option key={e.id} value={e.id}>{e.nivel} · {e.nombre}</option>)}</select></label>
   <button type="button" className="sicom-accion" aria-pressed={libre} onClick={()=>{setLibre(!libre);reiniciar();}}>{libre?'Volver al modo guiado':'Práctica libre'}</button>
   <button type="button" className="sicom-accion" onClick={reiniciar}><RotateCcw size={16}/> Reiniciar</button>
  </div>
  <div className="rounded-xl border bg-white p-3" aria-live="polite">
   {libre?<p>{ayuda?'Prueba uno de los controles resaltados.':'Práctica libre · Experimenta con los controles.'}</p>:<>
    <div className="flex flex-wrap justify-between gap-2"><strong>{completado?<span className="inline-flex items-center gap-1 text-emerald-800"><CheckCircle2 size={18}/> Ejercicio completado</span>:fin?'Ejercicio recorrido con pasos omitidos':`Paso ${indice+1} de ${total} · ${paso.instruccion}`}</strong><span>{hechos.length}/{total} realizados{omitidos.length>0&&` · ${omitidos.length} omitidos`}</span></div>
    <progress aria-label="Progreso del ejercicio" className="w-full accent-emerald-600" max={total} value={hechos.length}/>
   </>}
   {error&&<p role="alert" className="mt-2 rounded border border-red-300 bg-red-50 p-2 text-red-800">{error}</p>}
   {aviso&&<p className="mt-1 text-xs text-amber-800">{aviso}</p>}
  </div>
  <div className="flex flex-wrap gap-2">
   <button type="button" className="sicom-accion" onClick={orientar}><Lightbulb size={16}/> Ayuda visual</button>
   {!libre&&<>
    <button type="button" className="sicom-accion" onClick={()=>ir(indice-1)} disabled={indice===0||fin}><ArrowLeft size={16}/> Anterior</button>
    <button type="button" className="sicom-accion" onClick={orientar} disabled={fin}>Repetir indicación</button>
    <button type="button" className="sicom-accion" disabled={indice===total-1||fin} onClick={()=>ir(indice+1)}>Siguiente <ArrowRight size={16}/></button>
    <button type="button" className="sicom-accion" disabled={fin||hechos.includes(indice)||omitidos.includes(indice)} onClick={omitir}>Omitir paso</button>
   </>}
  </div>
  <div ref={lienzo} className={`rounded-xl p-3 sm:p-4 ${objetivo?'bg-slate-200':'bg-ink-50'}`}>
   <GuiaDemo.Provider value={{objetivo}}>{m.id==='pos'?<VentasDemo key={revision} accion={accion} error={mostrarError} puedeFinalizar={libre||fin||paso.id==='finalizar'}/>:<RegistrosDemo key={revision} modulo={m} accion={accion} error={mostrarError}/>}</GuiaDemo.Provider>
  </div>
 </div>;
}
const alias:Record<string,string>={inicio:'pos',ventas:'pos',administracion:'usuarios',citas:'servicios',factura:'facturacion'};
export function TutorialGlobal(){
 const [modulo,setModulo]=useState<ModuloDemo|null>(null);
 const dialogo=useRef<HTMLDialogElement>(null);
 const a=useAuthStore(),sesion=clave(a.empresaId,a.usuarioId);
 useEffect(()=>{
  const abrir=(e:Event)=>{const id=(e as CustomEvent<{modulo?:string}>).detail?.modulo??'pos';setModulo(modulos.find(m=>m.id===(alias[id]??id))??modulos[0]);};
  window.addEventListener('sicom-abrir-tutorial',abrir);return()=>window.removeEventListener('sicom-abrir-tutorial',abrir);
 },[]);
 useEffect(()=>{setModulo(null);},[sesion]);
 useEffect(()=>{const d=dialogo.current;if(modulo&&!d?.open)d?.showModal();else if(!modulo&&d?.open)d.close();},[modulo]);
 return <dialog ref={dialogo} onClose={()=>setModulo(null)} className="m-auto max-h-[95dvh] w-[min(96vw,1150px)] max-w-none overflow-y-auto rounded-2xl bg-ink-50 p-0 text-ink-800 shadow-2xl backdrop:bg-slate-900/70" aria-labelledby="titulo-simulador">
  {modulo&&<>
   <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2 border-b bg-white p-3 sm:p-5">
    <div><p className="text-xs font-bold uppercase tracking-wide text-emerald-800">SICOM · Entorno de práctica</p><h2 id="titulo-simulador" className="text-lg font-bold">{modulo.nombre}</h2></div>
    <button type="button" className="sicom-accion" autoFocus onClick={()=>dialogo.current?.close()}><X size={18}/> Cerrar tutorial</button>
   </header>
   <main className="p-3 sm:p-5"><EjercicioDemo key={modulo.id} modulo={modulo}/></main>
  </>}
 </dialog>;
}
