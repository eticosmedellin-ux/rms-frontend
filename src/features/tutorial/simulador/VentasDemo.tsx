import {totales,efectivoValido} from './calculos';
import {useState} from 'react';
import {Boton,Blanco,dinero} from './controles';
const productos=[{id:1,nombre:'Café demo',precio:2500},{id:2,nombre:'Pan demo',precio:3500},{id:3,nombre:'Jugo demo',precio:4500}];
type Linea=(typeof productos)[number]&{cantidad:number};
type Recibo={lineas:Linea[];cliente:string;subtotal:number;rebaja:number;total:number;pago:string;efectivo:number};
export function VentasDemo({accion,error,puedeFinalizar}:{accion:(...ids:string[])=>void;error:(s:string)=>void;puedeFinalizar:boolean}){
 const [abierta,setAbierta]=useState(false),[buscar,setBuscar]=useState(''),[lineas,setLineas]=useState<Linea[]>([]),[cliente,setCliente]=useState(''),[dto,setDto]=useState(0),[pago,setPago]=useState(''),[efectivo,setEfectivo]=useState(''),[recibo,setRecibo]=useState<Recibo|null>(null);
 const {subtotal,rebaja,total}=totales(lineas,dto);
 const filtrados=productos.filter(p=>p.nombre.toLowerCase().includes(buscar.trim().toLowerCase()));
 function agregar(p:typeof productos[number]){
  const existe=lineas.some(l=>l.id===p.id);
  if(existe&&(lineas.find(l=>l.id===p.id)?.cantidad??0)>=99)return error('La cantidad máxima por línea es 99.');
  setLineas(existe?lineas.map(l=>l.id===p.id?{...l,cantidad:l.cantidad+1}:l):[...lineas,{...p,cantidad:1}]);
  accion('agregar',...(!existe&&lineas.length?['agregarOtro']:[]));
 }
 function finalizar(){
  if(!puedeFinalizar)return error('Completa o recorre los pasos anteriores antes de finalizar.');
  if(!lineas.length)return error('Agrega al menos un producto al carrito.');
  if(!pago)return error('Selecciona un medio de pago.');
  if(pago==='Pago mixto'&&!efectivoValido(efectivo,total))return error('El efectivo debe ser mayor que cero y menor que el total.');
  setRecibo({lineas,cliente,subtotal,rebaja,total,pago,efectivo:Number(efectivo)});accion('finalizar');
 }
 if(recibo)return <div className="mx-auto max-w-md space-y-3 rounded-xl border-2 border-dashed border-emerald-400 bg-white p-5">
  <strong className="text-emerald-800">✓ Venta simulada completada</strong><p>Recibo DEMO · {recibo.cliente||'Consumidor final'}</p>
  {recibo.lineas.map(l=><div key={l.id} className="flex justify-between"><span>{l.cantidad} × {l.nombre}</span><span>{dinero(l.cantidad*l.precio)}</span></div>)}
  <div className="border-t pt-2">Subtotal {dinero(recibo.subtotal)} · Descuento {dinero(recibo.rebaja)}</div>
  <p className="font-bold">Total {dinero(recibo.total)}</p><p>{recibo.pago==='Pago mixto'?`Efectivo ${dinero(recibo.efectivo)} + Tarjeta ${dinero(recibo.total-recibo.efectivo)}`:recibo.pago}</p>
  <Boton id="nueva" onClick={()=>{setRecibo(null);setLineas([]);setBuscar('');setCliente('');setDto(0);setPago('');setEfectivo('');accion('nueva');}}>Practicar otra venta</Boton>
 </div>;
 if(!abierta)return <div className="mx-auto max-w-sm space-y-3 rounded-xl border bg-white p-5"><p className="font-semibold">Caja de práctica · Cerrada</p><Boton id="abrir" principal onClick={()=>{setAbierta(true);accion('abrir');}}>Abrir caja demo</Boton></div>;
 return <div className="grid gap-4 md:grid-cols-2">
  <section className="space-y-3 rounded-xl border bg-white p-4">
   <h3 className="font-bold">Productos demo <span className="text-xs text-emerald-700">● Caja abierta</span></h3>
   <Blanco id="buscar" marcar><label className="block">Buscar producto<input className="input" value={buscar} onChange={e=>{const v=e.target.value;setBuscar(v);if(v.trim()&&productos.some(p=>p.nombre.toLowerCase().includes(v.toLowerCase())))accion('buscar');}}/></label></Blanco>
   <Blanco id="agregar|agregarOtro"><ul className="space-y-2">{filtrados.map(p=><li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded border p-2"><span>{p.nombre} · {dinero(p.precio)}</span><button type="button" className="sicom-accion" onClick={()=>agregar(p)}>Agregar {p.nombre}</button></li>)}</ul></Blanco>
   {!filtrados.length&&<p>No hay coincidencias. Prueba Café, Pan o Jugo.</p>}
   {buscar&&<button type="button" className="sicom-accion" onClick={()=>setBuscar('')}>Limpiar búsqueda</button>}
  </section>
  <section className="space-y-3 rounded-xl border bg-white p-4">
   <h3 className="font-bold">Carrito</h3>
   {!lineas.length&&<p className="text-ink-500">El carrito está vacío.</p>}
   {lineas.map(l=><div key={l.id} className="grid grid-cols-[1fr_auto] items-center gap-2 rounded border p-2"><span>{l.nombre}<br/>{dinero(l.precio*l.cantidad)}</span>
    <Blanco id="cantidad"><label className="block text-xs">Cantidad de {l.nombre}<input className="input w-20" type="number" min={1} max={99} value={l.cantidad} onChange={e=>{const n=Number(e.target.value);if(!Number.isInteger(n)||n<1||n>99)return error('Usa una cantidad entre 1 y 99.');setLineas(lineas.map(x=>x.id===l.id?{...x,cantidad:n}:x));accion('cantidad');}}/></label></Blanco>
    <Boton id="eliminar" onClick={()=>{setLineas(lineas.filter(x=>x.id!==l.id));accion('eliminar');}}>Retirar {l.nombre}</Boton>
   </div>)}
   <Blanco id="cliente" marcar><label className="block">Cliente<select className="input" value={cliente} onChange={e=>{setCliente(e.target.value);if(e.target.value)accion('cliente');}}><option value="">Consumidor final</option><option>Ana Demo</option><option>Julián Demo</option></select></label></Blanco>
   <Blanco id="descuento" marcar><label className="block">Descuento<select className="input" value={dto} onChange={e=>{setDto(Number(e.target.value));if(Number(e.target.value)>0)accion('descuento');}}><option value={0}>Sin descuento</option><option value={10}>10 %</option><option value={20}>20 %</option></select></label></Blanco>
   <Blanco id="pago|pagoMixto" marcar><label className="block">Medio de pago<select className="input" value={pago} onChange={e=>{setPago(e.target.value);if(e.target.value)accion('pago',...(e.target.value==='Pago mixto'?['pagoMixto']:[]));}}><option value="">Selecciona…</option><option>Efectivo</option><option>Tarjeta</option><option>Transferencia</option><option>Pago mixto</option></select></label></Blanco>
   {pago==='Pago mixto'&&<Blanco id="abono"><label className="block">Importe en efectivo<input type="number" className="input" value={efectivo} onChange={e=>{setEfectivo(e.target.value);if(efectivoValido(e.target.value,total))accion('abono');}}/></label><p>Saldo en tarjeta: {dinero(Math.max(0,total-Number(efectivo)))}</p></Blanco>}
   <div aria-live="polite" className="rounded-lg bg-emerald-50 p-3">Subtotal {dinero(subtotal)} · Descuento {dinero(rebaja)}<p className="text-xl font-bold">Total {dinero(total)}</p></div>
   <Boton id="finalizar" principal onClick={finalizar}>Finalizar venta demo</Boton>
  </section>
 </div>;
}
