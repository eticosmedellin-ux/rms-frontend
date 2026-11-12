import {apiClient} from '@/api/client';
import type {Respuesta} from './resolver';
import type {Consulta,Regla,Sede} from './lenguaje';
export type {Consulta} from './lenguaje';
const ruta='/reportes/vista/bot';
export const cargarSedes=async(signal:AbortSignal)=>(await apiClient.get<Sede[]>(ruta+'/sucursales',{signal})).data;
export const cargarConocimiento=async(signal:AbortSignal)=>(await apiClient.get<Regla[]>('/ayuda/bot/conocimiento',{signal})).data;
const dinero=(n:unknown)=>new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP'}).format(Number(n));
type Informe={alcance:string;sedes?:string[];unidades?:number;porSede?:Record<string,number>;desde:string;hasta:string;sucursalId?:number;total:number;registros:number;facturas?:number;otros?:number;resumenVentas?:{ventas:number;vendido:number};medios?:{nombre:string;total:number}[];INGRESO?:number;EGRESO?:number;filas:Record<string,string|number>[]};
const titulos:Record<Consulta['tipo'],string>={ventas:'Ventas completadas',documentos:'Documentos de venta',productos:'Productos vendidos',pagos:'Pagos registrados de ventas',ranking:'Ventas por sucursal',inventario:'Existencias',agotados:'Productos agotados',bajos:'Existencias bajas o agotadas',valor:'Valor estimado de inventario',compras:'Compras no anuladas',cxp:'Saldo pendiente por pagar',cxc:'Saldo pendiente por cobrar',caja:'Movimientos de caja',gastos:'Gastos',utilidad:'Utilidad bruta estimada',recepciones:'Órdenes pendientes de recibir',arqueos:'Cierres de caja',clientesVentas:'Ventas por cliente',vendedores:'Ventas por vendedor',rotacion:'Productos con menos unidades vendidas entre los que sí tuvieron ventas'};
export async function consultar(c:Consulta,signal:AbortSignal):Promise<Respuesta>{
 try{
  const {data:d}=await apiClient.get<Informe>(ruta+'/'+c.tipo,{params:{desde:c.desde,hasta:c.hasta,sucursalId:c.sucursalId,nombre:c.nombre||undefined,soloFacturas:c.soloFacturas,ultimo:c.ultimo},signal});
  const fecha=(f:string)=>new Intl.DateTimeFormat('es-CO',{dateStyle:'long',timeZone:'UTC'}).format(new Date(f+'T00:00:00Z'));
  const periodo=d.desde===d.hasta?fecha(d.desde):`del ${fecha(d.desde)} al ${fecha(d.hasta)}`;
  const cantidad=(n:number)=>n.toLocaleString('es-CO');
  const alcanceDetalle=d.sedes?.length?'La consulta anterior incluyó '+d.sedes.join(', ')+'.':'La consulta anterior corresponde a: '+d.alcance+'.';
  const base={datoVivo:true,contexto:c,alcanceDetalle};
  const alcance=`Alcance: ${d.alcance}.`;
  if(c.tipo==='arqueos'&&c.ultimo){
   const f=d.filas[0];
   return {...base,texto:[f?(f.empleado?`${f.empleado} realizó el último cierre de caja.`:'Encontré el último cierre, pero su auditoría no identifica quién lo realizó.'):'No encontré cierres de caja en ese período.',
    f?`Sucursal: ${f.sucursal}. Fecha y hora registrada: ${String(f.fecha).replace('T',' ').slice(0,16)}.`:'',`Período: ${periodo}. ${alcance}`].filter(Boolean).join('\n')};
  }
  if(c.tipo==='pagos'){
   const lista=[...d.filas].sort((a,b)=>Number(b[c.porMonto?'total':'cantidad'])-Number(a[c.porMonto?'total':'cantidad']));
   const campo=c.porMonto?'total':'cantidad',primero=lista[0],lideres=primero?lista.filter(f=>Number(f[campo])===Number(primero[campo])):[];
   return {...base,texto:[primero?`${c.porMonto?'Mayor monto registrado':'Medio de pago más utilizado'}: ${lideres.map(f=>f.nombre).join(', ')}${lideres.length>1?' (empate)':''}.`:'No encontré pagos asociados a ventas completadas en ese período.',
    `Período: ${periodo}. ${alcance}`,...lista.map(f=>`• ${f.nombre}: ${cantidad(Number(f.cantidad))} registros de pago · ${dinero(f.total)}`),
    primero?'Un pago dividido puede generar varios registros para la misma venta.':''].filter(Boolean).join('\n')};
  }
  if(c.tipo==='valor'&&d.porSede){
   return {...base,texto:[`El valor estimado del inventario actual es ${dinero(d.total)}.`,alcance,
    ...Object.entries(d.porSede).map(([s,v])=>`• ${s}: ${dinero(v)}`),'Estimación al costo registrado por producto; el precio de venta no se usa en este cálculo.'].join('\n')};
  }
  if(c.tipo==='documentos'){
   if(typeof d.facturas!=='number'||typeof d.otros!=='number')throw new Error('Respuesta de documentos incompleta');
   const tipo=c.soloFacturas?(d.registros===1?'factura de venta':'facturas de venta'):(d.registros===1?'documento de venta':'documentos de venta');
   const filas=d.filas.slice(0,10).filter(f=>Number(c.soloFacturas?f.facturas:f.cantidad)>0)
    .map(f=>`• ${f.sucursal}: ${cantidad(Number(c.soloFacturas?f.facturas:f.cantidad))}`);
   return {...base,texto:[
    `${d.registros?'Encontré':'No encontré'} ${d.registros?cantidad(d.registros)+' ':''}${d.registros?tipo:tipo+' en ese período'}.`,
    `Período: ${periodo} · Alcance: ${d.alcance}.`,
    !c.soloFacturas&&d.registros?`Desglose: ${cantidad(d.facturas)} con número de factura y ${cantidad(d.otros)} sin número de factura.`:'',
    ...(d.sucursalId?[]:filas),
    'Conteo sobre ventas completadas. No confirma el estado de emisión electrónica ni incluye notas crédito.',
   ].filter(Boolean).join('\n')};
  }
  if(c.comparar&&c.tipo==='ventas'){
   const {data:b}=await apiClient.get<Informe>(ruta+'/ventas',{params:{desde:c.comparar[0],hasta:c.comparar[1],sucursalId:c.sucursalId},signal});
   if(d.alcance!==b.alcance)throw new Error('Alcance distinto');
   return {...base,texto:`Ventas completadas · ${d.alcance}\n• ${d.desde} a ${d.hasta}: ${dinero(d.total)} · ${d.registros} ventas\n• ${b.desde} a ${b.hasta}: ${dinero(b.total)} · ${b.registros} ventas\nDiferencia del primer período frente al segundo: ${dinero(Number(d.total)-Number(b.total))}.`};
  }
  if(c.tipo==='ventas'&&c.contar)return {...base,
   fuente:d.sucursalId?'/reportes?'+new URLSearchParams({tipo:'ventas',sucursalId:String(d.sucursalId),desde:d.desde,hasta:d.hasta,usuarioId:'',estado:''}):undefined,
   texto:`${d.registros?`Se completaron ${cantidad(d.registros)} ${d.registros===1?'venta':'ventas'}.`:'No se registraron ventas completadas en ese período.'}\nPeríodo: ${periodo} · Alcance: ${d.alcance}.${d.registros?'\nTotal vendido: '+dinero(d.total)+'.':''}`};
  const actual=['inventario','agotados','bajos','valor','cxp','cxc'].includes(c.tipo);
  const total=['ventas','cxp','cxc','valor','compras','gastos','utilidad'].includes(c.tipo);
  const detalle=d.filas.slice(0,10).map(f=>{
   const titulo=f.nombre??f.producto??f.proveedor??f.cliente??f.numero??f.sucursal??'Registro';
   const montos=[['total','Total'],['saldo','Saldo'],['monto','Importe'],['diferencia','Diferencia']].filter(([k])=>f[k]!=null).map(([k,t])=>`${t}: ${dinero(f[k])}`);
   return `• ${titulo}${f.sucursal&&titulo!==f.sucursal?' · '+f.sucursal:''}${f.cantidad!=null?' · Cantidad: '+f.cantidad:''}${f.pendiente!=null?' · Pendiente: '+f.pendiente:''}${montos.length?' · '+montos.join(' · '):''}`;
  });
  const tipoFuente=({ranking:'ventas',productos:'ventas',pagos:'ventas',vendedores:'ventas',clientesVentas:'ventas',rotacion:'ventas',agotados:'inventario',bajos:'inventario',valor:'inventario'} as Record<string,string>)[c.tipo]??c.tipo;
  const fuente=d.sucursalId?'/reportes?'+new URLSearchParams({tipo:tipoFuente,sucursalId:String(d.sucursalId),desde:d.desde,hasta:d.hasta,usuarioId:'',estado:''}):undefined;
  const nota=c.tipo==='ventas'?'Incluye ventas completadas; no equivale al efectivo ni resta devoluciones posteriores.':
   c.tipo==='utilidad'?'Estimación según costos registrados, antes de gastos.':
   c.tipo==='cxp'||c.tipo==='cxc'?'Incluye únicamente documentos vinculados a las sedes consultadas.':
   c.tipo==='productos'||c.tipo==='rotacion'?'Cantidades por línea de venta. Hasta 20 resultados ordenados por unidades.':'';
  return {...base,fuente,texto:[`${titulos[c.tipo]} · ${d.alcance} · ${actual?'saldo o existencias actuales':d.desde+' a '+d.hasta}`,
    c.tipo==='inventario'&&typeof d.unidades==='number'?`Existencia total: ${cantidad(d.unidades)} unidades.`:'',c.nombre?'Filtro: '+c.nombre:'',d.registros?total?`Total: ${dinero(d.total)} · ${d.registros} registros`:c.tipo==='caja'?`Ingresos: ${dinero(d.INGRESO)} · Egresos: ${dinero(d.EGRESO)}`:'':'No hay registros que coincidan con este alcance.',
    d.resumenVentas?`Total vendido: ${dinero(d.resumenVentas.vendido)} · ${d.resumenVentas.ventas} ventas completadas`:'',
    ...detalle,d.medios?.length?'Pagos registrados: '+d.medios.map(p=>p.nombre+' '+dinero(p.total)).join(' · '):'',d.filas.length>10?'Se muestran los primeros 10 resultados.':'',nota].filter(Boolean).join('\n')};
 }catch{return {datoVivo:true,contexto:c,texto:'No pude consultar los datos. Verifica el permiso de Reportes, la sede y el período. No se puede confirmar un total.'};}
}
