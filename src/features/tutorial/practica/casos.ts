import {ampliacion,type Accion} from './ampliacion';
export type PasoReal=[texto:string,control:string];
export type CasoReal={id:string;grupo:string;titulo:string;tab?:string;pantalla?:'inventario'|'compras';pasos?:PasoReal[];cajaCerrada?:boolean;meta?:string;acciones?:Accion[]};
const p=(texto:string,control:string):PasoReal=>[texto,control];
const buscar=p('Escribe Café o el código DEMO-001 en el buscador.','Escanea o escribe');
const agregar=p('Selecciona Café demo en los resultados.','Café demo');
const cobrar=p('Completa el importe con «todo» y registra la venta demo.','Completar con el restante');
const movimientos=p('Abre Movimientos desde la barra de caja.','Movimientos');
const editar=p('Ubica a Ana Demo y pulsa el lápiz en su fila.','Editar cliente');
const grupos:Record<string,string[]>={
 Ventas:['No sé cómo realizar una venta','No encuentro un producto para agregarlo a la venta','Agregué un producto equivocado al carrito','Coloqué una cantidad incorrecta','No sé cómo eliminar un producto de la venta','No sé cómo aplicar un descuento','Seleccioné el cliente equivocado','No sé cómo cambiar el método de pago','No sé cómo realizar una venta con varios métodos de pago','No encuentro una venta que realicé anteriormente'],
 Clientes:['No sé cómo registrar un cliente nuevo','No encuentro un cliente registrado','Registré mal el teléfono o documento de un cliente','Registré dos veces al mismo cliente','No sé cómo consultar el historial de compras de un cliente','No sé cómo consultar cuánto debe un cliente','No sé cómo actualizar los datos de un cliente'],
 Caja:['No sé cómo abrir la caja','No sé cómo realizar un ingreso de dinero','No sé cómo registrar un gasto de caja','No sé cómo consultar los movimientos de caja','No sé cómo realizar el cierre de caja','No me coincide el dinero contado con el valor que muestra el sistema','No sé cómo consultar el cierre de un turno anterior'],
 'Inventario y productos':['Registrar un producto nuevo','Encontrar un producto en el inventario','Modificar el precio de un producto','Modificar el costo de compra','Consultar existencias','Consultar productos con pocas existencias','El inventario físico no coincide con el sistema','Registrar entrada de mercancía','Registrar salida de mercancía','Trasladar productos entre sucursales','Buscar por código de barras'],
 Compras:['Registrar una compra','No encuentro un proveedor para asociarlo a una compra','Seleccioné un proveedor equivocado','Agregué un producto incorrecto','Registré una cantidad equivocada','Registrar una compra pendiente de pago','Registrar un abono a un proveedor','Consultar compras anteriores','Buscar una compra por número de factura'],
 Proveedores:['Registrar un proveedor nuevo','Encontrar un proveedor registrado','Modificar los datos de un proveedor','Consultar cuánto le debo a un proveedor','Consultar el historial de compras de un proveedor'],
 Facturación:['Generar una factura','Descargar o imprimir una factura','Enviar una factura al cliente','Consultar una factura anterior','Generar una nota crédito','Consultar el estado de una factura electrónica','Corregir datos antes de emitir una factura'],
 Reportes:['Consultar las ventas del día','Consultar las ventas de un periodo','Filtrar un reporte por fechas','Consultar los productos más vendidos','Consultar las ganancias de un periodo','Exportar o descargar un reporte'],
 'Usuarios y configuración':['Crear un usuario nuevo','Cambiar la contraseña','Asignar permisos a un empleado','Un empleado no puede acceder a un módulo','Cambiar la sucursal de trabajo','Configurar los datos de la empresa'],
};
const casos:Record<string,Partial<CasoReal>>={
 '0-0':{tab:'vender',meta:'venta',pasos:[buscar,agregar,cobrar,p('Pulsa el botón que registra la venta. El número comenzará por DEMO.','Registrar venta')]},
 '0-1':{tab:'vender',pasos:[buscar,agregar]},
 '0-2':{tab:'vender',pasos:[agregar,p('Retira el producto equivocado con la papelera.','Retirar Café demo'),p('Selecciona Pan demo para reemplazarlo.','Pan demo')]},
 '0-3':{tab:'vender',pasos:[agregar,p('Cambia la cantidad a 2 y comprueba cómo se recalcula el total.','Cantidad de Café demo')]},
 '0-4':{tab:'vender',pasos:[agregar,p('Pulsa la papelera y verifica que la línea desaparezca.','Retirar Café demo')]},
 '0-5':{tab:'vender',pasos:[agregar,p('Cambia el modo a descuento por factura.','Por factura'),p('Selecciona Descuento demo 10 % y revisa el total.','Selecciona descuento')]},
 '0-6':{tab:'vender',pasos:[agregar,p('Selecciona a Ana Demo y luego corrige el cliente a Luis Demo.','Consumidor final / sin cliente')]},
 '0-7':{tab:'vender',pasos:[agregar,p('En Pagos, cambia Efectivo por Tarjeta. No necesitas un comprobante real.','Transferencia')]},
 '0-8':{tab:'vender',meta:'venta',pasos:[agregar,p('Pulsa Dividir pago para agregar otra línea.','Dividir pago'),p('Ingresa 2000 en efectivo y completa el restante con Tarjeta.','Monto'),p('Registra la venta demo.','Registrar venta')]},
 '0-9':{tab:'ventas',pasos:[p('En el historial busca el comprobante DEMO-0001.','DEMO-0001')]},
 '1-0':{tab:'clientes',meta:'cliente',pasos:[p('Pulsa Nuevo cliente.','Nuevo cliente'),p('Escribe un nombre y documento ficticios.','Nombre'),p('Pulsa Guardar y busca el registro en la lista.','Guardar')]},
 '1-1':{tab:'clientes',pasos:[p('Ubica a Ana Demo y confirma el documento 10001.','Ana Demo')]},
 '1-2':{tab:'clientes',meta:'editar',pasos:[editar,p('Corrige el teléfono o documento con un valor ficticio.','Teléfono'),p('Guarda la ficha.','Guardar')]},
 '1-3':{tab:'clientes',meta:'editar',pasos:[p('Intenta registrar un cliente con documento 10001. El sistema te indica que ya existe.','Nuevo cliente'),editar,p('Actualiza la ficha existente y guarda. Evita duplicar el registro.','Guardar')]},
 '1-4':{tab:'ventas',pasos:[p('Filtra el historial por Ana Demo para ver su compra.','Cliente')]},
 '1-5':{tab:'clientes',pasos:[p('Revisa el saldo de Ana Demo: $12.000.','12.000')]},
 '1-6':{tab:'clientes',meta:'editar',pasos:[editar,p('Corrige los datos y guarda la ficha.','Guardar')]},
 '2-0':{tab:'vender',meta:'abrir',cajaCerrada:true,pasos:[p('Pulsa Abrir caja.','Abrir caja'),p('Indica el efectivo inicial de ejemplo y confirma.','Monto de apertura')]},
 '2-1':{tab:'vender',meta:'INGRESO',pasos:[movimientos,p('Pulsa Registrar ingreso/egreso manual.','Registrar ingreso/egreso manual'),p('Selecciona Ingreso, escribe un monto y registra.','Ingreso (entra dinero)')]},
 '2-2':{tab:'vender',meta:'EGRESO',pasos:[movimientos,p('Pulsa Registrar ingreso/egreso manual.','Registrar ingreso/egreso manual'),p('Selecciona Egreso, escribe un monto y registra.','Egreso (sale dinero)')]},
 '2-3':{tab:'vender',pasos:[movimientos,p('Revisa tipo, concepto y monto en la lista.','Compra de bolsas demo')]},
 '2-4':{tab:'vender',meta:'cerrar',pasos:[p('Pulsa Cerrar caja.','Cerrar caja'),p('Compara el saldo esperado y el contado antes de confirmar.','Confirmar cierre')]},
 '2-5':{tab:'vender',meta:'cerrar',pasos:[p('Pulsa Cerrar caja.','Cerrar caja'),p('Escribe un efectivo contado distinto al esperado para ver el aviso.','Observaciones'),p('Vuelve a contar o explica la diferencia antes de confirmar.','Confirmar cierre')]},
 '3-0':{pantalla:'inventario',meta:'producto',pasos:[p('Abre Nuevo producto.','Nuevo producto'),p('Completa el código, el nombre y el precio con valores ficticios.','Código interno'),p('Guarda y localiza el producto en la lista.','Guardar')]},
 '3-1':{pantalla:'inventario',pasos:[p('Busca Café demo por nombre.','Buscar producto'),p('Abre su ficha en la fila del producto.','Café demo')]},
 '3-2':{pantalla:'inventario',meta:'editarProducto',pasos:[p('Pulsa el lápiz en la fila del producto.','Editar producto'),p('Cambia el precio de venta y guarda.','Precio de venta')]},
 '3-3':{pantalla:'inventario',meta:'editarProducto',pasos:[p('Pulsa el lápiz en la fila del producto.','Editar producto'),p('Cambia el costo de compra y guarda.','Precio de compra')]},
 '3-4':{pantalla:'inventario',pasos:[p('Abre la ficha de Café demo.','Café demo'),p('En la ficha, abre Inventario y revisa las unidades por sucursal.','Inventario')]},
 '3-10':{pantalla:'inventario',pasos:[p('Escribe 770000000001 en el buscador.','Buscar producto'),p('Comprueba que el resultado sea Café demo.','Café demo')]},
 '4-0':{pantalla:'compras',tab:'ordenes',meta:'orden',pasos:[p('Abre Nueva orden.','Nueva orden'),p('Elige un proveedor y un producto; indica la cantidad y el costo.','Proveedor'),p('Guarda la orden. Recibir mercancía es un paso aparte.','Crear orden')]},
 '4-1':{pantalla:'compras',tab:'ordenes',meta:'orden',pasos:[p('Abre Nueva orden.','Nueva orden'),p('Selecciona Distribuidora Demo. Completa una línea de prueba y guarda.','Proveedor')]},
 '4-2':{pantalla:'compras',tab:'ordenes',meta:'orden',pasos:[p('Abre Nueva orden.','Nueva orden'),p('Selecciona un proveedor y cámbialo antes de guardar. Completa una línea.','Proveedor')]},
 '4-8':{pantalla:'compras',tab:'ordenes',pasos:[p('Busca la factura F-DEMO-01 desde la lista de órdenes.','Buscar orden'),p('Comprueba que aparece OC-DEMO-001.','OC-DEMO-001')]},
 '4-7':{pantalla:'compras',tab:'ordenes',pasos:[p('Usa el buscador de órdenes para localizar OC-DEMO-001.','Buscar orden'),p('Identifica el proveedor y el estado.','OC-DEMO-001')]},
 '5-0':{pantalla:'compras',tab:'proveedores',meta:'proveedor',pasos:[p('Abre Nuevo proveedor.','Nuevo proveedor'),p('Completa el nombre y un NIT ficticio.','Nombre'),p('Guarda y comprueba que aparezca en el directorio.','Guardar')]},
 '5-1':{pantalla:'compras',tab:'proveedores',pasos:[p('Busca Distribuidora Demo o el NIT 900000001.','Buscar proveedor'),p('Comprueba los datos en la fila.','Distribuidora Demo')]},
 '3-6':{pantalla:'inventario',tab:'ajustes',meta:'ajuste',pasos:[p('Café demo tiene 20 unidades. El conteo verificado dio 18. Abre un ajuste.','Nuevo ajuste'),p('Selecciona Café demo, registra un ajuste negativo de 2 unidades y escribe el motivo.','Motivo'),p('Registra el ajuste para corregir la diferencia.','Registrar ajuste')]},
 '3-7':{pantalla:'inventario',tab:'ajustes',meta:'ajuste',pasos:[p('Para practicar una entrada por ajuste, abre un ajuste de inventario. Si proviene de una orden, usa su recepción.','Nuevo ajuste'),p('Selecciona Café demo y registra 5 unidades como ajuste positivo. Indica el motivo.','Positivo'),p('Registra y comprueba el movimiento.','Registrar ajuste')]},
 '3-8':{pantalla:'inventario',tab:'ajustes',meta:'ajuste',pasos:[p('Se retiraron 3 unidades de Café demo por daño. Abre un ajuste.','Nuevo ajuste'),p('Selecciona Café demo, ajuste negativo y cantidad 3. Escribe el motivo.','Negativo'),p('Registra el movimiento.','Registrar ajuste')]},
 '4-3':{pantalla:'compras',tab:'ordenes',meta:'orden',pasos:[p('Abre Nueva orden y selecciona sucursal, proveedor y Pan demo.','Nueva orden'),p('Quita Pan demo de la orden.','Quitar'),p('Añade Café demo y guarda el borrador.','Añadir producto')]},
 '4-4':{pantalla:'compras',tab:'ordenes',meta:'orden',pasos:[p('Abre Nueva orden y selecciona sucursal, proveedor y Café demo.','Nueva orden'),p('Corrige la cantidad a 6 antes de crear la orden.','Cantidad pedida'),p('Comprueba el costo total y crea la orden.','Crear orden')]},
 '8-4':{tab:'vender',pasos:[p('Abre el selector Sucursal y elige Sucursal norte demo.','Sucursal norte demo')]},
};
export const biblioteca=Object.entries(grupos).flatMap(([grupo,titulos],g)=>titulos.map((titulo,i):CasoReal=>{
 const id=`${g}-${i}`;const acciones=casos[id]?undefined:ampliacion[id];return {id,grupo,titulo,...casos[id],...(acciones?{acciones,pasos:acciones.map(x=>p(x.campo,x.boton))}:{})};
}));
