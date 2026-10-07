import { useState } from 'react';
import { useParams,useNavigate,Link } from 'react-router-dom';
import { useQuery,useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { useAuthStore } from '@/stores/authStore';
import type { LoginResponse } from '@/types/auth';
import { getApiErrorMessage } from '@/api/errors';
interface Perfil {id:number;nombre:string;apellido:string}
export default function PerfilesLogin(){
 const {acceso}=useParams();const navigate=useNavigate();const qc=useQueryClient();
 const [perfil,setPerfil]=useState<Perfil|null>(null),[password,setPassword]=useState(''),[error,setError]=useState(''),[ocupado,setOcupado]=useState(false);
 const {data,isLoading,isError}=useQuery({queryKey:['perfiles',acceso],queryFn:async()=>(await apiClient.get<Perfil[]>(`/auth/empresa/${acceso}/perfiles`)).data,retry:false});
 async function entrar(e:React.FormEvent){e.preventDefault();if(!perfil||ocupado)return;setOcupado(true);setError('');
 try{const r=(await apiClient.post<LoginResponse>(`/auth/empresa/${acceso}/login`,{usuarioId:perfil.id,password})).data;qc.clear();useAuthStore.getState().setSession(r);const cfg=(await apiClient.get<{facturador:boolean}>('/sicom/me')).data;navigate(cfg.facturador?'/app/facturacion':'/',{replace:true});}
 catch(e){setError(getApiErrorMessage(e,'No fue posible iniciar sesión'));}finally{setOcupado(false);setPassword('');}}
 return <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6"><section className="w-full max-w-3xl text-center"><h1 className="text-3xl font-semibold">SICOM</h1><p className="mt-3 text-slate-300">{perfil?'Ingresa tu contraseña':'¿Quién va a ingresar?'}</p>
 {isLoading&&<p className="mt-8">Cargando perfiles…</p>}{isError&&<p className="mt-8 text-red-300">El enlace de empresa no está disponible.</p>}
 {!perfil&&<div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-5">{data?.map(p=><button key={p.id} onClick={()=>{setPerfil(p);setError('');}} className="rounded-2xl p-5 bg-slate-800 hover:bg-slate-700 focus:ring-2 focus:ring-green-400"><span className="mx-auto flex h-20 w-20 rounded-2xl bg-emerald-600 items-center justify-center text-3xl" aria-hidden>{p.nombre.slice(0,1).toUpperCase()}</span><span className="block mt-4">{p.nombre} {p.apellido}</span></button>)}</div>}
 {perfil&&<form onSubmit={entrar} className="mt-8 mx-auto max-w-sm space-y-4"><h2 className="text-xl">{perfil.nombre} {perfil.apellido}</h2><label className="block text-left">Contraseña<input autoFocus required autoComplete="current-password" type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full p-3 rounded bg-slate-800"/></label>{error&&<p role="alert" className="text-red-300">{error}</p>}<button disabled={ocupado} className="w-full rounded bg-emerald-600 p-3 disabled:opacity-50">{ocupado?'Ingresando…':'Ingresar'}</button><button type="button" onClick={()=>{setPerfil(null);setPassword('');setError('');}} className="text-slate-300">Cambiar perfil</button></form>}
 <Link to="/login" className="block mt-10 text-sm text-slate-400">Acceso general</Link></section></main>;
}
