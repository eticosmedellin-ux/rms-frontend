import {useQuery} from '@tanstack/react-query';
import {apiClient} from '@/api/client';
import {useAuthStore} from '@/stores/authStore';

export type Aplicacion = {
 app:{codigo:string;nombre:string;categoria:string;descripcion:string;ruta:string;dependeDe:Record<string,string>};
 publicada:boolean;autorizada:boolean;instalada:boolean;pendientes:string[];
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
