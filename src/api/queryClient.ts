import {QueryClient} from '@tanstack/react-query';
import {useAuthStore} from '@/stores/authStore';
export function contextoConsulta(a=useAuthStore.getState()) {
 return JSON.stringify([a.empresaId,a.usuarioId,a.isAuthenticated,a.esSuperadmin,a.esAdministradorTotal,a.permisos,a.roles,a.accesoClientesContables]);
}
export const queryClient=new QueryClient({defaultOptions:{queries:{retry:1,refetchOnWindowFocus:false}}});
// Incluye cambio de perfil/permisos; refrescar el token no vacía el catálogo.
useAuthStore.subscribe((actual,anterior)=>{if(contextoConsulta(actual)!==contextoConsulta(anterior)){queryClient.clear();}});
