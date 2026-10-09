# SICOM: restaurante, partes 2 y 3

Esta entrega se instala sobre el bloque 1. Contiene código nuevo de backend y frontend, una migración nueva y dos scripts de publicación. No ejecutes otra vez el SQL de V3 ni el del bloque 1.

## Qué contiene

Parte 2: cuentas abiertas con consumo acumulado, abonos por importe/persona/producto, varios medios de pago al cierre, reversión autorizada antes del cierre, descuento con límite de aprobación y motivo, cortesía autorizada, propina voluntaria en efectivo separada de la venta, distribución y pago de propinas, y cierre de turno por empleado con resumen descargable.

Parte 3: recetas por porciones y rendimiento, consumo de ingredientes al vender, mermas con motivo y auditoría, disponibilidad según ingredientes y reservas, agotados manuales, menú público por horario, recogida, costo de envío mediante un producto de servicio, pedidos de plataformas a crédito y liquidación de comisión/neto, captura local de pedidos durante una interrupción y reportes de preparación, mesero, horario y margen real.

Incluye controles de apoyo: cancelaciones con autorización y motivo, estados de preparación por estación, reservas y lista de espera con asignación de mesa y apertura de cuenta. El plano visual y los modificadores avanzados no forman parte de esta entrega. Servicios y préstamos siguen siendo entregas posteriores.

## 1. Descargar y descomprimir

Guarda los dos ZIP, el SQL y los dos PS1 en Descargas. En PowerShell ejecuta:

```powershell
New-Item -ItemType Directory -Force -Path 'C:\PROYECTOS\ACTUALIZACION_SICOM_R23' | Out-Null
Expand-Archive -LiteralPath "$env:USERPROFILE\Downloads\tiendapos_1_restaurante_2_3.zip" -DestinationPath 'C:\PROYECTOS\ACTUALIZACION_SICOM_R23' -Force
Expand-Archive -LiteralPath "$env:USERPROFILE\Downloads\tiendapos_frontem_restaurante_2_3.zip" -DestinationPath 'C:\PROYECTOS\ACTUALIZACION_SICOM_R23' -Force
```

Deben existir directamente estas carpetas:

- `C:\PROYECTOS\ACTUALIZACION_SICOM_R23\tiendapos_1`
- `C:\PROYECTOS\ACTUALIZACION_SICOM_R23\tiendapos_frontem`

Los scripts comprueban el marcador de esta entrega y sus archivos. No uses los ZIP antiguos ni copies una carpeta tiendapos_1 dentro del repositorio.

## 2. Aplicar primero el SQL nuevo

Conserva un respaldo reciente de neondb antes de actualizar. En pgAdmin selecciona **neondb** y abre Query Tool. Comprueba:

```sql
SELECT current_database();
SELECT version FROM public.sicom_migraciones
WHERE version = 'bloque-1-impuestos-drogueria-comercio';
```

El primer resultado debe ser neondb; el segundo debe devolver una fila. Abre el archivo descargado **migracion-sicom-restaurante-2-3.sql** y ejecútalo COMPLETO, desde BEGIN hasta COMMIT. No pegues texto del chat con barras invertidas. La migración es repetible y conserva los datos anteriores.

Comprueba que finalizó:

```sql
SELECT version FROM public.sicom_migraciones
WHERE version = 'restaurante-entregas-2-3';
```

Si hay un error, ejecuta ROLLBACK y conserva el mensaje; no publiques el nuevo código hasta que el SQL termine correctamente. El SQL también está dentro del ZIP del backend y ambos archivos son idénticos.

## 3. Publicar backend

Con el repositorio habitual en C:\PROYECTOS\tiendapos_1:

```powershell
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\PUBLICAR_BACKEND_RESTAURANTE_23.ps1"
```

El script actualiza main, copia src y los documentos nuevos, crea el commit si hay cambios y hace push. Si ya está instalado, no trata «sin cambios para commit» como un error. Mantiene las variables locales y no añade las carpetas anidadas antiguas. Si encuentra cambios locales registrados, se detiene para que puedas conservarlos.

Espera a que el servicio backend de Render esté **Live** y revisa que no haya errores de arranque.

## 4. Publicar frontend

Con Node/npm instalado y el repositorio habitual en C:\PROYECTOS\tiendapos_frontem:

```powershell
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\PUBLICAR_FRONTEND_RESTAURANTE_23.ps1"
```

Compila antes de hacer push. Espera a que el servicio frontend esté Live y recarga la aplicación. Si utilizas otras rutas, los scripts aceptan -Repositorio y -Fuente.

## 5. Configuración inicial

