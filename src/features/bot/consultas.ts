import {apiClient} from '@/api/client';
import type {StockPorSucursal} from '@/types/inventario';
import {normal,type Respuesta} from './resolver';

export type Consulta={tipo:'ventas'|'stock'|'cxp'|'cxc';nombre:string;periodo?:'ayer'|'hoy'|'mes'};
export function detectar(pregunta:string,pendiente?:Consulta):Consulta|undefined{
 const q=normal(pregunta);
 if(/^(como|donde|pasos para|quiero aprender)\b/.test(q)&&!/^(como nos fue)\b/.test(q))return;
 if(/\b(vendimos|vendi|se vendio|total de ventas|ventas de hoy|ventas de ayer|ventas del mes|ventas de este mes|como nos fue)\b/.test(q)){
  if(/\b(otra sucursal|todas|empresa|semana|mes pasado|ano|desde|hasta)\b|\b\d{4}\b/.test(q))return;
  return {tipo:'ventas',nombre:'',periodo:/\bayer\b/.test(q)?'ayer':/\bmes\b/.test(q)?'mes':'hoy'};
 }
 const saldo=q.match(/^(?:cuanto (?:le debo|debemos pagar|debemos)\s*(?:a |al )?|(?:saldo|deuda) (?:del |de )?proveedor\s*)(.*)$/);
 if(saldo)return {tipo:'cxp',nombre:saldo[1].replace(/^proveedor\s*/,'')};
 const cliente=q.match(/^(?:cuanto (?:me debe|nos debe)\s*|(?:saldo|deuda) (?:del |de )?cliente\s*)(.*)$/);
 if(cliente)return {tipo:'cxc',nombre:cliente[1].replace(/^cliente\s*/,'')};
 const stock=q.match(/^(?:stock(?: de)?|existencias(?: de)?|cuantas? (?:unidades |unidades de )?(?:quedan|hay|tenemos)(?: de)?)\s*(.*)$/);
 if(stock)return {tipo:'stock',nombre:stock[1]};
 if(pendiente&&q.length<=160&&!/\b(ventas|cancelar|anular)\b/.test(q))return {...pendiente,nombre:q};
}
const dinero=(n:number)=>new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP'}).format(n);
type Informe={sucursal:string;desde:string;hasta:string;total?:number;registros?:number;nombre?:string;requiereNombre?:boolean;ambiguo?:boolean;opciones?:string[]};
export async function consultar(c:Consulta,sucursal:number|null,signal:AbortSignal):Promise<Respuesta>{
 const vivo={datoVivo:true};
 if(!sucursal)return {...vivo,texto:'Selecciona tu sucursal de trabajo en Punto de venta y vuelve a preguntar.'};
 if(c.tipo!=='ventas'&&c.nombre.trim().length<2)return {...vivo,texto:`¿Cuál es el nombre del ${c.tipo==='stock'?'producto':c.tipo==='cxp'?'proveedor':'cliente'}?`,pendiente:c};
 try{
  if(c.tipo==='stock'){
   const {data}=await apiClient.get<StockPorSucursal[]>(`/inventario/stock/sucursal/${sucursal}`,{signal});
   const n=normal(c.nombre),exactos=data.filter(f=>normal(f.productoNombre)===n);
   const filas=exactos.length?exactos:data.filter(f=>normal(f.productoNombre).includes(n));
   if(!filas.length)return {...vivo,texto:'No encontré ese producto en las existencias de la sucursal seleccionada.',pendiente:c};
   if(filas.length!==1)return {...vivo,texto:`Especifica el producto: ${[...new Set(filas.map(f=>f.productoNombre))].slice(0,5).join(', ')}.`,pendiente:c};
   const f=filas[0];return {...vivo,texto:`${f.productoNombre}: ${f.stockActual} unidades en ${f.sucursalNombre}.`,fuente:'/inventario'};
  }
  const {data:d}=await apiClient.get<Informe>(`/reportes/vista/bot/${c.tipo}`,{params:{sucursalId:sucursal,periodo:c.periodo,nombre:c.nombre},signal});
  const fuente='/reportes?'+new URLSearchParams({tipo:c.tipo,sucursalId:String(sucursal),desde:d.desde,hasta:d.hasta,usuarioId:'',estado:''});
  if(c.tipo==='ventas'&&d.total!=null)return {...vivo,texto:`Ventas completadas en ${d.sucursal}, ${d.desde} a ${d.hasta}: ${dinero(d.total)} en ${d.registros} ventas. El total no equivale al efectivo recaudado y no resta devoluciones posteriores.`,fuente};
  if(d.ambiguo)return {...vivo,texto:`Encontré más de una coincidencia. Especifica el nombre: ${d.opciones?.join(', ')}.`,pendiente:c};
  if(d.total!=null)return {...vivo,texto:`${d.nombre}: ${dinero(d.total)} de saldo pendiente en ${d.sucursal}. Solo incluye documentos vinculados a esta sucursal.`,fuente};
  return {...vivo,texto:'No encontré saldos pendientes con ese nombre en la sucursal seleccionada. Esto no confirma que el saldo en otras sucursales sea cero.',pendiente:c};
 }catch{
  return {...vivo,texto:'No pude consultar esa información. Verifica tu acceso al módulo y a la sucursal o vuelve a intentarlo. No se puede confirmar un total.'};
 }
}
