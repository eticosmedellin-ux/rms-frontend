# SICOM — Compras e inventario, parte 1 de 2

Entrega: compras-inventario-1. Base: Tutorial/Configuración 6 y optimización de consultas 1, con todas las entregas anteriores. Esta entrega conserva la base optimizada. El SQL incluye también sus índices de rendimiento, así que no necesitas descargar otro SQL para esos índices.

## Instalación en producción

Descarga los dos ZIP, el SQL y ambos PS1 en **Descargas**. No pegues el contenido de los PS1 por líneas: ejecútalos como archivos completos. Los scripts se detienen ante errores, comprueban los archivos y encuentran/descomprimen automáticamente el ZIP correspondiente.

1. En pgAdmin abre **neondb** y ejecuta **todo** `migracion-sicom-compras-inventario-1.sql`. Debe terminar con COMMIT. Requiere que ya esté aplicada la entrega Tutorial/Configuración 6. No altera impuestos ni importes de ventas históricas. Añade campos, tareas, permiso e índices y amplía la precisión de costos unitarios hasta seis decimales. Las cantidades siguen admitiendo dos decimales; los totales monetarios se redondean a dos.

Hazlo en horario de poca actividad: ALTER TABLE y la construcción de índices bloquean escrituras mientras se ejecutan. El SQL espera como máximo 5 segundos por un bloqueo y 10 minutos por una sentencia; ante un error revierte su transacción. Si pgAdmin queda en una transacción fallida, ejecuta ROLLBACK y vuelve a ejecutar el archivo completo cuando puedas obtener el bloqueo. La migración se puede repetir; no recrea tareas ni modifica clasificaciones históricas.

2. Publica el backend:

```powershell
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\PUBLICAR_BACKEND_COMPRAS_INVENTARIO_1.ps1"
```

Espera a que el servicio backend en Render esté **Live**. El script utiliza `C:PROYECTOS	iendapos_1`, actualiza main, copia el código, crea el commit si hay diferencias y hace push. Conserva variables y claves locales. Si detecta cambios locales registrados, se detiene para que puedas conservarlos.

3. Publica el frontend:

```powershell
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\PUBLICAR_FRONTEND_COMPRAS_INVENTARIO_1.ps1"
```

Utiliza `C:PROYECTOS	iendapos_frontem`, ejecuta npm ci y npm run build antes de hacer commit/push. Espera **Live** en Render y vuelve a abrir SICOM.

La carpeta de extracción automática es `C:PROYECTOSACTUALIZACION_SICOM_CI1`. También puedes ejecutar el PS1 que viene dentro de cada ZIP después de descomprimirlo; encontrará su propia carpeta. Si Windows agrega `(1)` al nombre del PS1 descargado, renómbralo al nombre del comando o ejecútalo con su nombre real. No se requiere declarar $Fuente ni pegar param(...) en la consola.

## Qué incluye esta parte

Cubre los requerimientos **1, 3–22 y 28–30** de la lista de 35. La segunda parte corresponde a eliminación de empresas, soportes POS, turnos de restaurante, citas y mejoras de préstamos (2, 23–27, 31–35).

### Compras

- Nueva pestaña **Importar XML**: uno o varios archivos, vista previa, coincidencias por códigos del catálogo y proveedor/NIT, asociación manual cuando falta coincidencia y acceso al formulario completo para crear el producto. Hasta 50 archivos por lote, 5 MB por archivo y 500 líneas por factura. Cada archivo muestra su resultado: los que fallan no se consideran registrados y los exitosos no se vuelven a enviar desde esa pantalla.
- Al confirmar se crea una factura real mediante el flujo de compras existente, con cuenta por pagar, contabilidad cuando está habilitada y pago si eliges contado. Por defecto es crédito y **no recibe mercancía**. Si marcas que la mercancía ya llegó, se registra una recepción real por sucursal, Kardex y lotes cuando correspondan. Un archivo fallido revierte su factura, pago y recepción; los otros archivos del lote conservan su propio resultado.
- Admite UBL **Invoice** o **AttachedDocument** con Invoice incluida en Description, en COP y con el NIT comprador correspondiente a la empresa de la sesión. Normaliza NIT con guiones/DV. Bloquea DTD y entidades externas. Leer el XML no valida la firma, CUFE ni aceptación ante la DIAN. Documentos con descuentos globales, retenciones, anticipos o totales que no concilian se rechazan con mensaje y deben registrarse manualmente conservando su desglose. No importa notas crédito/débito ni formatos XML privados. Los descuentos de línea ya contenidos en LineExtensionAmount forman parte del costo neto leído.
- Nueva orden: búsqueda por nombre completo o parcial, código, barras, categoría, marca y descripción; filtro por categoría. No limita las coincidencias a los nombres que comienzan con la palabra.
- Precarga el último costo del producto y permite editarlo. Cantidad × costo calcula total; editar el total recalcula el costo.
- Stock de la sucursal de destino antes de cantidad, de solo lectura. Destino, impuesto, presentación y ubicación por **cada línea**, incluso cuando el mismo producto va a varias sucursales.
- Margen estimado = (precio de catálogo − costo unitario base) / precio de catálogo × 100. No es el beneficio contable final: no incorpora descuentos, gastos ni el efecto de la modalidad de impuestos del precio de venta. Se identifica como estimado.
- El impuesto de la línea es una fotografía para la compra; no cambia retroactivamente ventas ni el tratamiento del catálogo. Las reglas masivas por categoría y excepciones siguen en Configuración; el formulario completo de producto conserva sus campos tributarios.
- Nuevo producto desde Nueva orden abre **el mismo formulario de Inventario**, con categoría, marca, códigos, precio, impuestos, servicio/inventario, ubicación y presentaciones. Selecciona inmediatamente el producto creado.
- Órdenes: fecha junto al número, destinos visibles y buscador por número de orden, factura asociada o proveedor. Facturas por proveedor desde la más nueva a la más antigua, con búsqueda por factura, fecha o estado. Proveedores tienen búsqueda por nombre, NIT, teléfono o contacto.

