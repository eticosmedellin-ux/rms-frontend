import {useAuthStore} from '@/stores/authStore';
export function usePestanas(modulo:string){const s=useAuthStore();return (id:string)=>s.esSuperadmin||s.esAdministradorTotal||!s.permisos.includes(modulo+'_PESTANAS')||s.permisos.includes(modulo+'_TAB_'+id.toUpperCase().replaceAll('-','_'));}
export function useEnvioCliente(modulo:string){const s=useAuthStore();return s.esSuperadmin||s.esAdministradorTotal||s.permisos.includes(modulo+'_ENVIAR_CLIENTE');}
