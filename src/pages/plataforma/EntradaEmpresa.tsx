import {useEffect,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuthStore} from '@/stores/authStore';
import {usePosStore} from '@/stores/posStore';
import type {LoginResponse} from '@/types/auth';

export default function EntradaEmpresa(){
 const navigate=useNavigate(),[error,setError]=useState('');
 useEffect(()=>{
  const origen=window.location.origin, emisor=window.opener;
  if(!emisor){setError('Abre esta entrada desde el ojo en Plataforma → Empresas.');return;}
  const mensaje=(e:MessageEvent)=>{
   if(e.origin!==origen||e.source!==emisor||e.data?.tipo!=='sicom-empresa-sesion')return;
   const datos=e.data.sesion as LoginResponse;
   if(!datos?.accessToken||!datos.esAdministradorTotal||datos.esSuperadmin)return;
   usePosStore.getState().reset();
   useAuthStore.getState().setSession(datos);
   window.opener=null;
   navigate('/',{replace:true});
  };
  window.addEventListener('message',mensaje);
  emisor.postMessage({tipo:'sicom-empresa-lista'},origen);
  const timeout=window.setTimeout(()=>setError('No se pudo abrir la sesión. Cierra esta pestaña y vuelve a pulsar el ojo.'),25000);
  return()=>{window.removeEventListener('message',mensaje);window.clearTimeout(timeout);};
 },[navigate]);
 return <main className="p-6"><p role={error?'alert':'status'}>{error||'Abriendo cuenta de empresa…'}</p></main>;
}
