import {ConteoTareas} from '@/features/inventario/ConteoTareas';
import {TutorialGlobal} from '@/features/tutorial/TutorialUso';
import {useApariencia} from '@/features/apariencia/AparienciaProvider';
import {fondo} from '@/features/apariencia/tema';
import {Suspense,useEffect,useState,type ReactNode} from 'react';
import {NavigationType,UNSAFE_LocationContext,useLocation,useNavigate,type Location} from 'react-router-dom';
import { InicioModulos,useModulosInicio } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { useMiPlan } from '@/hooks/usePlataforma';
import { useAuthStore } from '@/stores/authStore';
import { useAplicarTema } from '@/hooks/useAplicarTema';
import { AsistenteAyuda } from '@/components/ayuda/AsistenteAyuda';
import { ShieldAlert,X,Home } from 'lucide-react';

const MENSAJE_LICENCIA: Record<string, string> = {
  SUSPENDIDA: 'La licencia de tu empresa está suspendida temporalmente.',
  VENCIDA: 'La licencia de tu empresa venció.',
};

type Pestana={id:string;modulo:string;ubicacion:Location};
export function AppLayout({modulos}:{modulos:{path:string;element:ReactNode}[]}){
 const identidad=useAuthStore(a=>a.empresaId+':'+a.usuarioId);
 return <Espacio key={identidad} modulos={modulos}/>;
}
function Espacio({modulos}:{modulos:{path:string;element:ReactNode}[]}){
 const apariencia=useApariencia(),esSuperadmin=useAuthStore(a=>a.esSuperadmin);
 const {data:miPlan}=useMiPlan();
 const visibles=useModulosInicio();
 const location=useLocation(),navigate=useNavigate();
 const [cerradas]=useState(()=>new Set<string>());
 const [tabs,setTabs]=useState<Pestana[]>([]),[activa,setActiva]=useState('inicio'),[aviso,setAviso]=useState('');
 const ruta=(l:Location)=>l.pathname+l.search+l.hash;
 const buscarModulo=(r:string)=>{
  const url=new URL(r,window.location.origin),sub=url.searchParams.get('tab');
  if(url.pathname==='/servicios'&&['citas','ordenes'].includes(sub??'')&&visibles.some(m=>m.to.startsWith('/servicios?tab=')))
   return visibles.find(m=>m.to==='/servicios?tab='+sub);
  return visibles.find(m=>m.to===url.pathname+url.search)??visibles.find(m=>m.to===url.pathname)??visibles.find(m=>m.to.split('?')[0]===url.pathname);
 };
 function seleccionar(t:Pestana){setActiva(t.id);setAviso('');navigate(ruta(t.ubicacion),{state:{...t.ubicacion.state,sicomTab:t.id}});}
 function inicio(){setActiva('inicio');setAviso('');navigate('/');}
 function abrir(r:string,nueva=false){
  const existente=tabs.find(t=>t.modulo===r);
  if(existente&&!nueva){seleccionar(existente);return;}
  if(tabs.length>=10){setAviso('Ya tienes 10 módulos abiertos. Cierra una pestaña para abrir otra.');return;}
  const url=new URL(r,window.location.origin),id=crypto.randomUUID();
  seleccionar({id,modulo:r,ubicacion:{pathname:url.pathname,search:url.search,hash:url.hash,state:null,key:id}});
 }
 useEffect(()=>{
  if(location.pathname==='/'){setActiva('inicio');return;}
  const m=buscarModulo(ruta(location));
  if(!m){if(miPlan||esSuperadmin)navigate('/',{replace:true});return;}
  const marcado=location.state?.sicomTab;
  if(typeof marcado==='string'&&cerradas.has(marcado)){navigate('/',{replace:true});return;}
  const anterior=tabs.find(t=>t.id===activa&&t.modulo.split('?')[0]===location.pathname);
  const id=typeof marcado==='string'?marcado:anterior?.id??tabs.find(t=>t.modulo===m.to)?.id??location.key;
  if(!tabs.some(t=>t.id===id)&&tabs.length>=10){
   navigate(activa==='inicio'?'/':ruta(tabs.find(t=>t.id===activa)?.ubicacion??{...location,pathname:'/',search:'',hash:''}),{replace:true,state:{sicomTab:activa}});
   setAviso('Ya tienes 10 módulos abiertos. Cierra una pestaña para abrir otra.');return;
  }
  setActiva(id);
  setTabs(prev=>prev.some(t=>t.id===id)?prev.map(t=>t.id===id?{...t,ubicacion:location}:t):[...prev,{id,modulo:m.to,ubicacion:location}]);
 },[location,miPlan,esSuperadmin,visibles.length]);
 function cerrar(id:string){
  cerradas.add(id);setTabs(prev=>prev.filter(t=>t.id!==id));
  if(id===activa)inicio();
 }
 useAplicarTema();
  if (!esSuperadmin && miPlan && miPlan.estadoLicencia !== 'ACTIVA') {
    return (
      <div className="flex h-screen items-center justify-center bg-ink-50 px-6 dark:bg-ink-900">
        <div className="max-w-md rounded-xl border border-ink-100 bg-white p-8 text-center shadow-card dark:border-ink-700 dark:bg-ink-800">
          <ShieldAlert size={36} className="mx-auto mb-3 text-amber-500" />
          <h1 className="font-display text-lg font-semibold text-ink-800 dark:text-ink-100">Acceso no disponible</h1>
          <p className="mt-2 text-sm text-ink-500 dark:text-ink-300">
            {MENSAJE_LICENCIA[miPlan.estadoLicencia] ?? 'Tu licencia no está activa.'}
          </p>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-300">Contacta a tu proveedor del sistema para regularizarla.</p>
        </div>
      </div>
    );
  }

 return <div className="sicom-sistema flex h-dvh flex-col bg-ink-50 dark:bg-ink-900" style={apariencia.activo?fondo(apariencia.sistema):undefined}>
  <Topbar />
  <nav aria-label="Pestañas internas" className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-ink-100 bg-white px-3 py-2 dark:bg-ink-800">
   <button type="button" aria-current={activa==='inicio'?'page':undefined} onClick={inicio} className={pastilla(activa==='inicio')}><Home size={15}/>Inicio</button>
   {tabs.filter(t=>buscarModulo(t.modulo)).map(t=><div key={t.id} className={pastilla(t.id===activa)}>
    <button type="button" aria-current={t.id===activa?'page':undefined} onClick={()=>seleccionar(t)} className="max-w-44 truncate">{buscarModulo(t.modulo)?.label}</button>
    <button type="button" aria-label={'Cerrar '+buscarModulo(t.modulo)?.label} onClick={()=>cerrar(t.id)} className="rounded-full p-1 hover:bg-black/10"><X size={14}/></button>
   </div>)}
  </nav>
  {aviso&&<p role="status" className="border-b bg-amber-50 px-4 py-2 text-sm text-amber-900">{aviso}</p>}
  <div className="relative min-h-0 flex-1">
   {activa==='inicio'&&<main className="h-full overflow-y-auto" style={apariencia.activo&&apariencia.inicio?fondo(apariencia.inicio):undefined}><InicioModulos modulos={visibles} abrir={abrir}/></main>}
   {tabs.filter(t=>buscarModulo(t.modulo)).map(t=><main key={t.id} hidden={t.id!==activa} className="h-full overflow-y-auto px-3 py-4 sm:px-6 sm:py-6">
    <UNSAFE_LocationContext.Provider value={{location:t.ubicacion,navigationType:NavigationType.Pop}}>
     <Suspense fallback={<p>Cargando módulo…</p>}>{t.id===activa&&<ConteoTareas/>}{modulos.find(m=>m.path===t.ubicacion.pathname)?.element}</Suspense>
    </UNSAFE_LocationContext.Provider>
   </main>)}
  </div>
  <AsistenteAyuda/><TutorialGlobal/>
 </div>;
}
function pastilla(activa:boolean){
 return 'flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold '+(activa?'border-emerald-700 bg-emerald-800 text-white':'border-ink-200 bg-ink-50 text-ink-700');
}
