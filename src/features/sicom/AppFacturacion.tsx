import {useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {apiClient} from '@/api/client';
import {useAuthStore} from '@/stores/authStore';
import {CajaBar} from '@/pages/pos/CajaBar';
import {VenderTab} from '@/pages/pos/VenderTab';
import {useCajaAbierta} from '@/hooks/usePos';
import {usePosStore} from '@/stores/posStore';
import {getApiErrorMessage} from '@/api/errors';
import {useSicom,permitido} from './api';
import TrasladosBanco from './TrasladosBanco';
import {abrirFactura} from '@/lib/factura';
import {useEmpresa} from '@/hooks/useGestion';
import type {Venta} from '@/types/pos';
import {DevolucionModal} from '@/pages/pos/DevolucionModal';
export default function AppFacturacion(){const {data:cfg,isLoading,isError}=useSicom();const [tab,setTab]=useState('vender');const salir=useAuthStore(s=>s.logout);const nombre=useAuthStore(s=>s.nombreCompleto);const navigate=useNavigate();const qc=useQueryClient();
 if(isLoading)return <p className="p-8">Cargando permisos…</p>;if(isError||!cfg)return <p className="p-8">No fue posible verificar tus permisos. Recarga la página.</p>;
 const tabs=[['vender','Facturar','VENDER'],['ventas','Mis ventas','VER_PROPIAS'],['banco','Traslados a banco','TRASLADAR_BANCO']].filter(t=>permitido(cfg,t[2]));const actual=tabs.some(t=>t[0]===tab)?tab:tabs[0]?.[0];
 return <main className="min-h-screen bg-slate-50"><header className="bg-slate-900 text-white p-4 flex justify-between"><div><strong>SICOM · Facturación</strong><p className="text-sm text-slate-300">{nombre}</p></div><button onClick={()=>{salir();qc.clear();navigate('/login');}}>Cerrar sesión</button></header><div className="max-w-7xl mx-auto p-4"><CajaBar/><nav className="flex gap-3 mb-5">{tabs.map(t=><button key={t[0]} onClick={()=>setTab(t[0])} className={`rounded px-4 py-2 ${actual===t[0]?'bg-slate-800 text-white':'bg-white border'}`}>{t[1]}</button>)}</nav>{!actual&&<p>El administrador todavía no ha habilitado acciones para este usuario.</p>}{actual==='vender'&&<VenderTab/>}{actual==='ventas'&&<MisVentas/>}{actual==='banco'&&<TrasladosBanco/>}</div></main>;
}
function MisVentas(){const usuarioId=useAuthStore(s=>s.usuarioId);const sucursal=usePosStore(s=>s.sucursalId);const {data:caja}=useCajaAbierta(sucursal);const qc=useQueryClient();const [mensaje,setMensaje]=useState(''),[ocupado,setOcupado]=useState(false);
 async function anular(v:Venta){if(ocupado)return;const motivo=window.prompt(`Motivo para anular ${v.numero}:`);if(!motivo?.trim()||!window.confirm('Se revertirá la venta y se registrará el reintegro correspondiente. ¿Continuar?'))return;setOcupado(true);try{await apiClient.post(`/ventas/${v.id}/anular`,{motivo,cajaSesionId:caja?.id});await qc.invalidateQueries();setMensaje('Venta anulada y reversos registrados');}catch(e){setMensaje(getApiErrorMessage(e,'No se pudo anular'));}finally{setOcupado(false);}}
 const {data:cfg}=useSicom();const {data:empresa}=useEmpresa();const [pagina,setPagina]=useState(0),[devolucion,setDevolucion]=useState<Venta|null>(null);const {data,isLoading,isError}=useQuery({queryKey:['ventas-paginado','propias',usuarioId,pagina],queryFn:async()=>(await apiClient.get<{contenido:Venta[];totalPaginas:number}>('/ventas/paginado',{params:{pagina,tamano:25,usuarioId}})).data});
 return <section className="bg-white border rounded-xl p-5"><h2 className="font-semibold">Mis ventas</h2>{mensaje&&<p role="status">{mensaje}</p>}{isLoading&&<p>Cargando…</p>}{isError&&<p>No se pudieron cargar las ventas.</p>}<div className="overflow-auto"><table className="w-full text-sm"><thead><tr><th>Número</th><th>Cliente</th><th>Total</th><th>Acciones</th></tr></thead><tbody>{data?.contenido.map(v=><tr key={v.id}><td>{v.numero}</td><td>{v.cliente??'Consumidor final'}</td><td>${v.total.toLocaleString('es-CO')}</td><td>{permitido(cfg,'REIMPRIMIR')&&empresa&&<button className="p-2 text-blue-700" onClick={()=>abrirFactura(v,empresa)}>Imprimir</button>}{permitido(cfg,'ANULAR')&&v.estado!=='ANULADA'&&<button disabled={ocupado} className="p-2 text-red-700" onClick={()=>anular(v)}>Anular</button>}{permitido(cfg,'DEVOLVER')&&<button className="p-2 text-red-700" onClick={()=>setDevolucion(v)}>Devolver</button>}</td></tr>)}</tbody></table></div><div className="flex justify-between mt-4"><button disabled={pagina===0} onClick={()=>setPagina(p=>p-1)}>Anterior</button><span>Página {pagina+1}</span><button disabled={!data||pagina+1>=data.totalPaginas} onClick={()=>setPagina(p=>p+1)}>Siguiente</button></div><DevolucionModal isOpen={!!devolucion} onClose={()=>setDevolucion(null)} venta={devolucion}/></section>;
}
