# SICOM · Nueva parte 5: contabilidad guiada

Requiere la nueva parte 4 de Dashboard y Reportes, incluido su SQL. Conserva el diseño, los libros y las funciones anteriores. Añade **Contabilidad → Revisión y cierre**, con cuatro pasos: resumen, operaciones pendientes, caja y bancos, y cierre con historial.

## Instalación

Descarga ambos ZIP, el SQL y los dos PS1 en **Descargas**. No pegues el contenido del PS1 línea por línea: ejecuta el archivo con el comando indicado. Los PS1 buscan el ZIP correspondiente en Descargas, lo descomprimen y validan su versión y sus archivos antes de copiar código.

1. En pgAdmin selecciona **neondb** y ejecuta completo `migracion-sicom-contabilidad-5.sql`. Debe finalizar en COMMIT. Si falta Dashboard y Reportes parte 4, aplica primero ese SQL. Esta migración puede repetirse.
2. Publica el backend:

```powershell
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\PUBLICAR_BACKEND_CONTABILIDAD_5.ps1"
```

3. Espera a que el backend aparezca **Live en Render** y comprueba sus registros de inicio.
4. Publica el frontend:

```powershell
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\PUBLICAR_FRONTEND_CONTABILIDAD_5.ps1"
```

5. Espera al frontend Live, actualiza el navegador y comprueba Contabilidad → Revisión y cierre.

Los repositorios usados son `C:\PROYECTOS\tiendapos_1` y `C:\PROYECTOS\tiendapos_frontem`. La extracción automática se realiza en `C:\PROYECTOS\ACTUALIZACION_SICOM_CT5`. Los scripts conservan variables y claves locales, detienen la publicación si hay cambios registrados sin guardar, y comprueban errores de Git. El frontend se compila antes de subirlo. Si hay un error, conserva el resultado y no continúes con instrucciones sueltas.

Si solo descargaste el ZIP backend, este bloque completo extrae y ejecuta el PS1 incluido:

```powershell
& {
    $ErrorActionPreference = "Stop"
    $zip = Get-ChildItem "$env:USERPROFILE\Downloads" -File | Where-Object { $_.Name -like "tiendapos_1_contabilidad_5*.zip" } | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (!$zip) { throw "Descarga tiendapos_1_contabilidad_5.zip en Descargas." }
    Expand-Archive -LiteralPath $zip.FullName -DestinationPath "C:\PROYECTOS\ACTUALIZACION_SICOM_CT5" -Force
    & "C:\PROYECTOS\ACTUALIZACION_SICOM_CT5\tiendapos_1\PUBLICAR_BACKEND_CONTABILIDAD_5.ps1"
}
```

Para el frontend cambia `tiendapos_1` por `tiendapos_frontem` y `BACKEND` por `FRONTEND`. Ejecuta primero SQL y backend.

## Uso

### 1. Resumen

Selecciona un mes. La revisión comprende **toda la empresa y todas las sucursales** porque el período contable pertenece a la empresa. Ingresos, costos y gastos proceden de asientos CONTABILIZADOS. Resultado = ingresos − costos − gastos. Se muestran las cuentas y sus débitos, créditos y saldos, con formato colombiano y dos decimales.

El dinero recibido no siempre es ingreso: capital de préstamos, impuestos y anticipos conservan el tratamiento de las cuentas configuradas. El resultado depende de que el contador haya configurado y usado correctamente el plan de cuentas.

### 2. Operaciones pendientes

Se detectan documentos sin asiento vigente: ventas completadas, compras no anuladas, gastos, devoluciones, abonos de clientes/proveedores, desembolsos y componentes de recaudos nuevos de préstamos, y anticipos de servicios. Los históricos importados de préstamos y refinanciaciones no se incluyen en esta lista de operaciones nuevas. La detección tampoco abarca todos los eventos especializados de restaurante, nómina o movimientos externos.

Puede haber documentos anteriores a activar contabilidad: revisa el soporte antes de contabilizarlos. Abre su módulo para buscar el registro; el enlace no guarda una operación. Si falta el asiento, créalo en Libro Diario con las cuentas correctas y después usa **Vincular asiento**. Debe ser manual, vigente, cuadrado, del mismo mes y sin otro vínculo. Un contador debe verificar importes, cuentas e impuestos. El sistema valida esas condiciones, pero no determina por sí solo que un asiento manual sea el tratamiento contable correcto.

El vínculo no repite ventas, gastos, desembolsos ni movimientos de caja. Reintentar el mismo vínculo no lo duplica. Si se anula el asiento vinculado, el documento vuelve a aparecer pendiente; su corrección debe revisarse antes de volver a cerrar. El vínculo conserva el registro original y su historial.

También se señalan asientos descuadrados o sin líneas. Corrígelos mediante los controles contables, conservando sus soportes.

### 3. Caja y bancos

