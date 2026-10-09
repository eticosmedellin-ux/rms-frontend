import {useEffect,useState} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {pendientes,sincronizar,descartar,type PedidoCapturado} from './outbox';
import {getApiErrorMessage} from '@/api/errors';
export function PedidosCapturados(){
 const [items,setItems]=useState<PedidoCapturado[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const client=useQueryClient();
 useEffect(()=>{function load(){try{setItems(pendientes());}catch(e){setError(getApiErrorMessage(e,'No se pudo leer la captura'));}}load();window.addEventListener('sicom-pedidos',load);window.addEventListener('storage',load);return()=>{window.removeEventListener('sicom-pedidos',load);window.removeEventListener('storage',load);};},[]);
 async function sync(){setBusy(true);setError('');try{await sincronizar();await client.invalidateQueries({queryKey:['comandas-activas']});await client.invalidateQueries({queryKey:['comanda']});}catch(e){setError(getApiErrorMessage(e,'No se pudo sincronizar'));}finally{setBusy(false);}}
 if(!items.length&&!error)return null;
 return <div className="my-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm"><p className="font-semibold">{items.length} pedido(s) capturados en este dispositivo</p><p>Estos productos aún no están confirmados en cocina ni facturados. Revisa la respuesta del servidor al recuperar la conexión.</p>
 {error&&<p role="alert" className="text-danger-600">{error}</p>}
 {items.map(p=><div key={p.data.clave} className="border-t py-2">Comanda #{p.comandaId}: {p.data.cantidad} × {p.nombre}{p.error&&<p className="text-danger-600">{p.error}</p>}<button className="ml-3 text-danger-600" disabled={busy} onClick={()=>{if(window.confirm('Descartar este pedido local sin enviarlo a cocina?'))descartar(p.data.clave).catch(e=>setError(String(e)));}}>Descartar captura</button></div>)}
 <button disabled={busy||!navigator.onLine} onClick={sync} className="mt-2 rounded bg-ink-800 px-3 py-2 text-white">{busy?'Sincronizando...':'Enviar capturas al servidor'}</button></div>;
}
