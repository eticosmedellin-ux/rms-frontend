import {useQuery} from '@tanstack/react-query';
import {apiClient} from '@/api/client';
import {useAuthStore} from '@/stores/authStore';

export type Aplicacion = {
 app:{codigo:string;nombre:string;categoria:string;descripcion:string;ruta:string;habilita:string[];funciones:string[];dependeDe:Record<string,string>};
 publicada:boolean;autorizada:boolean;instalada:boolean;pendientes:string[];
 base:boolean;autorizacionDirecta:boolean;borrador:boolean;puedeDesinstalar:boolean;icono:string;tituloAviso:string;
 version:string;novedades:string;novedadDesde:string|null;
};
export function useCatalogoAplicaciones(){
 const empresa=useAuthStore(s=>s.empresaId);
 const usuario=useAuthStore(s=>s.usuarioId);
 const habilitado=useAuthStore(s=>s.esAdministradorTotal&&!s.esSuperadmin);
 return useQuery({
  queryKey:['tienda-aplicaciones',empresa,usuario],
  queryFn:async()=>(await apiClient.get<Aplicacion[]>('/aplicaciones')).data,
  enabled:habilitado&&!!empresa&&!!usuario,
  staleTime:30_000,refetchInterval:60_000,retry:false,
 });
}

export function useMenuAplicaciones(){
 const empresa=useAuthStore(s=>s.empresaId),usuario=useAuthStore(s=>s.usuarioId);
 return useQuery({
  queryKey:['menu-aplicaciones',empresa,usuario],
  queryFn:async()=>(await apiClient.get<Record<string,{nombre:string;icono:string}>>('/aplicaciones/menu')).data,
  enabled:!!empresa&&!!usuario,staleTime:30_000,refetchInterval:60_000,retry:false,
 });
}
