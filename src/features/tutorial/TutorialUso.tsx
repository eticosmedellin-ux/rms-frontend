import {useEffect,useState} from 'react';
import {BookOpen,Gamepad2,RotateCcw} from 'lucide-react';
import {coincide} from './guia';
import {biblioteca} from './practica/casos';

const url=(id:string,modo:string)=>`${import.meta.env.BASE_URL}practica.html?caso=${encodeURIComponent(id)}&modo=${modo}`;
export function CatalogoTutorial(){
 const [texto,setTexto]=useState(''),[grupo,setGrupo]=useState('');
 const grupos=[...new Set(biblioteca.map(c=>c.grupo))];
 const visibles=biblioteca.filter(c=>(!grupo||c.grupo===grupo)&&coincide(c.grupo+' '+c.titulo,texto));
 return <section className="space-y-4">
  <div className="rounded-xl bg-ink-800 p-5 text-white"><h2 className="text-xl font-bold">Biblioteca de soluciones SICOM</h2><p className="mt-1 text-sm">Encuentra una situación cotidiana y resuélvela en la pantalla de SICOM con datos ficticios.</p><p className="mt-2 text-xs">{biblioteca.filter(c=>c.pasos).length} prácticas disponibles · {biblioteca.length} situaciones en el catálogo</p></div>
  <div className="grid gap-2 sm:grid-cols-2">
   <input type="search" className="input" aria-label="Buscar problema" placeholder="Ej. Cantidad incorrecta o cierre de caja" value={texto} onChange={e=>setTexto(e.target.value)}/>
   <select className="input" aria-label="Filtrar por módulo" value={grupo} onChange={e=>setGrupo(e.target.value)}><option value="">Todos los módulos</option>{grupos.map(g=><option key={g}>{g}</option>)}</select>
  </div>
  {!visibles.length&&<p>No encontramos un caso que coincida.</p>}
  {grupos.map(g=>{
   const casos=visibles.filter(c=>c.grupo===g);
   if(!casos.length)return null;
   return <section key={g} className="space-y-2"><h3 className="font-bold">{g}</h3><div className="grid gap-2 lg:grid-cols-2">{casos.map(c=><article className="space-y-2 rounded-xl border bg-white p-3" key={c.id}>
    <h4 className="font-semibold">{c.titulo}</h4>
    {c.pasos?<div className="flex flex-wrap gap-2">
     <a className="sicom-accion sicom-accion-principal" target="_blank" rel="noopener noreferrer" href={url(c.id,'solucion')}><BookOpen size={16}/> Ver solución</a>
     <a className="sicom-accion" target="_blank" rel="noopener noreferrer" href={url(c.id,'practica')}><Gamepad2 size={16}/> Practicar</a>
     <a className="sicom-accion" target="_blank" rel="noopener noreferrer" href={url(c.id,'solucion')}><RotateCcw size={16}/> Repetir</a>
    </div>:<p className="text-xs text-ink-500">Práctica todavía no disponible</p>}
   </article>)}</div></section>;
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
