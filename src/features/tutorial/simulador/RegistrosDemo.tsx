import {useState} from 'react';
import {Blanco,Boton,dinero} from './controles';
import type {ModuloDemo,Fila} from './catalogo';

export function RegistrosDemo({modulo:m,accion,error}:{modulo:ModuloDemo;accion:(...ids:string[])=>void;error:(s:string)=>void}){
 const [filas,setFilas]=useState<Fila[]>([{id:1,nombre:m.ejemplo,detalle:m.detalle,estado:m.estado}]);
 const [buscar,setBuscar]=useState(''),[seleccion,setSeleccion]=useState(1),[abierto,setAbierto]=useState(false),[form,setForm]=useState<Fila|null>(null);
 const [movimiento,setMovimiento]=useState('');
 const fila=filas.find(f=>f.id===seleccion);
 const visibles=filas.filter(f=>f.nombre.toLocaleLowerCase().includes(buscar.trim().toLocaleLowerCase()));
 const numerico=/^(\d+)$/.test(m.detalle);
 const valor=(v:string)=>numerico&&(/precio|efectivo|importe|valor/i.test(m.campo))?dinero(Number(v)):v;
 function crear(){setForm({id:0,nombre:'',detalle:'',estado:m.estado});accion('crear');}
 function consultar(f:Fila){setSeleccion(f.id);setAbierto(true);accion('consultar');}
 function editar(){
  if(!fila)return error('Selecciona un registro de ejemplo.');
  if(m.id==='caja')setMovimiento('');
  setForm({...fila});accion('editar');
 }
 function guardar(){
  if(!form)return;
  const detalle=m.id==='caja'&&form.id?String(Number(form.detalle)+Number(movimiento)):form.detalle;
  if(m.id==='caja'&&form.id&&(!movimiento.trim()||!Number.isFinite(Number(movimiento))||Number(movimiento)===0))return error('Indica una entrada o salida distinta de cero.');
  if(!form.nombre.trim()||!detalle.trim())return error('Completa los campos resaltados antes de guardar.');
  if(numerico&&(!Number.isFinite(Number(detalle))||['compras','inventario'].includes(m.id)&&!Number.isInteger(Number(detalle))||Number(detalle)<0||m.id==='descuentos'&&Number(detalle)>100))return error('Revisa el valor numérico ingresado.');
  const nuevo={...form,id:form.id||Math.max(0,...filas.map(x=>x.id))+1,nombre:form.nombre.trim(),detalle:detalle.trim()};
  setFilas(form.id?filas.map(f=>f.id===form.id?nuevo:f):[...filas,nuevo]);setSeleccion(nuevo.id);setForm(null);setBuscar('');setAbierto(true);accion('guardar');
 }
 function cambiar(){
  if(!fila)return error('Selecciona un registro de ejemplo.');
  setFilas(filas.map(f=>f.id===seleccion?{...f,estado:f.estado===m.estado?m.cambio:m.estado}:f));setAbierto(true);accion('cambiar');
 }
 return <div className="grid gap-4 md:grid-cols-2">
  <section className="space-y-3 rounded-xl border bg-white p-4">
   <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold">{m.nombre} · Demo</h3><Boton id="crear" principal onClick={crear}>{m.acciones[0]}</Boton></div>
   <Blanco id="buscar" marcar><label className="block">{m.acciones[1]}<input className="input" value={buscar} onChange={e=>{const v=e.target.value;setBuscar(v);if(v.trim()&&filas.some(f=>f.nombre.toLowerCase().includes(v.trim().toLowerCase())))accion('buscar');}}/></label></Blanco>
   <ul className="space-y-2">{visibles.map(f=><li key={f.id} className="space-y-2 rounded-lg border p-2"><div className="flex flex-wrap justify-between gap-2"><strong>{f.nombre}</strong><span className="rounded bg-emerald-50 px-2 text-emerald-800">{f.estado}</span></div><Boton id="consultar" onClick={()=>consultar(f)}>{m.acciones[2]} · {f.nombre}</Boton></li>)}</ul>
   {!visibles.length&&<p>No hay coincidencias. Corrige la búsqueda.</p>}
  </section>
  <section className="space-y-3 rounded-xl border bg-white p-4">
   {form?<Blanco id="guardar"><div className="space-y-3">
    <h3 className="font-bold">{form.id?m.acciones[3]:m.acciones[0]}</h3>
    <label className="block">Nombre de ejemplo<input className="input" maxLength={80} placeholder={m.ejemplo} value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})}/></label>
    {m.id==='caja'&&form.id?<label className="block">Movimiento (+ entrada, − salida)<input className="input" type="number" value={movimiento} onChange={e=>setMovimiento(e.target.value)}/></label>:<label className="block">{m.campo}{m.id==='usuarios'?<select className="input" value={form.detalle} onChange={e=>setForm({...form,detalle:e.target.value})}><option value="">Elige un rol</option><option>Vendedor</option><option>Inventario</option><option>Administrador</option></select>:<input className="input" type={m.id==='servicios'?'datetime-local':numerico?'number':'text'} maxLength={100} placeholder={m.detalle} value={form.detalle} onChange={e=>setForm({...form,detalle:e.target.value})}/>}</label>}
    <button type="button" className="sicom-accion sicom-accion-principal" onClick={guardar}>Guardar en la práctica</button> <button type="button" className="sicom-accion" onClick={()=>setForm(null)}>Cancelar</button>
   </div></Blanco>:abierto&&fila?<div className="space-y-3" aria-live="polite">
    <h3 className="font-bold">{m.entidad} · {fila.nombre}</h3>
    <div className="rounded-lg bg-emerald-50 p-3"><span className="text-xs">{m.campo}</span><p className="text-xl font-bold">{valor(fila.detalle)}</p><p>{fila.estado}</p></div>
    {m.id==='compras'&&<div className="rounded-lg border p-3 text-sm"><p>Producto: Café demo · {dinero(2500)} por unidad</p><p>Total de la orden: <strong>{dinero(Number(fila.detalle)*2500)}</strong></p><p>Existencias de práctica: <strong>{12+(fila.estado===m.cambio?Number(fila.detalle):0)}</strong> unidades</p></div>}
    {m.id==='facturacion'&&<div className="rounded-lg border-2 border-dashed p-3 text-sm"><strong>FACTURA DEMO · {String(fila.id).padStart(4,'0')}</strong><p>{fila.nombre}</p><p>Subtotal {dinero(Number(fila.detalle))}</p><p>IVA de ejemplo {dinero(Math.round(Number(fila.detalle)*.19))}</p><p className="font-semibold">Total demo {dinero(Number(fila.detalle)+Math.round(Number(fila.detalle)*.19))}</p><p className="text-xs">Sin validez fiscal</p></div>}
    {m.id==='reportes'&&<div aria-label="Gráfico de comparación demo" className="flex h-32 items-end justify-center gap-6 border-b px-4">{[Number(fila.detalle),30000,24000].map((v,i)=><div key={i} title={dinero(v)} className="w-12 rounded-t bg-emerald-600 text-center text-xs text-white" style={{height:`${Math.max(10,100*v/Math.max(Number(fila.detalle),30000))}%`}}>{i+1}</div>)}</div>}
    {m.id==='usuarios'&&<ul className="list-disc pl-5">{(fila.detalle==='Administrador'?['Ventas','Inventario','Configuración']:fila.detalle==='Inventario'?['Inventario','Productos']:['Ventas','Clientes']).map(x=><li key={x}>{x}</li>)}</ul>}
    <Boton id="editar" onClick={editar}>{m.acciones[3]}</Boton><Boton id="cambiar" principal onClick={cambiar}>{fila.estado===m.estado?m.acciones[4]:'Restablecer estado demo'}</Boton>
   </div>:<div className="grid min-h-32 place-items-center rounded-xl border border-dashed p-4 text-center text-ink-500">Abre un ejemplo para ver su resultado aquí.</div>}
  </section>
 </div>;
}