En Restaurante → Operación y liquidaciones:

1. Configura el porcentaje de descuento que puede concederse sin aprobación. El valor inicial es 0. Para superar el límite o conceder una cortesía se exige RESTAURANTE_APROBAR y un motivo.
2. Si la contabilidad está activa, selecciona cuentas de pasivo de movimiento para anticipos y propinas. Los abonos no se reconocen dos veces al cerrar la venta.
3. Asigna permisos a los roles que los necesiten: RESTAURANTE_CONFIGURAR, RESTAURANTE_ANULAR, RESTAURANTE_APROBAR, RESTAURANTE_LIQUIDAR y RESTAURANTE_MERMAS. Los roles ordinarios no reciben automáticamente estas facultades.
4. Configura los platos como combos/recetas y registra ingredientes en unidades base. Al ingresar un lote de preparación, la cantidad se divide por sus porciones. Si el resultado requiere más de dos decimales, cambia la unidad de medida para evitar redondeos silenciosos. No se puede modificar la receta mientras tenga pedidos abiertos.
5. Configura estación, agotado y horario de los artículos del menú. El menú público dinámico muestra los artículos configurados y consulta disponibilidad; los PDF o imágenes anteriores siguen siendo archivos estáticos. Los horarios usan America/Bogota.
6. Para plataformas, crea/selecciona el cliente de la plataforma con cupo de crédito y un producto de servicio sin inventario si cobras envío. La liquidación registra el banco y referencia recibidos manualmente.

## Prueba después de instalar

Realiza una venta controlada: cuenta de $20.000, abono de $5.000 y saldo de $15.000. Comprueba venta de $20.000, caja neta de $20.000 e inventario descontado una sola vez. Prueba también la reversión antes de cerrar, una propina aceptada, un plato sin ingredientes y una recogida. Verifica permisos con un usuario ordinario.

Para plataforma, comprueba bruto, comisión y neto, cuenta por cobrar y asiento de liquidación. Revisa el cierre de turno del empleado y el arqueo habitual de caja.

## Límites operativos de esta entrega

- La división por persona registra a quién corresponde el abono y ofrece un reparto igual como ayuda; no crea facturas independientes por comensal. Por producto calcula el importe de los artículos pagados y evita pagar dos veces la misma cantidad.
- La reversión de abonos exige autorización y motivo, y solo opera antes del cierre de la cuenta. Después del cierre se utiliza el flujo de devoluciones existente.
- La propina es voluntaria y se recibe/paga en efectivo. Se registra separada de la venta. No repitas una asignación de propina sin revisar el saldo si se interrumpe la respuesta; el pago de una asignación ya pagada no vuelve a generar salida.
- El cierre por empleado conserva un resumen del turno y no cierra la caja compartida ni sustituye su arqueo físico.
- El modo de interrupción permite capturar artículos de una cuenta previamente cargada en ese navegador y sincronizarlos manualmente al volver la conexión. Usa claves para evitar duplicados al reintentar. No permite cobrar sin conexión ni iniciar desde cero tras una recarga desconectada. Antes de cerrar, sincroniza los artículos pendientes. No borres los datos del navegador mientras existan pendientes.
- Plataformas: conciliación manual por pedido, venta a crédito y recepción del neto exacto. No hay conexión automática con una plataforma o banco. Las diferencias deben resolverse antes de liquidar; no se admite volver a liquidar el mismo pedido.
- Las reservas usan intervalos de 90 minutos. La confirmación futura no bloquea físicamente la mesa durante todo el día.
- El margen real guarda el costo de los ingredientes de las nuevas ventas de restaurante. No reconstruye costos históricos anteriores a esta entrega. La diferencia de precio y costo actual mostrada en recetas es una estimación diferente del margen realizado.
- Los abonos y pagos están vinculados a caja; los movimientos bancarios manuales quedan registrados. La aplicación usa los impuestos individuales existentes y conserva los de las ventas anteriores.

## Validación realizada

70 pruebas del backend sin errores ni omisiones, incluidas 13 pruebas de integración con Spring, Hibernate, caja, ventas, Kardex y contabilidad en PostgreSQL mediante PGlite 18.3 en una base aislada. Compilación de TypeScript/Vite aprobada. Migración aplicada dos veces y verificados prerrequisito, importes, claves de abonos, horarios y turnos.

No se verificó un despliegue en tu Render ni se ejecutaron pruebas completas de navegador. La base de integración parte del esquema generado de la aplicación, no de una copia de tu neondb. Por eso se incluye la comprobación posterior a la instalación. VALIDACION_RESTAURANTE_23.json contiene el registro de estas verificaciones.
