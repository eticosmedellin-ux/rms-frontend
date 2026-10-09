import { agregarItemComanda } from '@/api/restaurante';
import { useAuthStore } from '@/stores/authStore';
import { getApiErrorMessage } from '@/api/errors';
export type PedidoCapturado = {comandaId: number; data: {productoId?: number; comboId?: number; cantidad: number; notas?: string; clave: string}; nombre: string; fecha: string; error?: string};
function key() {const a=useAuthStore.getState();if(!a.isAuthenticated||!a.empresaId||!a.usuarioId)throw new Error('Inicia sesión para acceder a los pedidos capturados');return `sicom-pedidos:${a.empresaId}:${a.usuarioId}`;}
export function pendientes(): PedidoCapturado[] {const value=localStorage.getItem(key());if(!value)return [];const parsed=JSON.parse(value);if(!Array.isArray(parsed))throw new Error('No se pudo leer la captura local');return parsed;}
function guardar(items: PedidoCapturado[]) {localStorage.setItem(key(),JSON.stringify(items));window.dispatchEvent(new Event('sicom-pedidos'));}
export async function capturar(p: PedidoCapturado) {await navigator.locks.request('sicom-pedidos',()=>{const list=pendientes();if(!list.some(x=>x.data.clave===p.data.clave))guardar([...list,p]);});}
export async function descartar(clave: string) {await navigator.locks.request('sicom-pedidos',()=>guardar(pendientes().filter(x=>x.data.clave!==clave)));}
export async function sincronizar() {
  const identidad=key();
  await navigator.locks.request('sicom-sincronizar',async()=>{
    for(const p of pendientes()) {
      if(key()!==identidad)throw new Error('Cambió la sesión; se detuvo la sincronización');
      try {await agregarItemComanda(p.comandaId,p.data);if(key()!==identidad)throw new Error('Cambió la sesión durante el envío; verifica el pedido antes de reintentar');await descartar(p.data.clave);}
      catch(e) {await navigator.locks.request('sicom-pedidos',()=>guardar(pendientes().map(x=>x.data.clave===p.data.clave?{...x,error:getApiErrorMessage(e,'Sin respuesta del servidor')}:x)));if(!navigator.onLine)break;}
    }
  });
}
