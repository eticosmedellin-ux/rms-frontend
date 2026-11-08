import {useState} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {apiClient} from '@/api/client';
import {getApiErrorMessage} from '@/api/errors';
import {biblioteca} from './casos';
import {rutaAdmin,urlPractica,useGuias} from './bibliotecaApi';

export function AdminBiblioteca(){
 const q=useGuias(true),cache=useQueryClient();
 const [grupo,setGrupo]=useState('Ventas'),[plantilla,setPlantilla]=useState(''),[titulo,setTitulo]=useState(''),[indicacion,setIndicacion]=useState('');
 const [ocupado,setOcupado]=useState(false),[error,setError]=useState(''),[mensaje,setMensaje]=useState(''),[vista,setVista]=useState<number|null>(null),[confirmada,setConfirmada]=useState(false);
 const grupos=[...new Set(biblioteca.map(c=>c.grupo))];
 const [editando,setEditando]=useState<number|null>(null);
 const caso=biblioteca.find(c=>c.id===plantilla);
 async function ejecutar(fn:()=>Promise<unknown>,texto:string){
  setOcupado(true);setError('');setMensaje('');
  try{await fn();await cache.invalidateQueries({queryKey:['guias-biblioteca']});setMensaje(texto);}
  catch(e){setError(getApiErrorMessage(e));}finally{setOcupado(false);}
 }
 return <section className="space-y-4 rounded-xl border bg-white p-4">
  <header><h3 className="font-bold">Biblioteca de tutoriales interactivos</h3><p className="text-sm text-ink-600">Selecciona una acción para generar un borrador. Prueba el recorrido, apruébalo y después publícalo.</p></header>
  <form className="grid gap-3 sm:grid-cols-2" onSubmit={e=>{e.preventDefault();if(caso)void ejecutar(async()=>{const datos={titulo,plantilla,indicacion};if(editando===null)await apiClient.post(rutaAdmin,datos);else await apiClient.put(`${rutaAdmin}/${editando}`,datos);setEditando(null);setVista(null);setConfirmada(false);setTitulo('');setIndicacion('');},'Borrador creado. Abre la vista previa para comprobar la solución.');}}>
   <label className="block sm:col-span-2">Problema<input className="input" required maxLength={160} value={titulo} onChange={e=>setTitulo(e.target.value)}/></label>
   <label>Módulo<select className="input" value={grupo} onChange={e=>{setGrupo(e.target.value);setPlantilla('');}}>{grupos.map(g=><option key={g}>{g}</option>)}</select></label>
   <label>Acción<select className="input" required value={plantilla} onChange={e=>setPlantilla(e.target.value)}><option value="">Selecciona una acción</option>{biblioteca.filter(c=>c.grupo===grupo).map(c=><option key={c.id} value={c.id}>{c.titulo}</option>)}</select></label>
   <label className="sm:col-span-2">Indicación adicional (opcional)<textarea className="input" maxLength={600} value={indicacion} onChange={e=>setIndicacion(e.target.value)}/></label>
   {caso&&<div className="rounded bg-ink-50 p-3 text-sm sm:col-span-2"><p>{caso.acciones?'Ejercicio complementario':'Pantalla de SICOM en modo práctica'} · {caso.pasos?.length} pasos</p><ol className="list-decimal pl-5">{caso.pasos?.map(([p],i)=><li key={i}>{p}</li>)}</ol></div>}
   <button className="sicom-accion sicom-accion-principal" disabled={ocupado||!caso}>{editando===null?'Generar borrador':'Guardar correcciones'}</button>
   {editando!==null&&<button type="button" className="sicom-accion" onClick={()=>{setEditando(null);setTitulo('');setIndicacion('');setPlantilla('');}}>Cancelar edición</button>}
  </form>
  {error&&<p role="alert" className="text-red-700">{error}</p>}
  {mensaje&&<p role="status" className="text-emerald-800">{mensaje}</p>}
  {q.isLoading&&<p>Cargando guías…</p>}
  {q.isError&&<p role="alert">No se pudo consultar la biblioteca. <button className="underline" onClick={()=>void q.refetch()}>Reintentar</button></p>}
  {q.data?.map(g=><article key={g.id} className="space-y-2 rounded border p-3">
   <p className="font-semibold">{g.titulo} <span className="text-xs text-ink-500">· {g.estado}</span></p>
   <div className="flex flex-wrap items-center gap-2">
    <a className="sicom-accion" target="_blank" rel="noopener noreferrer" href={urlPractica(g.plantilla,'solucion',g.titulo,g.indicacion)} onClick={()=>{setVista(g.id);setConfirmada(false);}}>Probar solución</a>
    {g.estado!=='PUBLICADO'&&<button type="button" className="sicom-accion" disabled={ocupado} onClick={()=>{const c=biblioteca.find(c=>c.id===g.plantilla);if(!c)return;setEditando(g.id);setTitulo(g.titulo);setGrupo(c.grupo);setPlantilla(c.id);setIndicacion(g.indicacion);setVista(null);}}>Corregir borrador</button>}
    {g.estado==='BORRADOR'&&vista===g.id&&<><label className="flex gap-2 text-sm"><input type="checkbox" checked={confirmada} onChange={e=>setConfirmada(e.target.checked)}/> Probé el recorrido y resuelve el problema.</label><button className="sicom-accion" disabled={!confirmada||ocupado} onClick={()=>void ejecutar(()=>apiClient.post(`${rutaAdmin}/${g.id}/aprobar`,{confirmada}),'Guía aprobada. Ya puedes publicarla.')}>Aprobar</button></>}
    {g.estado==='APROBADO'&&<button className="sicom-accion sicom-accion-principal" disabled={ocupado} onClick={()=>void ejecutar(()=>apiClient.post(`${rutaAdmin}/${g.id}/publicar`),'Guía publicada.')}>Publicar</button>}
    {g.estado==='PUBLICADO'&&<button className="sicom-accion" disabled={ocupado} onClick={()=>void ejecutar(()=>apiClient.post(`${rutaAdmin}/${g.id}/retirar`),'Guía retirada. Debe revisarse antes de volver a publicarla.')}>Retirar</button>}
   </div>
  </article>)}
 </section>;
}
