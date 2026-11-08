import {useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {useQueryClient} from '@tanstack/react-query';
import {Bell, Boxes, Search, CheckCircle2, Download} from 'lucide-react';
import {useCatalogoAplicaciones, type Aplicacion} from './api';
import {useAuthStore} from '@/stores/authStore';
import {apiClient} from '@/api/client';
import {getApiErrorMessage} from '@/api/errors';
import {Modal} from '@/components/ui/Modal';

export default function TiendaAplicaciones(){
 const permite=useAuthStore(s=>s.esAdministradorTotal&&!s.esSuperadmin);
 const consulta=useCatalogoAplicaciones(),qc=useQueryClient();
 const [params,setParams]=useSearchParams();const avisos=params.get('avisos')==='1';
 const [texto,setTexto]=useState(''),[categoria,setCategoria]=useState('');
 const [elegida,setElegida]=useState<Aplicacion|null>(null),[ocupado,setOcupado]=useState(false),[mensaje,setMensaje]=useState(''),[error,setError]=useState('');
 if(!permite)return <p className="rounded border p-4">La tienda está disponible para administradores de empresa.</p>;
 const apps=consulta.data??[];
 const categorias=[...new Set(apps.map(a=>a.app.categoria))].sort();
 const q=texto.trim().toLocaleLowerCase();
 const visibles=apps.filter(a=>(!categoria||a.app.categoria===categoria)&&[a.app.nombre,a.app.descripcion,a.app.categoria].join(' ').toLocaleLowerCase().includes(q));
 const novedades=apps.filter(a=>a.novedadDesde).sort((a,b)=>String(b.novedadDesde).localeCompare(String(a.novedadDesde)));
 async function instalar(a:Aplicacion){
  setOcupado(true);setError('');setMensaje('');
  try{
   await apiClient.post(`/aplicaciones/${a.app.codigo}/instalar`);
   await Promise.all([qc.invalidateQueries({queryKey:['tienda-aplicaciones']}),qc.invalidateQueries({queryKey:['mi-plan']})]);
   setElegida(null);setMensaje(`${a.app.nombre} ya está disponible en el menú.`);
  }catch(e){setError(getApiErrorMessage(e));}finally{setOcupado(false);}
 }
 return <div className="space-y-5">
  <header className="flex flex-wrap items-start justify-between gap-4 rounded-2xl bg-slate-900 p-6 text-white">
   <div><div className="mb-2 inline-flex items-center gap-2 text-sm text-emerald-300"><Boxes size={18}/> SICOM · Catálogo de empresa</div>
    <h1 className="text-2xl font-semibold">Tienda de aplicaciones</h1>
    <p className="mt-1 text-sm text-slate-300">Activa los módulos que tu empresa tiene autorizados y encuéntralos en el menú.</p>
   </div>
   <button type="button" className="flex items-center gap-2 rounded-lg border border-slate-500 px-3 py-2 text-sm" onClick={()=>setParams(avisos?{}:{avisos:'1'},{replace:true})} aria-expanded={avisos}><Bell size={16}/> Actualizaciones <span className="rounded bg-white/15 px-1.5">{novedades.length}</span></button>
  </header>
  {avisos&&<section className="space-y-2 rounded-xl border bg-white p-4">
   <h2 className="font-semibold">Actualizaciones de tus aplicaciones</h2>
   {!novedades.length&&<p className="text-sm">Aún no hay avisos.</p>}
   {novedades.map(a=><article className="border-t py-2 text-sm" key={a.app.codigo}>
    <strong>{a.app.nombre} · {a.version}</strong><span className="ml-2 text-ink-500">{new Date(a.novedadDesde!).toLocaleDateString('es-CO')}</span>
    <p>{a.novedades||'Aplicación disponible para tu empresa.'}</p>
   </article>)}
  </section>}
  <div className="flex flex-wrap gap-3">
   <label className="relative min-w-[220px] flex-1"><Search size={16} className="absolute left-3 top-3 text-ink-500"/><input aria-label="Buscar aplicación" type="search" placeholder="Buscar aplicaciones…" className="input pl-9" value={texto} onChange={e=>setTexto(e.target.value)}/></label>
   <select aria-label="Categoría" className="input w-auto" value={categoria} onChange={e=>setCategoria(e.target.value)}><option value="">Todas las categorías</option>{categorias.map(c=><option key={c}>{c}</option>)}</select>
  </div>
  {consulta.isLoading&&<p>Cargando catálogo…</p>}
  {consulta.isError&&<p role="alert">{getApiErrorMessage(consulta.error,'No se pudo cargar la tienda.')}</p>}
  {mensaje&&<p role="status" className="rounded-lg bg-emerald-50 p-3 text-emerald-800">{mensaje}</p>}
  {consulta.isSuccess&&!visibles.length&&<p className="rounded-xl border bg-white p-6 text-center">{apps.length?'No hay coincidencias con esos filtros.':'Tu empresa aún no tiene aplicaciones publicadas y autorizadas.'}</p>}
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visibles.map(a=><article key={a.app.codigo} className="flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm">
   <div className="flex items-start justify-between"><Boxes className="h-10 w-10 rounded-lg bg-emerald-50 p-2 text-emerald-700"/><span className="rounded bg-ink-50 px-2 py-1 text-xs">{a.app.categoria}</span></div>
   <div><h2 className="font-semibold">{a.app.nombre}</h2><p className="mt-1 text-sm text-ink-600">{a.app.descripcion}</p></div>
   <div className="mt-auto flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-ink-500">Versión {a.version}</span>
    {a.instalada?<Link className="flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800" to={a.app.ruta}><CheckCircle2 size={15}/> Abrir</Link>
     :<button type="button" className="flex items-center gap-1 rounded-lg bg-ink-800 px-3 py-2 text-sm text-white" onClick={()=>{setError('');setElegida(a);}}><Download size={15}/> Instalar</button>}
   </div>
  </article>)}</div>
  {elegida&&<Modal isOpen onClose={()=>{if(!ocupado)setElegida(null);}} title={`Instalar ${elegida.app.nombre}`}>
   <div className="space-y-3"><p>{elegida.app.descripcion}</p>
    {!!elegida.pendientes.length?<p className="rounded bg-amber-50 p-3 text-sm">Activa primero: {elegida.pendientes.join(', ')}.</p>:<p className="text-sm">El módulo aparecerá en el menú. Los permisos de cada trabajador se administran desde Roles y permisos.</p>}
    {error&&<p role="alert" className="text-danger-600">{error}</p>}
    <button type="button" disabled={ocupado||!!elegida.pendientes.length} className="rounded bg-ink-800 px-4 py-2 text-white disabled:opacity-50" onClick={()=>void instalar(elegida)}>{ocupado?'Instalando…':'Confirmar instalación'}</button>
   </div>
  </Modal>}
 </div>;
}
