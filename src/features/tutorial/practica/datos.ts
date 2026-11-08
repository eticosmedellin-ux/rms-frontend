import {AxiosError,type AxiosAdapter} from 'axios';
type Linea={productoId:number;cantidad:number;precioUnitario:number;tipoDescuentoId?:number};
type Pago={metodoPago:string;monto:number};
const baseProductos=[
 {id:1,nombre:'Café demo',codigoInterno:'DEMO-001',codigoBarras:'770000000001',precioVenta:5000,estado:true,manejaInventario:true},
 {id:2,nombre:'Pan demo',codigoInterno:'DEMO-002',codigoBarras:'770000000002',precioVenta:3500,estado:true,manejaInventario:true},
 {id:3,nombre:'Jugo demo',codigoInterno:'DEMO-003',codigoBarras:'770000000003',precioVenta:6000,estado:true,manejaInventario:true},
];
const clienteBase={telefono:'3000000000',email:null,direccion:null,limiteCredito:50000,saldoPendiente:0,estado:true,fechaNacimiento:null,puntosFidelizacion:0,esVip:false,ventasRegistradas:0,totalCompras:0};
const sede='Sucursal de práctica',usuario='Operador demo',ahora=()=>new Date().toISOString();
export function motorDemo(cerrada=false,evento:(op:string)=>void=()=>{}):AxiosAdapter{
 let productos=baseProductos.map(p=>({...p,precioCompra:2500,costoPromedio:2500,unidadMedida:'UN',impuestoTipo:'EXCLUIDO',impuestoTarifa:0,presentaciones:[]}));
 let proveedores=[{id:1,nombre:'Distribuidora Demo',nit:'900000001',estado:true,diasCredito:30},{id:2,nombre:'Suministros Demo',nit:'900000002',estado:true,diasCredito:0}];
 let ordenes=[{id:1,numero:'OC-DEMO-001',facturas:'F-DEMO-01',proveedorId:1,proveedor:'Distribuidora Demo',sucursalId:1,sucursal:sede,estado:'RECIBIDA',fecha:ahora(),detalles:[]}];
 let clientes=[{...clienteBase,id:1,nombre:'Ana Demo',documento:'10001',saldoPendiente:12000},{...clienteBase,id:2,nombre:'Luis Demo',documento:'10002'}];
 let caja=cerrada?null:{id:1,montoApertura:50000,fechaApertura:ahora()};
 let secuencia=2,stock=[20,15,10];
 let movimientos:{id:number;tipo:string;concepto:string;monto:number;fecha:string;usuario:string}[]=cerrada?[]:[{id:1,tipo:'EGRESO',concepto:'Compra de bolsas demo',monto:2000,fecha:ahora(),usuario}];
 function calcular(detalles:Linea[]=[],dto=false){
  const lineas=detalles.map(l=>{const subtotal=l.cantidad*l.precioUnitario,descuento=dto||l.tipoDescuentoId?Math.round(subtotal*.1):0;return {...l,subtotal,descuento,total:subtotal-descuento,impuesto:0};});
  const subtotal=lineas.reduce((s,l)=>s+l.subtotal,0),descuento=lineas.reduce((s,l)=>s+l.descuento,0);
  return {subtotal,descuento,total:subtotal-descuento,impuestos:0,baseImponible:subtotal-descuento,modoImpuesto:'DESACTIVADO',detalles:lineas};
 }
 function venta(id:number,detalles:Linea[],pagos:Pago[],clienteId:number,dto=false){
  const r=calcular(detalles,dto);
  return {...r,id,numero:`DEMO-${String(id).padStart(4,'0')}`,cliente:clientes.find(c=>c.id===clienteId)?.nombre??'Consumidor final',
   estado:'COMPLETADA',tipoVenta:'CONTADO',facturar:false,numeroFactura:null,fecha:ahora(),cambio:Math.max(0,pagos.reduce((s,p)=>s+p.monto,0)-r.total),pagos,
   detalles:r.detalles.map(l=>({...l,producto:productos.find(p=>p.id===l.productoId)?.nombre??'Producto demo',subtotalLinea:l.total,descuentoLinea:l.descuento,esCombo:false}))};
 }
 let ventas=[venta(1,[{productoId:1,cantidad:2,precioUnitario:5000}],[{metodoPago:'EFECTIVO',monto:10000}],1)];
 const saldo=()=> (caja?.montoApertura??0)+movimientos.reduce((s,m)=>s+(m.tipo==='INGRESO'?m.monto:-m.monto),0);
 return async config=>{
  const path=config.url??'',metodo=config.method??'get';
  const body=typeof config.data==='string'?JSON.parse(config.data||'{}'):config.data??{};
  const ok=(data:unknown,status=200)=>({data:structuredClone(data),status,statusText:'Demo',headers:{},config});
  const fallo=(mensaje:string,status=400):never=>{throw new AxiosError(mensaje,'DEMO',config,undefined,ok({mensaje},status));};
  if(metodo==='get'){
   switch(path){
    case '/sicom/me':return ok({facturador:false,acciones:[],fidelizacion_activa:false});
    case '/empresa':return ok({id:1,nombre:'Empresa de práctica',nombreComercial:'SICOM DEMO',confirmarAntesDeVenta:false});
    case '/sucursales':return ok([{id:1,nombre:sede,estado:true},{id:2,nombre:'Sucursal norte demo',estado:true}]);
    case '/productos':return ok(productos);
    case '/categorias':case '/marcas':return ok([]);
    case '/proveedores':return ok(proveedores);
    case '/ordenes-compra':return ok(ordenes);
    case '/clientes':return ok(clientes);
    case '/tipos-descuento':return ok([{id:1,nombre:'Descuento demo 10 %',tipo:'PORCENTAJE',valor:10,aplicaA:'AMBOS',estado:true,vigente:true}]);
    case '/combos':case '/ventas/reservas':case '/documentos-caja':return ok([]);
    case '/ventas':return ok(ventas);
    case '/ventas/paginado':{
     const f=config.params??{}, q=String(f.texto??'').toLowerCase();
     const items=ventas.filter(v=>(!q||`${v.numero} ${v.cliente}`.toLowerCase().includes(q))&&(!f.clienteId||v.cliente===clientes.find(c=>c.id===Number(f.clienteId))?.nombre)&&(!f.desde||v.fecha.slice(0,10)>=f.desde)&&(!f.hasta||v.fecha.slice(0,10)<=f.hasta));
     return ok({contenido:items,pagina:0,tamanoPagina:20,totalElementos:items.length,totalPaginas:1});
    }
    case '/caja/abierta':return caja?ok({...caja,sucursal:sede,usuario,estado:'ABIERTA'}):ok(null,204);
   }
   if(/^\/productos\/\d+\/ficha$/.test(path)){
    const id=Number(path.split('/')[2]),i=productos.findIndex(p=>p.id===id);
    if(i<0)return fallo('El producto demo no existe.',404);
    return ok({general:productos[i],inventario:[{sucursal_id:1,sucursal:sede,existencias:stock[i]??0}],movimientos:[]});
   }
   if(/^\/inventario\/stock\/sucursal\/\d+$/.test(path))return ok(productos.map((p,i)=>({productoId:p.id,stockActual:stock[i]??0,stockBajo:(stock[i]??0)<5,productoNombre:p.nombre,sucursalId:1,sucursalNombre:sede,stockMinimo:5})));
   if(/^\/caja\/\d+\/movimientos$/.test(path))return ok(movimientos);
   if(/^\/caja\/\d+\/resumen-cierre$/.test(path))return ok({...caja,sesionId:caja?.id,sucursal:sede,usuario,estado:'ABIERTA',montoCierreSistema:saldo(),ventasTotal:0,numeroVentas:0,ventasEfectivo:0,ventasTarjeta:0,ventasTransferencia:0,ventasCredito:0,ventasOtros:0,ingresosManuales:movimientos.filter(m=>m.tipo==='INGRESO').reduce((s,m)=>s+m.monto,0),egresosManuales:movimientos.filter(m=>m.tipo==='EGRESO').reduce((s,m)=>s+m.monto,0),movimientos,resumenCompleto:true});
   if(/^\/cuentas-por-cobrar\/cliente\/\d+$/.test(path))return ok([]);
  }
  if((metodo==='post'&&path==='/productos')||(metodo==='put'&&/^\/productos\/\d+$/.test(path))){
   const i=productos.findIndex(p=>p.id===Number(path.split('/').at(-1)));
   if(!String(body.nombre??'').trim()||!(Number(body.precioVenta)>0))return fallo('Completa el nombre y un precio válido.');
   if(productos.some((p,j)=>i!==j&&p.codigoInterno===body.codigoInterno))return fallo('El código interno ya existe.');
   if(metodo==='put'&&i<0)return fallo('Producto demo no encontrado.',404);
   const item={...(productos[i]??productos[0]),...body,id:i<0?Math.max(...productos.map(p=>p.id))+1:productos[i].id};
   if(i<0){productos.push(item);stock.push(0);}else productos[i]=item;
   evento(i<0?'producto':'editarProducto');return ok(item);
  }
  if(metodo==='post'&&path==='/proveedores'){
   if(!String(body.nombre??'').trim())return fallo('Completa el nombre del proveedor.');
   if(body.nit&&proveedores.some(p=>p.nit===body.nit))return fallo('Ese NIT ya está registrado.');
   const nuevo={...body,id:proveedores.length+1,estado:true,diasCredito:body.diasCredito??0};proveedores.push(nuevo);evento('proveedor');return ok(nuevo,201);
  }
  if(metodo==='post'&&path==='/ordenes-compra'){
   const proveedor=proveedores.find(p=>p.id===Number(body.proveedorId));
   if(!proveedor||!Array.isArray(body.detalles)||!body.detalles.length||body.detalles.some((l: {cantidadPedida:number;productoId:number})=>!(l.cantidadPedida>0)||!productos.some(p=>p.id===l.productoId)))return fallo('Selecciona un proveedor y al menos un producto con cantidad válida.');
   const id=ordenes.length+1,nueva={...body,id,numero:'OC-DEMO-'+String(id).padStart(3,'0'),facturas:'',proveedor:proveedor.nombre,sucursal:sede,estado:'BORRADOR',fecha:ahora(),detalles:body.detalles.map((l:{productoId:number})=>({...l,producto:productos.find(p=>p.id===l.productoId)?.nombre,cantidadRecibida:0,cantidadFacturada:0}))};
   ordenes=[nueva,...ordenes];evento('orden');return ok(nueva,201);
  }
  if(metodo==='post'&&path==='/ventas/calcular')return ok(calcular(body.detalles,!!body.tipoDescuentoFacturaId));
  if(metodo==='post'&&path==='/ventas'){
   if(!caja||!Array.isArray(body.detalles)||!body.detalles.length)return fallo('Abre caja y agrega un producto.');
   const cantidades=productos.map(()=>0);
   for(const l of body.detalles as Linea[]){if(!productos.some(p=>p.id===l.productoId)||!Number.isInteger(l.cantidad)||l.cantidad<1)return fallo('Revisa el producto y la cantidad.');cantidades[productos.findIndex(p=>p.id===l.productoId)]+=l.cantidad;}
   if(cantidades.some((n,i)=>n>stock[i]))return fallo('No hay suficientes existencias de práctica.');
   const pagos:Pago[]=body.pagos??[];
   const v=venta(ventas.length+1,body.detalles,pagos,body.clienteId,!!body.tipoDescuentoFacturaId);
   if(pagos.reduce((s,p)=>s+p.monto,0)<v.total)return fallo('Completa el pago.');
   stock=stock.map((s,i)=>s-cantidades[i]);ventas=[v,...ventas];const efectivo=pagos.filter(p=>p.metodoPago==='EFECTIVO').reduce((s,p)=>s+p.monto,0)-v.cambio;
   if(efectivo>0)movimientos.push({id:movimientos.length+1,tipo:'INGRESO',concepto:v.numero,monto:efectivo,fecha:ahora(),usuario});
   evento('venta');return ok(v,201);
  }
  if((metodo==='post'&&path==='/clientes')||(metodo==='put'&&/^\/clientes\/\d+$/.test(path))){
   const id=metodo==='put'?Number(path.split('/').at(-1)):secuencia+1;
   if(!String(body.nombre??'').trim())return fallo('Indica el nombre.');
   if(body.documento&&clientes.some(c=>c.id!==id&&c.documento===body.documento))return fallo('Ese documento ya existe. Busca al cliente y edita su ficha.',409);
   const c={...(clientes.find(c=>c.id===id)??clienteBase),...body,id};if(metodo==='post')secuencia=id;
   clientes=[...clientes.filter(x=>x.id!==id),c];evento(metodo==='post'?'cliente':'editar');return ok(c);
  }
  if(metodo==='post'&&path==='/caja/abrir'){
   if(caja)return fallo('La caja ya está abierta.');
   caja={id:1,montoApertura:Number(body.montoApertura)||0,fechaApertura:ahora()};movimientos=[];evento('abrir');return ok({...caja,sucursal:sede,usuario,estado:'ABIERTA'});
  }
  if(metodo==='post'&&/^\/caja\/\d+\/movimientos$/.test(path)){
   if(!caja||!['INGRESO','EGRESO'].includes(body.tipo)||!(Number(body.monto)>0))return fallo('Indica un importe válido.');
   const m={id:movimientos.length+1,tipo:body.tipo,concepto:body.concepto,monto:Number(body.monto),fecha:ahora(),usuario};movimientos.push(m);evento(body.tipo);return ok(m);
  }
  if(metodo==='post'&&/^\/caja\/\d+\/cerrar$/.test(path)){
   if(!caja)return fallo('La caja ya está cerrada.');
   const montoCierreSistema=saldo(),montoCierreReal=Number(body.montoCierreReal),diferencia=montoCierreReal-montoCierreSistema;
   if(diferencia&&!String(body.observaciones??'').trim())return fallo('Explica la diferencia antes de cerrar.');
   const cierre={...caja,sucursal:sede,usuario,montoCierreSistema,montoCierreReal,diferencia,estado:'CERRADA',fechaCierre:ahora()};caja=null;evento('cerrar');return ok(cierre);
  }
  return fallo('Esta acción no está disponible en la práctica. No se envió ninguna operación.',403);
 };
}
