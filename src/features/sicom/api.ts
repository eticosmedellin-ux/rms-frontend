import { useQuery } from '@tanstack/react-query';
import {useAuthStore} from '@/stores/authStore';
import { apiClient } from '@/api/client';
export const ACCIONES = {
 VENDER:'Vender',VER_PROPIAS:'Consultar ventas propias',REIMPRIMIR:'Imprimir comprobantes',REGISTRAR_CLIENTE:'Registrar clientes',MODIFICAR_PRECIO:'Modificar precios',DESCUENTOS:'Aplicar descuentos',ANULAR:'Anular ventas',DEVOLVER:'Devolver ventas',TRASLADAR_BANCO:'Trasladar efectivo a banco',ABRIR_CAJA:'Abrir caja',CERRAR_CAJA:'Cerrar caja',
};
export interface SicomConfig { acceso?:string; facturador:boolean; acciones:string[]; fidelizacion_activa:boolean; pesos_por_punto:number; puntos_por_compra:number; valor_punto:number; minimo_canje:number }
export interface Facturador {id:number;nombre:string;activo:boolean;facturador:boolean;acciones:string[]}
export const useSicom = () => {const auth=useAuthStore(s=>s.isAuthenticated);const id=useAuthStore(s=>s.usuarioId);return useQuery({enabled:auth,queryKey:['sicom-config',id],queryFn:async()=>(await apiClient.get<SicomConfig>('/sicom/me')).data});};
export function permitido(cfg:SicomConfig|undefined,accion:string) {return !!cfg && (!cfg.facturador || cfg.acciones.includes(accion));}
