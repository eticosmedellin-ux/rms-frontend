import {useQuery} from '@tanstack/react-query';
import {apiClient} from '@/api/client';
import {useAuthStore} from '@/stores/authStore';
export type Paso={id:string;boton:string;titulo:string;explicacion:string;permiso:string|null;seccion:string};
export type Modulo={id:string;nombre:string;ruta:string;pasos:Paso[]};
export type Guia={version:string;modulos:Modulo[]};
export function useGuia(habilitado=true){const a=useAuthStore();return useQuery({queryKey:['guia-uso',a.empresaId,a.usuarioId,a.permisos.join('|'),a.esSuperadmin,a.esAdministradorTotal],queryFn:async()=>(await apiClient.get<Guia>('/ayuda/guia')).data,enabled:habilitado,staleTime:300000,retry:false});}
export {normalizar,coincide,abrirTutorial} from './interaccion';
