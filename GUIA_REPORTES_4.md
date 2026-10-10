# SICOM · Parte 4: dashboard y reportes

Conserva el diseño general y las funciones de las partes anteriores. Requiere la parte 3 del calendario instalada, incluido su SQL.

## Archivos y orden de instalación

Descarga ambos ZIP, el SQL y ambos PS1 en **Descargas**. Los PS1 buscan y descomprimen el ZIP correspondiente automáticamente; no necesitas copiar sus instrucciones una por una en PowerShell.

1. En pgAdmin, selecciona **neondb** y ejecuta completo `migracion-sicom-reportes-4.sql`. Debe terminar en COMMIT. Si indica que falta Calendario parte 3, aplica primero ese SQL. La migración puede repetirse.
2. Abre PowerShell y ejecuta este comando completo para el backend:

```powershell
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\PUBLICAR_BACKEND_REPORTES_4.ps1"
```

3. Espera a que el backend termine su despliegue en Render y aparezca **Live**. Comprueba que inicia sin errores de migración.
4. Ejecuta el frontend:

```powershell
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\PUBLICAR_FRONTEND_REPORTES_4.ps1"
```

5. Espera a que el frontend aparezca Live y actualiza el navegador. Revisa dashboard y Reportes → Detalle con filtros y descarga.

Los repositorios esperados son `C:\PROYECTOS\tiendapos_1` y `C:\PROYECTOS\tiendapos_frontem`. Los ZIP se extraen en `C:\PROYECTOS\ACTUALIZACION_SICOM_R4`. Los scripts comprueban versión e integridad antes de copiar código. Conservan variables y claves locales. Detienen la publicación si hay cambios locales registrados o falla una comprobación. El frontend se compila antes de subirlo. Si un script falla, conserva el error y no sigas pegando sus líneas.

Si descargaste únicamente el ZIP del backend, puedes extraerlo y ejecutar el PS1 incluido con este bloque completo:

```powershell
& {
    $ErrorActionPreference = "Stop"
    $zip = Get-ChildItem "$env:USERPROFILE\Downloads" -File | Where-Object { $_.Name -like "tiendapos_1_reportes_4*.zip" } | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (!$zip) { throw "Descarga tiendapos_1_reportes_4.zip en Descargas." }
    Expand-Archive -LiteralPath $zip.FullName -DestinationPath "C:\PROYECTOS\ACTUALIZACION_SICOM_R4" -Force
    & "C:\PROYECTOS\ACTUALIZACION_SICOM_R4\tiendapos_1\PUBLICAR_BACKEND_REPORTES_4.ps1"
}
```

Para el frontend se usa el mismo procedimiento cambiando `tiendapos_1` por `tiendapos_frontem` y `BACKEND` por `FRONTEND`. No ejecutes el frontend antes de comprobar el backend.

## Qué incluye

- Indicadores del dashboard que abren detalle y muestran qué registros o cálculos representan. Los indicadores de hoy, mes y año utilizan su período correspondiente.
- Filtros de fecha y sucursal compartidos entre dashboard y el nuevo centro de reportes. En reportes también puedes seleccionar empleado y estado. Hoy, este mes y limpiar facilitan la selección.
- Pendientes actuales: productos agotados, existencias bajas, órdenes por recibir, proveedores por pagar y clientes por cobrar. Las compras y productos abren su módulo con el registro o proveedor seleccionado; completar la operación requiere pulsar su acción habitual.
- Centro de reportes con ventas, utilidad estimada, inventario, caja, cajas abiertas, compras, gastos, cartera, recepción pendiente, clientes, proveedores, arqueos, kardex y datos de restaurante, citas, órdenes y préstamos según permisos y plan.
- Explicación de cada reporte, fecha de consulta, búsqueda por nombre, documento, código o código de barras, paginación y descarga CSV compatible con Excel. La descarga del reporte contiene todas las filas filtradas por la búsqueda, aunque ocupen varias páginas; no vuelve a consultar datos que podrían cambiar.
- Descarga de los indicadores cargados del dashboard. Los detalles de pendientes se descargan desde su propio reporte.
- Números en formato colombiano con separadores y dos decimales para dinero. Entradas y salidas de caja se totalizan por separado.
- Errores comprensibles. Un fallo de consulta no se presenta como un total cero.

## Permisos

Administrador y superadministrador conservan su acceso. Para empleados, asigna **REPORTES_CONSULTAR** únicamente a quienes deban consultar información financiera de la empresa. **REPORTES_VER_COSTOS** permite ver costos, valoración de inventario, utilidad y márgenes; consultar reportes por sí solo no concede ese acceso. El SQL crea estos permisos sin asignarlos automáticamente a roles.

Los reportes de restaurante, servicios y préstamos requieren además consultar su módulo, ver reportes y ver datos de la empresa, y que el plan permita el módulo. La validación se realiza en el backend. Un empleado sin permiso de reportes ve una pantalla de inicio sin consultar el dashboard financiero. Después de cambiar permisos, cierra e inicia sesión para actualizar la sesión del empleado.

## Cómo interpretar los totales

- Ventas incluye ventas completadas, descuentos e impuestos; no equivale al dinero recaudado. Las devoluciones posteriores deben conciliarse con sus documentos y no se restan en este reporte.
- La utilidad es una estimación de ventas sin impuestos menos costo del kardex vinculado. No incluye gastos, devoluciones posteriores ni costos sin ese vínculo; no es resultado contable ni margen completo de recetas.
- Existencias, cartera, recepción pendiente y saldo de cajas son datos actuales. Sus explicaciones indican cuándo las fechas o el empleado no aplican. Los directorios de clientes y proveedores pertenecen a la empresa y no se les inventa una sucursal.
- Los movimientos de caja del período incluyen sesiones cerradas. El saldo actual incluye solo cajas abiertas.
- Filtrar sucursal excluye compras sin orden ni recepción vinculada, y cartera manual sin venta vinculada.
- Las comandas muestran consumo registrado, no recaudo; citas y órdenes muestran actividad, no prueba de pago. El detalle de préstamos muestra capital original del contrato, no capital pendiente. Los indicadores históricos existentes de préstamos se identifican como históricos al abrir su explicación.
- Algunos indicadores de clientes abren el directorio con una explicación de la diferencia entre el indicador y ese directorio, no una lista exacta de clientes que compone el indicador.

## Verificación y límites

Consulta `VALIDACION_REPORTES_4.json` para los resultados de pruebas. Se verifica backend contra una base PostgreSQL PGlite aislada, SQL repetible, compilación de producción y componentes React en DOM simulado. No se ha ejecutado el PS1 en tu Windows ni instalado en neondb/Render de producción; comprueba esos pasos después de publicar.

Los informes anteriores permanecen disponibles para administradores con sus controles originales. Los filtros compartidos y la descarga nueva están en **Detalle con filtros y descarga**. El archivo es CSV compatible con Excel, no XLSX. Si una consulta supera 10.000 filas, solicita reducir filtros y no entrega un resultado cortado silenciosamente. No se ha realizado inspección gráfica en navegador real.

La contabilidad guiada, cierre de períodos y tutorial corresponden a las siguientes partes; no se dan por entregados en esta parte 4.
