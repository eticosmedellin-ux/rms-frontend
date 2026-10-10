import {useAuthStore} from '@/stores/authStore';
export function usePermisosOperacion(modulo:string){
 const s=useAuthStore(); const admin=s.esSuperadmin||s.esAdministradorTotal;
 const puede=(accion:string)=>admin||s.permisos.includes(`${modulo}_${accion}`);
 const empresa=puede('VER_EMPRESA');
 return {puede,empresa,consultar:puede('CONSULTAR')&&(empresa||puede('VER_PROPIOS')||puede('VER_SUCURSAL')),operar:puede('OPERAR'),administrar:puede('ADMINISTRAR'),reportes:puede('VER_REPORTES')&&empresa,costos:puede('VER_COSTOS')};
}
