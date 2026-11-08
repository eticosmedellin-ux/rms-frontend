import {useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {useQueryClient} from '@tanstack/react-query';
import {Bell, Boxes, Search, CheckCircle2, Download, LoaderCircle, Trash2, ArrowRight} from 'lucide-react';
import {useCatalogoAplicaciones, type Aplicacion} from './api';
import {useAuthStore} from '@/stores/authStore';
import {apiClient} from '@/api/client';
import {getApiErrorMessage} from '@/api/errors';
import {LogoAplicacion} from './iconos';
import {Modal} from '@/components/ui/Modal';

export default function TiendaAplicaciones(){
 const permite=useAuthStore(s=>s.esAdministradorTotal&&!s.esSuperadmin);
 const consulta=useCatalogoAplicaciones(),qc=useQueryClient();
 const [params,setParams]=useSearchParams();const avisos=params.get('avisos')==='1';
 const [texto,setTexto]=useState(''),[categoria,setCategoria]=useState('');
 const [elegida,setElegida]=useState<Aplicacion|null>(null),[ocupado,setOcupado]=useState(''),[enFoco,setEnFoco]=useState(''),[mensaje,setMensaje]=useState(''),[error,setError]=useState('');
 if(!permite)return <p className="rounded border p-4">La tienda está disponible para administradores de empresa.</p>;
 const apps=consulta.data??[];
 const categorias=[...new Set(apps.map(a=>a.app.categoria))].sort();
 const q=texto.trim().toLocaleLowerCase();
 const visibles=apps.filter(a=>(!categoria||a.app.categoria===categoria)&&[a.app.nombre,a.app.descripcion,a.app.categoria].join(' ').toLocaleLowerCase().includes(q));
 const novedades=apps.filter(a=>a.novedadDesde).sort((a,b)=>String(b.novedadDesde).localeCompare(String(a.novedadDesde)));
 async function cambiar(a:Aplicacion,quitar=false){
  setOcupado(a.app.codigo);setEnFoco(a.app.codigo);setError('');setMensaje('');
  try{
   await apiClient.post(`/aplicaciones/${a.app.codigo}/${quitar?'desinstalar':'instalar'}`);
   await Promise.all(['tienda-aplicaciones','mi-plan','menu-aplicaciones'].map(key=>qc.invalidateQueries({queryKey:[key]})));
   setElegida(null);setMensaje(quitar?`${a.app.nombre} salió del menú. Sus datos se conservaron.`:`${a.app.nombre} ya está disponible en el menú.`);
  }catch(e){setError(getApiErrorMessage(e));}finally{setOcupado('');}
 }
 return <div className="space-y-5">
  <header className="flex flex-wrap items-start justify-between gap-4 rounded-2xl bg-slate-900 p-6 text-white">
   <div><div className="mb-2 inline-flex items-center gap-2 text-sm text-emerald-300"><Boxes size={18}/> SICOM · Catálogo de empresa</div>
    <h1 className="text-2xl font-semibold">Tienda de aplicaciones</h1>
    <p className="mt-1 text-sm text-slate-300">Consulta todos los módulos de SICOM y activa los que tu empresa tiene autorizados.</p>
   </div>
   <button type="button" className="flex items-center gap-2 rounded-lg border border-slate-400 bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20" onClick={()=>setParams(avisos?{}:{avisos:'1'},{replace:true})} aria-expanded={avisos}><Bell size={16}/> Actualizaciones <span className="rounded bg-white/15 px-1.5">{novedades.length}</span></button>
  </header>
  {avisos&&<section className="space-y-2 rounded-xl border bg-white p-4">
   <h2 className="font-semibold">Actualizaciones de tus aplicaciones</h2>
   {!novedades.length&&<p className="text-sm">Aún no hay avisos.</p>}
   {novedades.map(a=><article className="border-t py-2 text-sm" key={a.app.codigo}>
    <strong>{a.tituloAviso||`${a.app.nombre} disponible para tu empresa`}</strong><span className="ml-2 text-ink-500">{new Date(a.novedadDesde!).toLocaleDateString('es-CO')}</span>
    <p>{a.novedades||a.app.descripcion}</p>
    <button type="button" className="sicom-accion mt-2" onClick={()=>{
     setTexto('');setCategoria('');setEnFoco(a.app.codigo);setError('');
     requestAnimationFrame(()=>document.getElementById(`app-${a.app.codigo}`)?.focus());
    }}>Ver aplicación <ArrowRight size={15}/></button>
   </article>)}
  </section>}
  <div className="flex flex-wrap gap-3">
   <label className="relative min-w-[220px] flex-1"><Search size={16} className="absolute left-3 top-3 text-ink-500"/><input aria-label="Buscar aplicación" type="search" placeholder="Buscar aplicaciones…" className="input pl-9" value={texto} onChange={e=>setTexto(e.target.value)}/></label>
   <select aria-label="Categoría" className="input w-auto" value={categoria} onChange={e=>setCategoria(e.target.value)}><option value="">Todas las categorías</option>{categorias.map(c=><option key={c}>{c}</option>)}</select>
  </div>
  {consulta.isLoading&&<p>Cargando catálogo…</p>}
  {consulta.isError&&<p role="alert">{getApiErrorMessage(consulta.error,'No se pudo cargar la tienda.')}</p>}
  {mensaje&&<p role="status" className="rounded-lg bg-emerald-50 p-3 text-emerald-800">{mensaje}</p>}
  {consulta.isSuccess&&!visibles.length&&<p className="rounded-xl border bg-white p-6 text-center">{apps.length?'No hay coincidencias con esos filtros.':'El catálogo de aplicaciones está vacío.'}</p>}
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visibles.map(a=>{
   return <article id={`app-${a.app.codigo}`} tabIndex={-1} key={a.app.codigo} className="flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm">
   <div className="flex items-start justify-between"><LogoAplicacion codigo={a.icono} size={40} className="h-10 w-10 rounded-lg bg-emerald-50 p-2 text-emerald-700"/><span className="rounded bg-ink-50 px-2 py-1 text-xs">{a.app.categoria}</span></div>
   <div><h2 className="font-semibold">{a.app.nombre}</h2><p className="mt-1 text-sm text-ink-600">{a.app.descripcion}</p></div>
   <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
    <div><p className={`text-xs font-semibold ${a.instalada?'text-emerald-700':'text-ink-600'}`}>{a.base?'Incluida de base':a.instalada?'Instalada':'No instalada'}</p>{a.version&&<p className="text-xs text-ink-500">Versión {a.version}</p>}</div>
    {ocupado===a.app.codigo?<span role="status" className="sicom-accion"><LoaderCircle size={16} className="animate-spin"/> {a.instalada?'Desinstalando…':'Instalando…'}</span>
     :a.instalada?<div className="flex flex-wrap gap-2"><Link className="sicom-accion" to={a.app.ruta}><CheckCircle2 size={15}/> Abrir</Link>
       {a.puedeDesinstalar&&<button type="button" disabled={!!ocupado} className="sicom-accion sicom-accion-peligro" onClick={()=>{setError('');setElegida(a);}}><Trash2 size={15}/> Desinstalar</button>}</div>
     :a.publicada&&a.autorizada?<button type="button" className="sicom-accion sicom-accion-principal" disabled={!!ocupado||!!a.pendientes.length} onClick={()=>void cambiar(a)}><Download size={15}/> {error&&enFoco===a.app.codigo?'Reintentar':'Instalar'}</button>:<span className="rounded bg-ink-50 px-2 py-1 text-xs text-ink-600">{a.publicada?'No disponible para tu empresa':'Sin publicar'}</span>}
   </div>
   {!!a.pendientes.length&&a.publicada&&a.autorizada&&!a.instalada&&<p className="text-xs text-amber-800">Instala primero: {a.pendientes.join(', ')}.</p>}
   {!elegida&&error&&enFoco===a.app.codigo&&<p role="alert" className="text-sm text-danger-600">{error}</p>}
  </article>;})}</div>
  {elegida&&<Modal isOpen onClose={()=>{if(!ocupado)setElegida(null);}} title={`Desinstalar ${elegida.app.nombre}`}>
   <div className="space-y-4"><p>El módulo dejará de aparecer en el menú de tu empresa. Sus datos e historial se conservarán y podrás volver a usarlos al reinstalarlo.</p>
    {error&&<p role="alert" className="text-danger-600">{error}</p>}
    <div className="flex flex-wrap gap-2">
     <button type="button" disabled={!!ocupado} className="sicom-accion" onClick={()=>setElegida(null)}>Cancelar</button>
     <button type="button" disabled={!!ocupado} className="sicom-accion sicom-accion-peligro" onClick={()=>void cambiar(elegida,true)}>{ocupado?<LoaderCircle size={16} className="animate-spin"/>:<Trash2 size={16}/>} {ocupado?'Desinstalando…':'Confirmar desinstalación'}</button>
    </div>
   </div>
  </Modal>}
 </div>;
}
