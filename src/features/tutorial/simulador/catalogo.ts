export type Fila={id:number;nombre:string;detalle:string;estado:string};
export type Operacion='crear'|'buscar'|'consultar'|'editar'|'cambiar';
export type ModuloDemo={id:string;nombre:string;entidad:string;campo:string;ejemplo:string;detalle:string;estado:string;cambio:string;acciones:[string,string,string,string,string]};
const m=(id:string,nombre:string,entidad:string,campo:string,ejemplo:string,detalle:string,estado:string,cambio:string,acciones:ModuloDemo['acciones']):ModuloDemo=>({id,nombre,entidad,campo,ejemplo,detalle,estado,cambio,acciones});
export const modulos=[
 m('pos','Ventas, clientes y caja','Venta','Producto','Café demo','2500','Abierta','Pagada',['Nueva venta','Buscar producto','Agregar al carrito','Cambiar cantidad','Finalizar venta']),
 m('clientes','Clientes','Cliente','Documento','Lucía Demo','DEMO-101','Activo','Inactivo',['Nuevo cliente','Buscar cliente','Ver ficha','Editar cliente','Cambiar estado']),
 m('caja','Caja','Turno','Efectivo','Caja principal demo','50000','Abierta','Cerrada',['Abrir caja','Buscar turno','Ver saldo','Registrar movimiento','Cerrar caja']),
 m('inventario','Inventario','Existencia','Unidades','Café demo','12','Disponible','En revisión',['Registrar existencia','Buscar existencia','Consultar existencias','Ajustar unidades','Marcar para revisión']),
 m('productos','Productos','Producto','Precio','Pan demo','3500','Activo','Inactivo',['Nuevo producto','Buscar producto','Ver ficha','Editar producto','Cambiar estado']),
 m('compras','Compras','Orden','Unidades pedidas','Orden a Proveedor Demo','10','Pendiente','Recibida',['Registrar orden','Buscar orden','Ver detalle','Editar cantidades','Recibir compra']),
 m('proveedores','Proveedores','Proveedor','Identificación','Distribuidora Demo','DEMO-205','Activo','Inactivo',['Nuevo proveedor','Buscar proveedor','Ver ficha','Editar proveedor','Cambiar estado']),
 m('servicios','Servicios','Cita','Fecha y hora','Cita de Ana Demo','2030-06-12T10:00','Agendada','Completada',['Agendar cita','Buscar cita','Consultar estado','Reprogramar cita','Completar cita']),
 m('facturacion','Facturación','Factura demo','Importe','Factura de Ana Demo','15000','Borrador','Emitida en simulación',['Crear borrador','Buscar factura','Vista previa','Editar importe','Emitir factura demo']),
 m('reportes','Reportes','Consulta','Valor de referencia','Ventas demo de junio','40000','Pendiente','Consultada',['Preparar consulta','Filtrar consultas','Ver gráfico','Cambiar referencia','Consultar resultado']),
 m('usuarios','Usuarios y permisos','Usuario','Rol','Daniel Demo','Vendedor','Activo','Suspendido',['Nuevo usuario','Buscar usuario','Consultar permisos','Cambiar rol','Suspender usuario']),
 m('restaurante','Restaurante','Comanda','Plato','Mesa demo 3','Hamburguesa demo','Abierta','En cocina',['Abrir comanda','Buscar mesa','Ver comanda','Cambiar plato','Enviar a cocina']),
 m('prestamos','Préstamos','Solicitud','Importe','Crédito de Ana Demo','100000','Borrador','Aprobada en simulación',['Nueva solicitud','Buscar solicitud','Ver detalle','Ajustar importe','Aprobar simulación']),
 m('contabilidad','Contabilidad','Asiento','Importe','Asiento demo de caja','20000','Borrador','Contabilizado en simulación',['Nuevo asiento','Buscar asiento','Ver asiento','Editar importe','Contabilizar demo']),
 m('gastos','Gastos','Gasto','Importe','Transporte demo','12000','Pendiente','Registrado',['Nuevo gasto','Buscar gasto','Ver soporte demo','Editar importe','Registrar gasto demo']),
 m('descuentos','Descuentos','Promoción','Porcentaje','Oferta demo','10','Borrador','Activa',['Nueva promoción','Buscar promoción','Ver promoción','Editar porcentaje','Activar promoción']),
 m('domicilios','Domicilios','Pedido','Dirección ficticia','Pedido de Ana Demo','Calle Demo 10','Preparando','En camino',['Nuevo pedido','Buscar pedido','Consultar pedido','Cambiar dirección','Despachar pedido']),
 m('nomina','Nómina','Liquidación','Importe','Liquidación de Daniel Demo','1000000','Borrador','Revisada',['Nueva liquidación','Buscar liquidación','Ver detalle','Editar importe','Marcar revisada']),
 m('documentos','Documentos','Comprobante','Referencia','Recibo demo','DEMO-01','Borrador','Revisado',['Nuevo comprobante demo','Buscar comprobante','Ver comprobante','Editar referencia','Marcar revisado']),
 m('alertas','Alertas','Alerta','Referencia','Alerta demo de stock','Café demo','Pendiente','Atendida',['Crear alerta demo','Buscar alerta','Ver detalle','Editar referencia','Marcar atendida']),
 m('ordenes','Órdenes de servicio','Orden','Descripción','Reparación demo','Revisión inicial','Pendiente','Completada',['Crear orden demo','Buscar orden','Consultar orden','Editar descripción','Completar orden']),
 m('dashboard','Dashboard','Indicador','Valor de referencia','Ventas demo','40000','Pendiente','Consultado',['Preparar indicador','Buscar indicador','Ver detalle','Cambiar referencia','Marcar consultado']),
 m('configuracion','Configuración','Preferencia','Valor','Impresión demo','Tiquete 80 mm','Borrador','Aplicada en simulación',['Nueva preferencia demo','Buscar preferencia','Ver valor','Editar valor','Aplicar en simulación']),
 m('plataforma','Plataforma','Empresa demo','Plan','Comercio Demo','Básico','Activa','Suspendida en simulación',['Nueva empresa demo','Buscar empresa','Consultar ficha','Editar plan demo','Cambiar estado demo']),

];
export type Paso={id:string;instruccion:string};
export type Ejercicio={id:string;nombre:string;nivel:string;pasos:Paso[]};
const paso=(id:string,instruccion:string):Paso=>({id,instruccion});
export function ejercicios(m:ModuloDemo):Ejercicio[]{
 if(m.id==='pos'){
  const inicio=[paso('abrir','Abre la caja de demostración.'),paso('buscar','Escribe Café o Pan para buscar.'),paso('agregar','Agrega un producto al carrito.')];
  const fin=[paso('pago','Elige un medio de pago.'),paso('finalizar','Finaliza y revisa el recibo demo.')];
  return [
   {id:'simple',nombre:'Venta de un producto',nivel:'Básico',pasos:[...inicio,...fin]},
   {id:'varios',nombre:'Venta con varios productos',nivel:'Intermedio',pasos:[...inicio,paso('agregarOtro','Agrega un producto distinto.'),paso('cantidad','Aumenta la cantidad de una línea.'),...fin]},
   {id:'cliente',nombre:'Venta con cliente',nivel:'Intermedio',pasos:[...inicio,paso('cliente','Selecciona un cliente ficticio.'),...fin]},
   {id:'mixto',nombre:'Pago con dos medios',nivel:'Avanzado',pasos:[...inicio,paso('pagoMixto','Selecciona Pago mixto.'),paso('abono','Indica cuánto recibes en efectivo.'),paso('finalizar','Finaliza y revisa el reparto del pago.')]},
   {id:'descuento',nombre:'Venta con descuento',nivel:'Avanzado',pasos:[...inicio,paso('cantidad','Cambia una cantidad.'),paso('eliminar','Retira la línea para corregir el carrito.'),paso('agregar','Agrega de nuevo un producto.'),paso('descuento','Aplica un descuento y mira el total.'),...fin]},
  ];
 }
 const crear=[paso('crear',m.acciones[0]+'.'),paso('guardar','Completa los campos y guarda el ejemplo.')];
 const consultar=[paso('buscar',m.acciones[1]+': escribe parte del nombre.'),paso('consultar',m.acciones[2]+'.')];
 const editar=[paso('editar',m.acciones[3]+'.'),paso('guardar','Cambia el valor y guarda.'),paso('cambiar',m.acciones[4]+'.')];
 return [{id:'registro',nombre:'Primer registro',nivel:'Básico',pasos:crear},{id:'consulta',nombre:'Buscar y consultar',nivel:'Intermedio',pasos:consultar},{id:'operacion',nombre:'Editar y completar',nivel:'Avanzado',pasos:[...consultar,...editar]}];
}
