import {useEffect,useState} from 'react';
import {BookOpen,Gamepad2,RotateCcw} from 'lucide-react';
import {coincide} from './guia';
import {biblioteca} from './practica/casos';

import {urlPractica,useGuias} from './practica/bibliotecaApi';
export function CatalogoTutorial(){
 const [texto,setTexto]=useState(''),[grupo,setGrupo]=useState('');
 const q=useGuias();
 const base=biblioteca.map(c=>({...c,plantilla:c.id,indicacion:''}));
 const propias=(q.data??[]).flatMap(g=>{const c=biblioteca.find(x=>x.id===g.plantilla);return c?[{...c,id:'publicada-'+g.id,titulo:g.titulo,plantilla:g.plantilla,indicacion:g.indicacion}]:[];});
 const todas=[...base,...propias];
 const grupos=[...new Set(todas.map(c=>c.grupo))];
 const visibles=todas.filter(c=>(!grupo||c.grupo===grupo)&&coincide(c.grupo+' '+c.titulo,texto));
 return <section className="space-y-4">
  <div className="rounded-xl bg-ink-800 p-5 text-white"><h2 className="text-xl font-bold">Biblioteca de soluciones SICOM</h2><p className="mt-1 text-sm">Encuentra una situación cotidiana y practícala con datos ficticios. Los ejercicios complementarios están identificados.</p><p className="mt-2 text-xs">{biblioteca.filter(c=>c.pasos).length} prácticas disponibles · {biblioteca.length} situaciones en el catálogo</p></div>
  <div className="grid gap-2 sm:grid-cols-2">
   <input type="search" className="input" aria-label="Buscar problema" placeholder="Ej. Cantidad incorrecta o cierre de caja" value={texto} onChange={e=>setTexto(e.target.value)}/>
   <select className="input" aria-label="Filtrar por módulo" value={grupo} onChange={e=>setGrupo(e.target.value)}><option value="">Todos los módulos</option>{grupos.map(g=><option key={g}>{g}</option>)}</select>
  </div>
  {q.isError&&<p role="status" className="text-sm">Las guías adicionales no cargaron. <button className="underline" onClick={()=>void q.refetch()}>Reintentar</button></p>}
  {!visibles.length&&<p>No encontramos un caso que coincida.</p>}
  {grupos.map(g=>{
   const casos=visibles.filter(c=>c.grupo===g);
   if(!casos.length)return null;
   return <details key={g} open={Boolean(grupo||texto.trim())||undefined} className="rounded-xl border bg-white p-3"><summary className="cursor-pointer font-bold">{g} <span className="text-xs text-ink-500">· {casos.length} problemas</span></summary><div className="mt-3 grid gap-2 lg:grid-cols-2">{casos.map(c=><article className="space-y-2 rounded-xl border bg-white p-3" key={c.id}>
    <h4 className="font-semibold">{c.titulo}</h4>
    {c.acciones&&<p className="text-xs text-ink-500">Ejercicio complementario</p>}
    {c.pasos?<div className="flex flex-wrap gap-2">
     <a className="sicom-accion sicom-accion-principal" target="_blank" rel="noopener noreferrer" href={urlPractica(c.plantilla,'solucion',c.titulo,c.indicacion)}><BookOpen size={16}/> Ver solución</a>
     <a className="sicom-accion" target="_blank" rel="noopener noreferrer" href={urlPractica(c.plantilla,'practica',c.titulo,c.indicacion)}><Gamepad2 size={16}/> Practicar</a>
     <a className="sicom-accion" target="_blank" rel="noopener noreferrer" href={urlPractica(c.plantilla,'solucion',c.titulo,c.indicacion)}><RotateCcw size={16}/> Repetir</a>
    </div>:<p className="text-xs text-ink-500">Práctica todavía no disponible</p>}
   </article>)}</div></details>;
  })}
 </section>;
}
export function TutorialGlobal(){
 useEffect(()=>{
  const abrir=()=>window.location.assign(import.meta.env.BASE_URL+'configuracion?seccion=tutorial');
  window.addEventListener('sicom-abrir-tutorial',abrir);return()=>window.removeEventListener('sicom-abrir-tutorial',abrir);
 },[]);
 return null;
}
