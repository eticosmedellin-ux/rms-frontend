import {Escenario} from './Escenario';
import {useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {apiClient} from '@/api/client';
import {useAuthStore} from '@/stores/authStore';
import {enPractica} from '@/stores/pestanaEmpresa';
import {ErrorBoundary} from '@/components/ErrorBoundary';
import InventarioPage from '@/pages/inventario/InventarioPage';
import ComprasPage from '@/pages/compras/ComprasPage';
import PosPage from '@/pages/pos/PosPage';
import {motorDemo} from './datos';
import {biblioteca} from './casos';
import '@/index.css';

const params=new URLSearchParams(location.search);
const caso=biblioteca.find(x=>x.id===params.get('caso')&&x.pasos);
const personalizacion=new URLSearchParams(location.hash.slice(1));
const titulo=personalizacion.get('titulo')?.slice(0,160),nota=personalizacion.get('nota')?.slice(0,600);
const eventos=new EventTarget();
if(enPractica&&caso){
 apiClient.defaults.adapter=motorDemo(caso.cajaCerrada,op=>eventos.dispatchEvent(new CustomEvent('demo',{detail:op})));
 useAuthStore.setState({usuarioId:1,empresaId:1,nombreCompleto:'Operador demo',nombreEmpresa:'Empresa de práctica',isAuthenticated:true,esAdministradorTotal:true});
}
const Pantalla=caso?.pantalla==='inventario'?InventarioPage:caso?.pantalla==='compras'?ComprasPage:PosPage;
const qc=new QueryClient({defaultOptions:{queries:{retry:false,refetchOnWindowFocus:false}}});
function Practica(){
 const [indice,setIndice]=useState(0),[hecho,setHecho]=useState(false),[libre,setLibre]=useState(params.get('modo')==='practica'),[destacar,setDestacar]=useState(true);
 const zona=useRef<HTMLDivElement>(null);
 const paso=caso?.pasos?.[indice],total=caso?.pasos?.length??0;
 useEffect(()=>{
  const fin=(e:Event)=>{if((e as CustomEvent).detail===caso?.meta)setHecho(true);};
  eventos.addEventListener('demo',fin);return()=>eventos.removeEventListener('demo',fin);
 },[]);
 useEffect(()=>{
  if(!paso||libre||!destacar||hecho)return;
  const root=zona.current;if(!root)return;
  let previo:HTMLElement|null=null;
  const normal=(s:string)=>s.normalize('NFD').replace(/\p{Diacritic}/gu,'').trim().toLowerCase();
  const localizar=()=>{
   const q=normal(paso[1]);
   const items=Array.from(root.querySelectorAll<HTMLElement>('button,input,select,textarea,label,td'));
   const el=items.filter(x=>x.getClientRects().length>0).find(x=>
    [x.getAttribute('aria-label'),x.getAttribute('title'),x.getAttribute('placeholder'),x.textContent].some(v=>v&&normal(v).includes(q)))??null;
   if(el!==previo){previo?.classList.remove('practica-objetivo');el?.classList.add('practica-objetivo');previo=el;}
  };
  localizar();
  const obs=new MutationObserver(localizar);obs.observe(root,{childList:true,subtree:true});
  const enfocar=()=>previo?.scrollIntoView({block:'nearest',behavior:'instant'});
  eventos.addEventListener('enfocar',enfocar);
  return()=>{obs.disconnect();previo?.classList.remove('practica-objetivo');eventos.removeEventListener('enfocar',enfocar);};
 },[paso,libre,destacar,hecho]);
 if(!enPractica||!caso)return <p className="p-6">Selecciona un caso desde la Biblioteca de soluciones.</p>;
 return <>
  <style>{'.practica-objetivo{outline:3px solid #059669!important;outline-offset:3px;box-shadow:0 0 0 6px #6ee7b760!important;scroll-margin:9rem}'}</style>
  <header className="sticky top-0 z-30 space-y-2 border-b border-amber-300 bg-amber-50 p-3 sm:px-6">
   <p className="text-xs font-bold uppercase tracking-wide text-amber-900">SICOM · Práctica aislada · Datos ficticios</p>
   <h1 className="font-semibold">{titulo||caso.titulo}</h1>
   {nota&&<p className="text-sm">{nota}</p>}
   {!libre&&!caso.acciones&&<progress aria-label="Progreso de la guía" max={total} value={hecho?total:indice+1} className="w-full max-w-xs accent-emerald-700"/>}
   {hecho?<p role="status" className="font-semibold text-emerald-800">✓ Ejercicio completado en la práctica.</p>:!libre&&!caso.acciones&&<p aria-live="polite" className="text-sm"><strong>Paso {indice+1} de {total}</strong> · {paso?.[0]}</p>}
   <div className="flex flex-wrap gap-2">
    {!caso.acciones&&!libre&&!hecho&&<><button className="sicom-accion" disabled={indice===0} onClick={()=>setIndice(i=>i-1)}>Anterior</button><button className="sicom-accion" disabled={indice+1>=total} onClick={()=>{setIndice(i=>i+1);setDestacar(true);}}>Siguiente paso</button><button className="sicom-accion" onClick={()=>{setDestacar(true);requestAnimationFrame(()=>eventos.dispatchEvent(new Event('enfocar')));}}>Señalar control</button></>}
    <button className="sicom-accion" onClick={()=>{setLibre(v=>!v);setDestacar(true);}}>{libre?'Ver solución':'Practicar sin guía'}</button>
    <button className="sicom-accion" onClick={()=>location.reload()}>Repetir</button>
    {!caso.acciones&&!hecho&&!caso.meta&&!libre&&indice+1===total&&<button className="sicom-accion sicom-accion-principal" onClick={()=>setHecho(true)}>Terminar recorrido</button>}
    <button className="sicom-accion" onClick={()=>window.close()}>Cerrar práctica</button>
   </div>
  </header>
  <div className="mx-auto max-w-7xl p-3 sm:p-6" ref={zona}>
   {caso.acciones?<Escenario acciones={caso.acciones} libre={libre} terminar={()=>setHecho(true)}/>:<MemoryRouter initialEntries={[`/${caso.pantalla??'pos'}?tab=${caso.tab??''}`]}><Pantalla/></MemoryRouter>}
  </div>
 </>;
}
createRoot(document.getElementById('root')!).render(<ErrorBoundary><QueryClientProvider client={qc}><Practica/></QueryClientProvider></ErrorBoundary>);
