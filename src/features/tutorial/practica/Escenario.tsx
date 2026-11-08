import {useState} from 'react';
import type {Accion} from './ampliacion';
export function Escenario({acciones,libre,terminar}:{acciones:Accion[];libre:boolean;terminar:()=>void}){
 const [indice,setIndice]=useState(0),[eleccion,setEleccion]=useState(''),[error,setError]=useState(false),[resultados,setResultados]=useState<string[]>([]);
 const actual=acciones[indice],opciones=indice%2===0?[...actual.opciones].reverse():actual.opciones;
 const realizado=resultados.length>indice;
 return <div className="grid gap-4 sm:grid-cols-2">
  <section className="space-y-3 rounded-xl border bg-white p-4">
   <p className="text-xs font-semibold text-ink-500">Ejercicio complementario · {indice+1}/{acciones.length}</p>
   <h2 className="font-bold">{actual.campo}</h2>
   {!libre&&<p className="text-sm">Elige una opción y confirma el cambio de prueba.</p>}
   <select className={`input ${!libre&&!realizado?'ring-2 ring-emerald-500':''}`} aria-label={actual.campo} value={eleccion} disabled={realizado} onChange={e=>{setEleccion(e.target.value);setError(false);}}><option value="">Selecciona…</option>{opciones.map(o=><option key={o}>{o}</option>)}</select>
   {error&&<p role="alert" className="rounded bg-red-50 p-2 text-red-700">La opción no coincide con la situación. Revisa los datos y vuelve a intentar.</p>}
   {!realizado&&<button className="sicom-accion sicom-accion-principal" disabled={!eleccion} onClick={()=>{
    if(eleccion!==actual.opciones[actual.respuesta]){setError(true);return;}
    setResultados([...resultados,actual.resultado]);if(indice+1===acciones.length)terminar();
   }}>{actual.boton}</button>}
   {realizado&&indice+1<acciones.length&&<button className="sicom-accion sicom-accion-principal" onClick={()=>{setIndice(indice+1);setEleccion('');}}>Continuar</button>}
  </section>
  <section className="rounded-xl border bg-white p-4" aria-live="polite"><h2 className="font-bold">Resultado de la práctica</h2>{resultados.length?<ul className="space-y-2">{resultados.map(r=><li key={r} className="rounded bg-emerald-50 p-2">✓ {r}</li>)}</ul>:<p className="text-sm">Aquí verás el resultado de tu elección.</p>}</section>
 </div>;
}
