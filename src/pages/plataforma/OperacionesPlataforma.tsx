import {useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {Modal} from '@/components/ui/Modal';
import {CampoPassword} from '@/components/ui/CampoPassword';
import {apiClient} from '@/api/client';
import {getApiErrorMessage} from '@/api/errors';

const vacio={nombre:'',usuario:'',correo:'',claveNueva:'',claveActual:'',codigo:''};
type Admin={id:number;nombre:string;username:string;email:string;estado:boolean};
const raiz='/plataforma';
export function Superadministradores(){
 const qc=useQueryClient();
 const {data,isError}=useQuery({queryKey:['superadministradores'],queryFn:async()=>(await apiClient.get<Admin[]>(raiz+'/superadministradores')).data});
 const [datos,setDatos]=useState(vacio),[abrir,setAbrir]=useState(false),[mensaje,setMensaje]=useState(''),[busy,setBusy]=useState(false);
 async function crear(){setBusy(true);setMensaje('');try{
  await apiClient.post(raiz+'/superadministradores',datos);setDatos(vacio);setAbrir(false);
  await qc.invalidateQueries({queryKey:['superadministradores']});setMensaje('Cuenta creada. La persona debe configurar su autenticador en Seguridad.');
 }catch(e){setMensaje(getApiErrorMessage(e));}finally{setBusy(false);}}
 return <section className="space-y-3 rounded-xl border bg-white p-4">
  <h2 className="font-semibold">Superadministradores de plataforma</h2>
  {isError&&<p role="alert">No se pudieron consultar las cuentas.</p>}
  <ul className="divide-y">{data?.map(u=><li key={u.id} className="py-2 text-sm">{u.nombre} · {u.username} · {u.email} · {u.estado?'Activa':'Inactiva'}</li>)}</ul>
  <button type="button" className="rounded bg-ink-800 px-3 py-2 text-white" onClick={()=>{setMensaje('');setAbrir(true);}}>Crear superadministrador</button>
  {!abrir&&mensaje&&<p role="status">{mensaje}</p>}
  <Modal isOpen={abrir} onClose={()=>{if(!busy){setDatos(vacio);setAbrir(false);setMensaje('');}}} title="Crear superadministrador">
   <form className="space-y-3" onSubmit={e=>{e.preventDefault();void crear();}}>
    <p className="text-sm">La cuenta tendrá acceso de plataforma. Confirma tu contraseña y un código vigente de tu autenticador.</p>
    {([['nombre','Nombre'],['usuario','Usuario'],['correo','Correo'],['claveNueva','Contraseña de la nueva cuenta'],['claveActual','Tu contraseña actual'],['codigo','Código de tu autenticador']] as const).map(([k,t])=>{
      const Input=k.startsWith('clave')?CampoPassword:'input';
      return <label key={k} className="block text-sm">{t}<Input className="input" required value={datos[k]} autoComplete={k==='claveNueva'?'new-password':k==='claveActual'?'current-password':k==='codigo'?'one-time-code':undefined} onChange={e=>setDatos(d=>({...d,[k]:e.target.value}))}/></label>;
    })}
    {mensaje&&<p role="alert">{mensaje}</p>}
    <button disabled={busy} className="rounded bg-ink-800 px-3 py-2 text-white">Crear cuenta</button>
   </form>
  </Modal>
 </section>;
}

type Perfil={id:number;nombre:string;apellido?:string;username:string;estado:boolean};
type Ficha={empresa:{nombre:string;nit?:string;email?:string;telefono?:string;estado:boolean};sucursales:{id:number;nombre:string;estado:boolean}[];usuarios:Perfil[]};
type Venta={id:number;numero:string;numero_factura?:string;fecha:string;estado:string;total:number;sucursal:string;cliente?:string;vendedor?:string};
type Detalle={id:number;producto:string;cantidad:number;precio_unitario:number;subtotal_linea:number};
const dinero=(v:number)=>Number(v).toLocaleString('es-CO',{style:'currency',currency:'COP'});
export function FichaEmpresaPlataforma({id,cerrar}:{id:number;cerrar:()=>void}){
 const base=`${raiz}/empresas/${id}`;
 const ficha=useQuery({queryKey:['ficha-plataforma',id],queryFn:async()=>(await apiClient.get<Ficha>(base+'/ficha')).data});
 const [perfil,setPerfil]=useState(0),[desde,setDesde]=useState(''),[hasta,setHasta]=useState(''),[pagina,setPagina]=useState(0),[venta,setVenta]=useState<number|null>(null);
 const [motivo,setMotivo]=useState(''),[error,setError]=useState(''),[ocupado,setOcupado]=useState(false),[soporte,setSoporte]=useState<{id:string;usuario:string}|null>(null);
 const ventas=useQuery({queryKey:['ventas-plataforma',id,perfil,desde,hasta,pagina],enabled:!soporte,queryFn:async()=>(await apiClient.get<Venta[]>(base+'/ventas',{params:{usuario:perfil||undefined,desde:desde||undefined,hasta:hasta||undefined,pagina}})).data});
 const detalle=useQuery({queryKey:['venta-plataforma',id,venta],enabled:venta!==null&&!soporte,queryFn:async()=>(await apiClient.get<Detalle[]>(base+'/ventas/'+venta)).data});
 const vistaSoporte=useQuery({queryKey:['soporte-ventas',soporte?.id],enabled:!!soporte,retry:false,staleTime:0,queryFn:async()=>(await apiClient.get<Venta[]>(raiz+'/soporte/'+soporte!.id+'/ventas')).data});
 function reiniciar(){setPagina(0);setVenta(null);}
 async function entrar(){setOcupado(true);setError('');try{
   setSoporte((await apiClient.post<{id:string;usuario:string}>(base+'/soporte',{usuarioId:perfil,motivo})).data);setMotivo('');
 }catch(e){setError(getApiErrorMessage(e));}finally{setOcupado(false);}}
 async function salir(){if(!soporte)return;setOcupado(true);try{await apiClient.delete(raiz+'/soporte/'+soporte.id);setSoporte(null);setError('');}catch(e){setError(getApiErrorMessage(e));}finally{setOcupado(false);}}
 return <Modal isOpen onClose={()=>{if(!ocupado){if(soporte)void salir();else cerrar();}}} title={ficha.data?.empresa.nombre??'Ficha de empresa'} size="lg">
  {soporte?<section className="space-y-3">
   <p className="rounded bg-amber-50 p-3 text-sm"><strong>Soporte · {soporte.usuario}</strong><br/>Vista de solo lectura de ventas propias. La sesión vence en 15 minutos.</p>
   {vistaSoporte.isError?<p role="alert">{getApiErrorMessage(vistaSoporte.error)}</p>:vistaSoporte.isLoading?<p>Cargando…</p>:vistaSoporte.data?.length?vistaSoporte.data.map(v=><p key={v.id}>{v.numero} · {v.sucursal} · {dinero(v.total)}</p>):<p>No hay ventas visibles para este perfil.</p>}
   <button type="button" disabled={ocupado} className="underline" onClick={()=>void salir()}>Volver a Superadmin</button>
  </section>:<>
   {ficha.isError&&<p role="alert">No se pudo abrir la ficha.</p>}
   {ficha.data&&<section className="mb-4 rounded border p-3 text-sm">
    <p>{ficha.data.empresa.estado?'Activa':'Suspendida'} · NIT {ficha.data.empresa.nit??'—'} · {ficha.data.empresa.email??'Sin correo'} · {ficha.data.empresa.telefono??'Sin teléfono'}</p>
    <p className="mt-1"><strong>Sucursales:</strong> {ficha.data.sucursales.map(s=>s.nombre+(s.estado?'':' (inactiva)')).join(', ')||'Sin sucursales'}</p>
   </section>}
   <div className="grid gap-2 sm:grid-cols-3">
    <label className="text-sm">Usuario<select className="input" value={perfil} onChange={e=>{setPerfil(Number(e.target.value));reiniciar();}}><option value={0}>Todos</option>{ficha.data?.usuarios.map(u=><option key={u.id} value={u.id}>{u.nombre} {u.apellido??''} · {u.username}{u.estado?'':' (inactivo)'}</option>)}</select></label>
    <label className="text-sm">Desde<input className="input" type="date" value={desde} onChange={e=>{setDesde(e.target.value);reiniciar();}}/></label>
    <label className="text-sm">Hasta<input className="input" type="date" value={hasta} onChange={e=>{setHasta(e.target.value);reiniciar();}}/></label>
   </div>
   {perfil>0&&<form className="my-3 flex flex-wrap gap-2 rounded border p-2" onSubmit={e=>{e.preventDefault();void entrar();}}>
    <input className="input flex-1" placeholder="Motivo del soporte" aria-label="Motivo del soporte" required maxLength={500} value={motivo} onChange={e=>setMotivo(e.target.value)}/>
    <button className="rounded border px-3" disabled={ocupado||!motivo.trim()||!ficha.data?.empresa.estado||!ficha.data.usuarios.find(x=>x.id===perfil)?.estado}>Abrir vista de soporte</button>
   </form>}
   <h3 className="my-2 font-semibold">Historial de ventas</h3>
   {ventas.isLoading&&<p>Cargando ventas…</p>}
   {ventas.isError&&<p role="alert">{getApiErrorMessage(ventas.error)}</p>}
   {ventas.data?.length===0&&<p>Sin ventas en el filtro seleccionado.</p>}
   <div className="space-y-2">{ventas.data?.map(v=><div className="rounded border" key={v.id}>
    <button className="w-full px-3 py-2 text-left text-sm" aria-expanded={venta===v.id} onClick={()=>setVenta(venta===v.id?null:v.id)}>
     {venta===v.id?'▾':'▸'} {v.numero} · {String(v.fecha).slice(0,10)} · {v.sucursal} · {dinero(v.total)} · {v.estado}
    </button>
    {venta===v.id&&<div className="border-t bg-ink-50 p-3 text-sm">
     <p><strong>Factura:</strong> {v.numero_factura||'Sin factura'} · <strong>Cliente:</strong> {v.cliente} · <strong>Vendedor:</strong> {v.vendedor}</p>
     {detalle.isLoading&&<p>Cargando productos…</p>}
     {detalle.isError&&<p role="alert">No se pudo consultar el detalle.</p>}
     <ul>{detalle.data?.map(d=><li key={d.id}>{d.producto} · {d.cantidad} × {dinero(d.precio_unitario)} · Subtotal {dinero(d.subtotal_linea)}</li>)}</ul>
    </div>}
   </div>)}</div>
   <div className="mt-3 flex items-center justify-between text-sm"><button disabled={!pagina} onClick={()=>{setPagina(p=>p-1);setVenta(null);}}>Anterior</button><span>Página {pagina+1}</span><button disabled={(ventas.data?.length??0)<25} onClick={()=>{setPagina(p=>p+1);setVenta(null);}}>Siguiente</button></div>
  </>}
  {error&&<p role="alert" className="mt-3 text-danger-600">{error}</p>}
 </Modal>;
}
