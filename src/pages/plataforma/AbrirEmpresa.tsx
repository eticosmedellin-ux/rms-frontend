import {useState} from 'react';
import {Eye} from 'lucide-react';
import {apiClient} from '@/api/client';
import {getApiErrorMessage} from '@/api/errors';
import type {LoginResponse} from '@/types/auth';

export function AbrirEmpresa({id,nombre,activa}:{id:number;nombre:string;activa:boolean}){
 const [error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function abrir(){
  setError('');
  const origen=window.location.origin;
  const pestaña=window.open('about:blank','_blank');
  if(!pestaña){setError('Permite las ventanas emergentes para abrir la empresa.');return;}
  setBusy(true);
  let resolver:()=>void=()=>{};
  const lista=new Promise<void>(ok=>{resolver=ok;});
  const escuchar=(e:MessageEvent)=>{if(e.origin===origen&&e.source===pestaña&&e.data?.tipo==='sicom-empresa-lista')resolver();};
  window.addEventListener('message',escuchar);
  let reloj:number|undefined;
  try{
   pestaña.location.href=origen+'/entrada-empresa';
   const [respuesta]=await Promise.race([
    Promise.all([apiClient.post<LoginResponse>(`/plataforma/empresas/${id}/abrir`),lista]),
    new Promise<never>((_,rechazar)=>{reloj=window.setTimeout(()=>rechazar(new Error('La pestaña no respondió. Vuelve a intentarlo.')),20000);}),
   ]);
   if(pestaña.closed)throw new Error('La pestaña se cerró antes de abrir la sesión.');
   pestaña.postMessage({tipo:'sicom-empresa-sesion',sesion:respuesta.data},origen);
  }catch(e){pestaña.close();setError(getApiErrorMessage(e));}
  finally{window.removeEventListener('message',escuchar);window.clearTimeout(reloj);setBusy(false);}
 }
 return <span className="inline-flex flex-col items-end">
   <button type="button" disabled={!activa||busy} onClick={()=>void abrir()} title="Abrir empresa como administrador"
     aria-label={`Abrir ${nombre} como administrador en otra pestaña`} className="rounded p-2 text-ink-700 hover:bg-ink-100 disabled:opacity-40"><Eye size={18}/></button>
   {error&&<span role="alert" className="max-w-48 text-xs text-danger-600">{error}</span>}
 </span>;
}