### Recepción y conversión

En el catálogo configura una presentación, por ejemplo **Caja → 10 unidades base**. Si compras una caja por $1.000, la orden guarda 10 unidades a $100 por unidad. Guarda la conversión de la compra: cambiar la presentación del catálogo después no modifica esa orden. La recepción muestra el destino y trabaja **en unidades base**, sin volver a multiplicar las cajas.

Los campos de recepción empiezan en cero para que escribas lo que realmente llegó. **Aceptadas + rechazadas = entregadas ahora**. Solo las aceptadas aumentan inventario; los rechazos requieren motivo y aparecen en la ficha del producto. Aceptadas más rechazadas no pueden superar lo pendiente en esa entrega. Las rechazadas **siguen pendientes de reposición** en la orden: no se convierten en stock ni en mercancía recibida/facturable. La factura de una orden agrupa el mismo producto entre destinos y evita duplicar la cantidad facturada.

### Inventario

- Búsqueda por nombre, código interno, barras, categoría, marca, descripción o ubicación, y filtro por categoría.
- Margen estimado sobre precio de catálogo visible junto al precio de venta.
- Pulsa el nombre de un producto para abrir **Ficha**: general, ventas, compras/rechazos, inventario/movimientos y contabilidad. Las secciones comerciales/contables respetan el acceso por módulo. Cada historial muestra los últimos 100 registros; para períodos completos utiliza Reportes. Contabilidad muestra los asientos asociados a ventas/compras del producto, no inventa asientos nuevos ni reparte un asiento general por producto.
- Puedes editar la información desde la ficha. La ubicación general es un valor inicial; las ubicaciones específicas por sucursal se editan y guardan en Inventario dentro de la ficha. Las recepciones guardan la ubicación indicada en la línea de compra para su destino.
- Presentaciones de compra configurables en el mismo formulario de creación/edición. Cantidades y costos de inventario se conservan en unidad base.
- Transferencia: mensaje y bloqueo al crear cuando el origen no tiene unidades suficientes. El backend suma líneas repetidas, descuenta reservas y, para productos con lotes, excluye cuarentena/vencidos. Al enviar valida otra vez el stock actual, incluso si la empresa permite stock negativo para otras operaciones. Crear una transferencia no reserva ni mueve stock; Enviar y Recibir mantienen sus dos pasos.
- Buscador de selección compartido en productos de órdenes, facturas, ajustes y transferencias; sucursales/proveedores en orden y selección múltiple en conteos. Clasifica coincidencia exacta, inicio y contenido del nombre; permite marcar coincidencias y conserva los seleccionados al cambiar la búsqueda. Se mantiene el buscador general previo con permisos.

### Conteos asignados

El administrador entra a **Inventario → Conteos físicos → Programar conteo**. La empresa de la sesión se mantiene visible; elige sucursal, usuario responsable activo y asignado a esa sucursal, fecha y productos, o todo el inventario activo con control de existencias. Una empresa no puede programar tareas de otra.

En Roles y permisos, asigna al empleado **Realizar únicamente los conteos asignados al usuario** (`INVENTARIO_CONTEOS_REALIZAR`). Después vuelve a entrar con ese perfil para cargar sus permisos actuales. El permiso no concede edición de productos, transferencias ni acceso general a Inventario.

El empleado ve **Conteos de inventario asignados** al iniciar su sesión. Abre la tarea en la fecha prevista o después; no puede iniciarla antes ni abrir tareas ajenas. El stock de comparación se toma al **iniciar**, no al programar. Debe escribir todas las cantidades físicas, incluyendo cero cuando no hay unidades. Confirmar registra las diferencias mediante el flujo de ajustes/Kardex existente y cierra la tarea. Reabrir una tarea en proceso no crea otro conteo. También queda cerrada si el administrador la cierra desde el listado de conteos.

### Menú

El botón de menú muestra/oculta la barra lateral en PC y tablet, y conserva el panel móvil. No se rediseñan el sistema ni los módulos existentes.

## Verificación y prueba después del despliegue

Verificados localmente: **208 pruebas de backend**, migración aplicada y repetida en PostgreSQL PGlite 18.3, TypeScript/Vite y pruebas JSDOM con API simulada para los formularios, costos, coincidencias, recepción, XML y tarea asignada. Detalles en VALIDACION_COMPRAS_INVENTARIO_1.json.

Pendiente de comprobar en tu entorno: ejecución PS1 en Windows, SQL en Neon, despliegues en Render, representación visual en tus dispositivos y pruebas con tus XML reales. No se ha conectado ni modificado tu producción desde esta entrega.

Prueba con una operación controlada: producto en cajas de 10, destinos de dos sucursales, recepción con unidades aceptadas/rechazadas y ficha/stock. Importa un XML revisando crédito/contado y si realmente llegó la mercancía. Programa un conteo para un empleado con el permiso específico y entra a su perfil. Confirma que no vea tareas ajenas y prueba una transferencia insuficiente antes de continuar tus operaciones normales.

Referencia de formato: [UBL 2.1 de OASIS](https://www.oasis-open.org/standard/ublv2-1/).