**Bancos:** se muestran las líneas de asientos vigentes de la cuenta actualmente mapeada al concepto BANCOS. Consulta el extracto real, selecciona el movimiento e introduce fecha, importe y referencia única (por ejemplo, cuenta + extracto + número de línea). Ingreso positivo, salida negativa. El importe debe coincidir exactamente, con hasta dos decimales. La referencia no puede usarse para otro movimiento. Reintentar la misma conciliación no genera otro registro.

Si hay comisión, movimiento omitido o diferencia, registra primero el ajuste contable autorizado. Puedes deshacer una conciliación con motivo mientras el período esté abierto. Esta conciliación es manual por línea; no importa extractos, no conecta al banco, no agrupa varias líneas y no certifica la veracidad del extracto. No incluye cuentas bancarias que no estén mapeadas como BANCOS ni compara automáticamente un saldo externo final.

**Caja:** compara saldo del sistema y efectivo contado de sesiones cerradas en ese mes. Una diferencia exige explicación; revisarla conserva el faltante o sobrante y no modifica dinero ni crea asientos. Si los importes cambian, la revisión anterior deja de satisfacer la comprobación. Las cajas sin ambos importes requieren corregir su cierre. Se señalan las sesiones todavía abiertas que comenzaron antes del fin del mes; ciérralas desde POS.

### 4. Cierre e historial

Si el mes todavía está en curso, espera al mes siguiente. Si falta su período, usa **Crear período para este mes**: no crea asientos. El cierre vuelve a comprobar en el servidor documentos pendientes, descuadres, movimientos de bancos sin conciliar, diferencias de caja sin revisar y cajas abiertas. Luego solicita motivo y confirmación.

Al cerrar, los asientos y sus líneas quedan protegidos en la base de datos contra altas, modificaciones, anulaciones y eliminaciones en ese período. Ventas y gastos fechados allí también se protegen. Los demás documentos operativos no reciben todos un bloqueo propio; cuando generan asientos, el bloqueo contable rechaza y revierte esa contabilización. No reemplaza una revisión de cada módulo ni una auditoría fiscal.

El cierre y la escritura de asientos utilizan un bloqueo por empresa para ordenar las operaciones concurrentes. Después del cierre se abre el mes siguiente si no existe. Repetir el mismo cierre no añade otra entrada de historial.

La reapertura exige permiso propio, motivo y confirmación. Los cambios posteriores pueden modificar resultados históricos; revisa sus efectos antes de volver a cerrar. Los botones de la lista anterior de Períodos llevan ahora a la revisión del mes seleccionado. Las rutas antiguas no permiten cerrar o reabrir sin el flujo nuevo.

El historial muestra responsable, fecha, acción, registro y motivo de las últimas 500 acciones de toda la empresa, sin limitarlo al mes seleccionado. Incluye vínculos, conciliaciones, revisiones, cierres y reaperturas nuevos.

## Permisos

Administrador y superadministrador conservan su acceso. Los nuevos permisos no se asignan automáticamente a empleados:

| Permiso | Permite |
| --- | --- |
| CONTABILIDAD_CONSULTAR | Consultar la revisión financiera de toda la empresa |
| CONTABILIDAD_CONCILIAR | Conciliar bancos y explicar diferencias de caja |
| CONTABILIDAD_VINCULAR | Vincular asientos manuales revisados |
| CONTABILIDAD_CERRAR | Crear períodos y cerrarlos después de revisar |
| CONTABILIDAD_REABRIR | Reabrir con motivo |
| CONTABILIDAD_GESTIONAR, existente | Crear/anular asientos y modificar configuración contable |

Para usar acciones de la revisión, asigna también CONSULTAR. GESTIONAR conserva lectura de los libros anteriores, pero la revisión nueva y el cierre requieren sus permisos específicos. Los permisos se validan en el backend y los botones nuevos se restringen en pantalla. Cierra e inicia sesión después de modificar un rol.

Los contadores externos conservan su flujo anterior de lectura por empresas autorizadas. Esta revisión guiada se usa para la empresa propia de la sesión; no amplía sus permisos a otras empresas.

## Descarga y comprobación

**Descargar esta sección** entrega CSV compatible con Excel del resultado consultado, con empresa, mes, explicación y resumen. En caja y bancos incluye ambas tablas; en pendientes incluye documentos y descuadres. El historial exporta las acciones cargadas de toda la empresa. Es CSV, no XLSX, y no sustituye los libros o soportes originales.

`VALIDACION_CONTABILIDAD_5.json` detalla las pruebas. Se verifican backend en PostgreSQL PGlite aislado, migración repetida, compilación de producción y componentes React en DOM simulado. Falta probar Windows, neondb y Render de producción y realizar inspección gráfica en navegador real.

Antes de cerrar un mes real, prueba una operación de lectura, una conciliación respaldada por extracto y los permisos de un empleado. Una revisión sin pendientes significa que pasaron las comprobaciones descritas; no certifica que toda la contabilidad del negocio esté completa o correctamente clasificada.

La parte 6 corresponde a organización de Configuración, tutorial y ayuda/asistente acordados; no se incluyen como terminados en esta entrega.
