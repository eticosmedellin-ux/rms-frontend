import {isAxiosError} from 'axios';
import {apiClient} from '@/api/client';
import type {Respuesta} from './resolver';
import type {Consulta,Regla,Sede} from './lenguaje';
export type {Consulta} from './lenguaje';
const ruta='/reportes/vista/bot';
export const cargarSedes=async(signal:AbortSignal)=>(await apiClient.get<Sede[]>(ruta+'/sucursales',{signal})).data;
export const cargarConocimiento=async(signal:AbortSignal)=>(await apiClient.get<Regla[]>('/ayuda/bot/conocimiento',{signal})).data;
const dinero=(n:unknown)=>new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP'}).format(Number(n));
type Informe={alcance:string;sedes?:string[];evaluados?:number;omitidos?:number;conteosCompras?:{ordenes?:number;recepciones?:number;facturas?:number;pendientes?:number};unidades?:number;porSede?:Record<string,number>;desde:string;hasta:string;sucursalId?:number;total:number;registros:number;facturas?:number;otros?:number;resumenVentas?:{ventas:number;vendido:number};medios?:{nombre:string;total:number}[];INGRESO?:number;EGRESO?:number;filas:Record<string,string|number>[]};
const titulos:Record<Consulta['tipo'],string>={ventas:'Ventas completadas',documentos:'Documentos de venta',productos:'Productos vendidos',pagos:'Pagos registrados de ventas',ranking:'Ventas por sucursal',inventario:'Existencias',agotados:'Productos agotados',bajos:'Existencias bajas o agotadas',valor:'Valor estimado de inventario',compras:'Compras no anuladas',cxp:'Saldo pendiente por pagar',cxc:'Saldo pendiente por cobrar',caja:'Movimientos de caja',gastos:'Gastos',utilidad:'Utilidad bruta estimada',recepciones:'Órdenes pendientes de recibir',arqueos:'Cierres de caja',clientesVentas:'Ventas por cliente',vendedores:'Ventas por vendedor',comprasResumen:'Resumen de compras',ordenesCompra:'Órdenes de compra',recepcionesCompra:'Recepciones registradas',comprasPendientes:'Órdenes pendientes de recibir',sugerenciaCompra:'Cantidad sugerida de compra',reposicion:'Prioridades de reposición',margenProducto:'Margen bruto por producto',margenBajo:'Productos más vendidos con margen bajo',rotacion:'Productos con menos unidades vendidas entre los que sí tuvieron ventas'};
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
  if(c.tipo==='sugerenciaCompra'){
   return {...base,texto:[`Cantidad sugerida de compra · ${alcance}`,`Objetivo: 14 días de cobertura. Ventas de referencia: ${periodo}.`,
    d.registros?`Productos por sucursal con sugerencia positiva: ${cantidad(d.registros)}.`:'No encontré sugerencias positivas entre los productos con ventas directas y stock registrado en este alcance.',
    ...d.filas.map(f=>`• ${f.nombre}${f.codigo?' ('+f.codigo+')':''} · ${f.sucursal}: pedir ${cantidad(Number(f.cantidad_sugerida))} unidades · stock ${cantidad(Number(f.stock))} · vendidas ${cantidad(Number(f.unidades))} · pendientes descontadas por fecha prevista ${cantidad(Number(f.entregas_contadas))}`
     +(Number(f.unidades_vencidas)>0?` · vencidas sin descontar: ${cantidad(Number(f.unidades_vencidas))}`:'')
     +(Number(f.unidades_sin_fecha)>0?` · sin fecha sin descontar: ${cantidad(Number(f.unidades_sin_fecha))}`:'')
     +(f.fecha_esperada?' · primera fecha registrada: '+fecha(String(f.fecha_esperada)):'') ),
    d.registros>10?'Se muestran 10 prioridades.':'',
    'Estimación en unidades, redondeada hacia arriba. Solo descuenta entregas previstas desde hoy hasta dentro de 14 días. La fecha no garantiza la entrega. No crea órdenes ni convierte unidades a cajas.',
   ].filter(Boolean).join('\n')};
  }
  if(c.tipo==='reposicion'){
   if(typeof d.registros!=='number'||!Array.isArray(d.filas))throw new Error('Respuesta de reposición incompleta');
   const compraPendiente=(f:Informe['filas'][number])=>{
    if(f.pendiente_compra==null)return ' · Pendientes de compra no disponibles';
    if(Number(f.pendiente_compra)<=0)return ' · Sin unidades pendientes en órdenes enviadas o parciales';
    const ordenes=Number(f.ordenes_compra),sinFecha=Number(f.ordenes_sin_fecha);
    return ` · Pendientes: ${cantidad(Number(f.pendiente_compra))} unidades en ${cantidad(ordenes)} ${ordenes===1?'orden':'órdenes'}`
     +(f.fecha_esperada?' · Primera fecha registrada: '+fecha(String(f.fecha_esperada)):'')
     +(sinFecha?` · ${cantidad(sinFecha)} ${sinFecha===1?'orden sin fecha':'órdenes sin fecha'}`:'');
   };
   return {...base,texto:[`Prioridades de reposición · ${alcance}`,
    `Ventas usadas para estimar el ritmo: ${periodo}. Las existencias corresponden al momento de la consulta.`,
    d.registros?`Encontré ${cantidad(d.registros)} combinaciones de producto y sucursal para revisar.`:'No encontré productos con ventas directas y señales de reposición en ese período y alcance.',
    ...d.filas.map(f=>`• ${f.nombre}${f.codigo?' ('+f.codigo+')':''} · ${f.sucursal}: stock ${cantidad(Number(f.stock))} · mínimo ${cantidad(Number(f.minimo))} · vendidas ${cantidad(Number(f.unidades))} · ${Number(f.stock)<=0?'agotado':cantidad(Number(f.cobertura_redondeada??f.cobertura))+' días de cobertura estimada'}${compraPendiente(f)}`),
    d.registros>10?'Se muestran las 10 prioridades principales.':'',
    'Incluye productos con ventas directas que están agotados, por debajo del mínimo o con cobertura de hasta 7 días. La cobertura se calcula con stock actual; las órdenes pendientes se muestran aparte. La fecha esperada no confirma la entrega. Las ventas no incluyen componentes de combos ni descuentan devoluciones posteriores.',
   ].filter(Boolean).join('\n')};
  }
  if(c.tipo==='margenProducto'||c.tipo==='margenBajo'){
   if(typeof d.evaluados!=='number'||typeof d.omitidos!=='number')throw new Error('Respuesta de margen incompleta');
   const bajo=c.tipo==='margenBajo';
   return {...base,texto:[`${titulos[c.tipo]} · ${periodo}. ${alcance}`,
    bajo?'Criterio: entre el 25 % con más unidades vendidas de los productos evaluables, con margen menor al 15 %.':'Ordenado por unidades vendidas.',
    `Productos evaluados: ${cantidad(d.evaluados)} · Coincidencias: ${cantidad(d.registros)}.`,
    d.omitidos?`Se excluyeron ${cantidad(d.omitidos)} productos por falta de base o costo histórico utilizable, o por ingreso sin impuestos no positivo.`:'',
    ...d.filas.map(f=>`• ${f.nombre}${f.codigo?' ('+f.codigo+')':''}: ${cantidad(Number(f.unidades))} unidades · margen ${cantidad(Number(f.margen))} % · ganancia bruta ${dinero(f.utilidad)} · venta sin impuestos ${dinero(f.ingreso)} · costo ${dinero(f.costo)}`),
    d.registros>10?'Se muestran hasta 10 productos.':'',
    'Estimación sobre ventas completadas, con descuentos incluidos en la base de venta. Excluye combos, devoluciones posteriores y gastos.',
   ].filter(Boolean).join('\n')};
  }
  if(['comprasResumen','ordenesCompra','recepcionesCompra','comprasPendientes'].includes(c.tipo)){
   const r=d.conteosCompras;if(!r)throw new Error('Conteo de compras incompleto');
   return {...base,fuente:'/compras',texto:[`${titulos[c.tipo]} · ${periodo}. ${alcance}`,
    r.ordenes!=null?`• Órdenes enviadas, parciales o recibidas: ${cantidad(r.ordenes)} (según fecha de creación).`:'',
    r.recepciones!=null?`• Recepciones registradas: ${cantidad(r.recepciones)} (según fecha de recepción; una orden puede tener varias).`:'',
    r.facturas!=null?`• Facturas no anuladas: ${cantidad(r.facturas)} (según fecha de emisión; solo las vinculadas a una sede consultada).`:'',
    r.pendientes!=null?`• Órdenes creadas en ese período que hoy siguen pendientes de recibir: ${cantidad(r.pendientes)}.`:'',
    'Cada registro se cuenta en la sucursal de su encabezado. Los conteos no se suman entre sí.',
   ].filter(Boolean).join('\n')};
  }
  if(c.tipo==='compras'&&c.contar)return {...base,texto:[
   `Encontré ${cantidad(d.registros)} ${d.registros===1?'factura de compra no anulada':'facturas de compra no anuladas'}.`,
   `Período: ${periodo}. ${alcance}`,
   d.registros?`Total facturado por proveedores: ${dinero(d.total)}.`:'',
   'Conteo por fecha de emisión de las facturas vinculadas a las sucursales consultadas. Las órdenes, las recepciones y las facturas sin sede vinculada no forman parte de este conteo.',
  ].filter(Boolean).join('\n')};
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
 }catch(error){
  if((c.tipo==='margenBajo'||c.tipo==='margenProducto')&&isAxiosError(error)&&error.response?.status===403)
   return {datoVivo:true,contexto:c,texto:'No tienes acceso a este análisis. Se requiere permiso para consultar Reportes y ver costos en la sucursal solicitada.'};
  return {datoVivo:true,contexto:c,texto:'No pude consultar los datos. Verifica el permiso de Reportes, la sede y el período. No se puede confirmar un total.'};}
}
