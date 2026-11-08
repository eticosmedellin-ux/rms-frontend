import {useQuery} from '@tanstack/react-query';
import {apiClient} from '@/api/client';
import {useAuthStore} from '@/stores/authStore';
export type Guia={id:number;titulo:string;plantilla:string;indicacion:string;estado:'BORRADOR'|'APROBADO'|'PUBLICADO'};
export const rutaAdmin='/plataforma/ayuda/tutoriales';
export function useGuias(admin=false){
 const sesion=useAuthStore(s=>s.usuarioId);
 return useQuery({queryKey:['guias-biblioteca',admin,sesion],queryFn:async()=>(await apiClient.get<Guia[]>(admin?rutaAdmin:'/ayuda/tutoriales')).data,retry:false});
}
export function urlPractica(plantilla:string,modo:string,titulo='',nota=''){
 const hash=new URLSearchParams({titulo,nota});
 return `${import.meta.env.BASE_URL}practica.html?caso=${encodeURIComponent(plantilla)}&modo=${modo}#${hash}`;
}
