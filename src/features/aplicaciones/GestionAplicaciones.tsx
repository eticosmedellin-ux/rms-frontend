import {useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {Eye, Plus, Pencil, Send, ShieldCheck, LoaderCircle} from 'lucide-react';
import {apiClient} from '@/api/client';
import {useEmpresasPlataforma} from '@/hooks/usePlataforma';
import {getApiErrorMessage} from '@/api/errors';
import {Modal} from '@/components/ui/Modal';
import {LogoAplicacion,iconosAplicaciones} from './iconos';
import type {Aplicacion} from './api';

export function GestionAplicaciones(){
 const qc=useQueryClient(),{data:empresas=[]}=useEmpresasPlataforma();
 const [empresa,setEmpresa]=useState(0),[modal,setModal]=useState<'nuevo'|'editar'|null>(null);
 const [edicion,setEdicion]=useState<Aplicacion|null>(null);
 const [nombre,setNombre]=useState(''),[descripcion,setDescripcion]=useState(''),[icono,setIcono]=useState('');
 const [tituloAviso,setTituloAviso]=useState(''),[novedades,setNovedades]=useState(''),[previa,setPrevia]=useState(false);
 const [ocupado,setOcupado]=useState(false),[error,setError]=useState(''),[mensaje,setMensaje]=useState('');
 const apps=useQuery({queryKey:['gestionar-aplicaciones',empresa],queryFn:async()=>(await apiClient.get<Aplicacion[]>('/plataforma/aplicaciones',{params:{empresaId:empresa||undefined}})).data});
 const pendientes=apps.data?.filter(a=>!a.publicada)??[];
 function seleccionar(a:Aplicacion|null){
  setEdicion(a);setNombre(a?.app.nombre??'');setDescripcion(a?.app.descripcion??'');setIcono(a?.icono??'');
  setTituloAviso(a?.tituloAviso??'');setNovedades(a?.novedades??'');setPrevia(false);setError('');
 }
 async function ejecutar(fn:()=>Promise<unknown>,exito:string){
  setOcupado(true);setError('');setMensaje('');
  try{await fn();await Promise.all(['gestionar-aplicaciones','tienda-aplicaciones','menu-aplicaciones'].map(key=>qc.invalidateQueries({queryKey:[key]})));setModal(null);setMensaje(exito);}
  catch(e){setError(getApiErrorMessage(e));}finally{setOcupado(false);}
 }
 function guardar(publicada:boolean){
  if(!edicion)return;
  void ejecutar(()=>apiClient.put(`/plataforma/aplicaciones/${edicion.app.codigo}`,{publicada,nombre,descripcion,icono,tituloAviso,novedades}),
   publicada?(edicion.publicada?'Ficha actualizada':'Aplicación publicada en la tienda'):'Borrador guardado');
 }
 function cargarLogo(archivo?:File){
  if(!archivo)return;
  setError('');
  if(archivo.type!=='image/png'||archivo.size>65536){setError('Selecciona un PNG de hasta 64 KB.');return;}
  const lector=new FileReader();
  lector.onerror=()=>setError('No se pudo leer el logo.');
  lector.onload=()=>{
   if(typeof lector.result!=='string')return;
   const imagen=new Image(),dato=lector.result;
   imagen.onerror=()=>setError('No se pudo abrir el PNG.');
   imagen.onload=()=>{
    if(imagen.width>256||imagen.height>256){setError('El logo debe medir máximo 256 × 256 píxeles.');return;}
    setIcono(dato);
   };
   imagen.src=dato;
  };
  lector.readAsDataURL(archivo);
 }
 return <section className="space-y-4">
  <header className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-semibold">Aplicaciones del sistema</h2><p className="text-sm text-ink-600">Publica los módulos de las actualizaciones y administra quién puede instalarlos.</p></div>
   <button className="sicom-accion sicom-accion-principal" type="button" disabled={!apps.isSuccess||ocupado} onClick={()=>{seleccionar(null);setModal('nuevo');}}><Plus size={18}/> Nueva aplicación</button>
  </header>
  <label className="block text-sm">Empresa para autorizar<select className="input" disabled={ocupado} value={empresa} onChange={e=>{setEmpresa(Number(e.target.value));setMensaje('');setError('');}}><option value={0}>Catálogo general</option>{empresas.map(e=><option value={e.id} key={e.id}>{e.nombreComercial??e.nombre}</option>)}</select></label>
  {apps.isError&&<p role="alert">No se pudo consultar la tienda.</p>}
  {mensaje&&<p role="status" className="rounded-lg bg-emerald-50 p-3 text-emerald-800">{mensaje}</p>}
  {!modal&&error&&<p role="alert" className="text-danger-600">{error}</p>}
  <div className="grid gap-3 md:grid-cols-2">{apps.data?.map(a=>{
   return <article className="space-y-2 rounded-xl border bg-white p-4" key={a.app.codigo}>
   <h3 className="flex items-center gap-2 font-semibold"><LogoAplicacion codigo={a.icono}/> {a.app.nombre}</h3><p className="text-sm text-ink-600">{a.app.descripcion}</p>
   <p className="text-xs">{a.publicada?'Publicada':a.borrador?'Borrador':'Pendiente de ficha'}{empresa>0&&a.instalada?' · Instalada':''}</p>
   <div className="flex flex-wrap gap-2">
    <button className="sicom-accion" type="button" disabled={ocupado} onClick={()=>{seleccionar(a);setModal('editar');}}><Pencil size={15}/> {a.borrador?'Editar ficha':'Preparar ficha'}</button>
    {empresa>0&&!a.base&&<button className="sicom-accion" type="button" disabled={ocupado||!a.publicada} onClick={()=>void ejecutar(
      ()=>apiClient.put(`/plataforma/empresas/${empresa}/aplicaciones/${a.app.codigo}`,{autorizada:!a.autorizacionDirecta}),
      a.autorizacionDirecta?'Autorización directa retirada. Si el plan incluye la aplicación, sigue disponible.':'Aplicación autorizada. La empresa puede instalarla cuando quiera.')}>
      <ShieldCheck size={15}/> {a.autorizacionDirecta?'Retirar autorización directa':'Autorizar instalación'}</button>}
   </div>
  </article>;})}</div>
  {modal&&<Modal isOpen size="lg" onClose={()=>{if(!ocupado){setModal(null);setError('');}}} title={modal==='nuevo'?'Nueva aplicación':'Editar ficha de aplicación'}>
   <form className="space-y-4" onSubmit={e=>{e.preventDefault();guardar(true);}}>
    {modal==='nuevo'&&<label className="block">Módulo de la actualización<select className="input" value={edicion?.app.codigo??''} disabled={ocupado} onChange={e=>seleccionar(pendientes.find(a=>a.app.codigo===e.target.value)??null)}>
     <option value="">{pendientes.length?'Selecciona un módulo pendiente':'No hay módulos pendientes'}</option>
     {pendientes.map(a=><option key={a.app.codigo} value={a.app.codigo}>{a.app.nombre}{a.borrador?' (borrador)':''}</option>)}
    </select></label>}
    {edicion&&<fieldset disabled={ocupado} className="space-y-3">
     <div className="rounded-lg border bg-ink-50 p-3 text-sm"><strong>Incluido en la actualización · v{edicion.version||'1.0'}</strong><p>{edicion.app.descripcion}</p><p>Funciones vinculadas: {edicion.app.funciones.join(', ')||edicion.app.nombre}.</p></div>
     <label className="block">Nombre comercial<input className="input" required maxLength={100} value={nombre} onChange={e=>setNombre(e.target.value)}/></label>
     <label className="block">Descripción<textarea className="input" required maxLength={500} value={descripcion} onChange={e=>setDescripcion(e.target.value)}/></label>
     <label className="block">Símbolo <span className="inline-flex align-middle"><LogoAplicacion codigo={icono}/></span><select className="input" value={icono.startsWith("data:")?"logo":icono} onChange={e=>setIcono(e.target.value)}><option value="">Icono original</option>{icono.startsWith("data:")&&<option value="logo">Logo personalizado</option>}{Object.entries(iconosAplicaciones).map(([id,o])=><option key={id} value={id}>{o.nombre}</option>)}</select></label>
     <label className="block">Logo personalizado <span className="text-xs text-ink-500">PNG, hasta 64 KB y 256 × 256 píxeles</span><input className="input" type="file" accept="image/png" onChange={e=>cargarLogo(e.target.files?.[0])}/></label>
     <div className="rounded-lg border p-3"><p className="mb-2 font-semibold">Notificación para el cliente</p>
      <label className="block">Título<input className="input" placeholder={`${nombre} disponible para tu empresa`} maxLength={120} value={tituloAviso} onChange={e=>setTituloAviso(e.target.value)}/></label>
      <label className="mt-2 block">¿Para qué sirve?<textarea className="input" placeholder={descripcion} maxLength={500} value={novedades} onChange={e=>setNovedades(e.target.value)}/></label>
     </div>
     {previa&&<div className="space-y-2 rounded-lg border border-emerald-300 bg-emerald-50 p-3"><p className="text-xs font-semibold">Vista previa · Tienda y menú</p><p className="flex items-center gap-2 font-semibold"><LogoAplicacion codigo={icono}/>{nombre}</p><p className="text-sm">{descripcion}</p><p className="text-xs font-semibold">Aviso</p><p className="text-sm">{tituloAviso||`${nombre} disponible para tu empresa`}: {novedades||descripcion}</p></div>}
     <div className="flex flex-wrap gap-2">
      {!edicion.publicada&&<button type="button" className="sicom-accion" onClick={()=>guardar(false)}>Guardar borrador</button>}
      <button type="button" className="sicom-accion" aria-expanded={previa} onClick={()=>setPrevia(!previa)}><Eye size={16}/> {previa?'Ocultar vista previa':'Vista previa'}</button>
      <button className="sicom-accion sicom-accion-principal">{ocupado?<LoaderCircle size={16} className="animate-spin"/>:<Send size={16}/>} {edicion.publicada?'Guardar cambios':'Publicar en la tienda'}</button>
     </div>
    </fieldset>}
    {error&&<p role="alert" className="text-danger-600">{error}</p>}
   </form>
  </Modal>}
 </section>;
}
