# SICOM — calendario de servicios, parte 3

Esta entrega continúa sobre Acceso 1 y Apariencia 2. Conserva los módulos y el diseño general. Agrega el calendario dentro de Servicios → Citas.

## Archivos y orden de instalación

1. Descarga en **Descargas** los dos ZIP y los dos PS1 de esta entrega, con sus nombres originales.
2. En pgAdmin selecciona **neondb**, abre Query Tool y ejecuta el archivo completo `migracion-sicom-calendario-3.sql`. Verifica que termine correctamente. Antes de actualizar, conserva tu respaldo habitual.
3. Ejecuta el comando del backend. El PS1 localiza el ZIP en Descargas, lo descomprime, comprueba su contenido y publica el código en GitHub. No ejecuta el SQL.
4. Espera a que el backend aparezca **Live** en Render y verifica sus registros.
5. Ejecuta el comando del frontend y espera su despliegue.

Backend:

```powershell
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\PUBLICAR_BACKEND_CALENDARIO_3.ps1"
```

Frontend, después de comprobar el backend:

```powershell
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\PUBLICAR_FRONTEND_CALENDARIO_3.ps1"
```

**Ejecuta el archivo PS1: no pegues su contenido línea por línea.** Si aparece un error, detén la instalación antes del siguiente paso. Los scripts se detienen si faltan archivos o hay cambios locales registrados. Conservan variables y claves locales. Necesitas Git y, para frontend, Node/npm, como en las entregas anteriores.

Repositorios predeterminados: `C:\PROYECTOS\tiendapos_1` y `C:\PROYECTOS\tiendapos_frontem`. Extracción automática: `C:\PROYECTOS\ACTUALIZACION_SICOM_C3`.

Si descargaste solo el ZIP, el PS1 también está incluido. Ejecuta **todo este bloque de una sola vez** para backend:

```powershell
& {
    $ErrorActionPreference = "Stop"
    $destino = "C:\PROYECTOS\ACTUALIZACION_SICOM_C3"
    $zip = Get-ChildItem (Join-Path $env:USERPROFILE "Downloads") -File |
        Where-Object { $_.Name -like "tiendapos_1_calendario_3*.zip" } |
        Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (!$zip) { throw "Descarga tiendapos_1_calendario_3.zip en Descargas." }
    Expand-Archive -LiteralPath $zip.FullName -DestinationPath $destino -Force
    powershell -ExecutionPolicy Bypass -File "$destino\tiendapos_1\PUBLICAR_BACKEND_CALENDARIO_3.ps1"
    if ($LASTEXITCODE -ne 0) { throw "Backend detenido. Copia el error antes de continuar." }
}
```

Después de backend Live, bloque del frontend:

```powershell
& {
    $ErrorActionPreference = "Stop"
    $destino = "C:\PROYECTOS\ACTUALIZACION_SICOM_C3"
    $zip = Get-ChildItem (Join-Path $env:USERPROFILE "Downloads") -File |
        Where-Object { $_.Name -like "tiendapos_frontem_calendario_3*.zip" } |
        Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (!$zip) { throw "Descarga tiendapos_frontem_calendario_3.zip en Descargas." }
    Expand-Archive -LiteralPath $zip.FullName -DestinationPath $destino -Force
    powershell -ExecutionPolicy Bypass -File "$destino\tiendapos_frontem\PUBLICAR_FRONTEND_CALENDARIO_3.ps1"
    if ($LASTEXITCODE -ne 0) { throw "Frontend detenido. Copia el error antes de continuar." }
}
```

## Calendario

- Vistas de día por empleado, semana, mes y lista del día. Fecha, Hoy, navegación de períodos y filtros por sucursal/empleado.
- Cada día muestra cliente, servicio, empleado, sucursal, duración, equipo, notas y estado. Los indicadores resumen el día seleccionado con los filtros actuales.
- Pulsa un horario libre para abrir la cita con fecha, hora, empleado y sucursal. La cuadrícula tiene intervalos de 30 minutos; puedes ajustar la hora exacta en el formulario.
- Busca el cliente por nombre o teléfono dentro del formulario. Seleccionar el tipo de servicio carga su duración configurada.
- El backend valida la duración completa, la disponibilidad y los cruces, incluso si otro usuario guarda mientras tú consultas. Sin disponibilidad configurada, permite horarios sin superposición.
- Arrastra una cita en la vista diaria a otro horario/empleado y confirma. En móvil o con teclado, abre la cita y cambia fecha/hora en su formulario.
- Si la cita ya tiene cotización, conserva cliente, empleado, sucursal y tipo de servicio; puedes modificar horario, notas o equipo. Gestiona cambios comerciales desde Operación de servicios.
- Conserva confirmación, inicio, finalización, cancelación autorizada e inasistencia. Las citas terminadas son de consulta.
- Reprogramar deja auditoría de la hora anterior y nueva, y reactiva el recordatorio autorizado existente. Los recordatorios siguen siendo una bandeja de envío manual; no envía mensajes automáticamente.
- Se quitó la conversión errónea a UTC del formulario. Los nuevos horarios se envían como hora local de la agenda. No se desplazan automáticamente las citas históricas.

## Puestos y equipos

Administrador autorizado: pulsa **Puestos y equipos**, asigna nombre y sucursal. Puedes crear y activar/desactivar recursos. Al reservar uno, no se permiten citas simultáneas en ese recurso, aunque tengan empleados distintos. El recurso es opcional: úsalo para sillas, cabinas o equipos que no se comparten simultáneamente.

No puedes desactivar ni trasladar un recurso con citas activas: primero reprograma esas citas.

## Anticipos y cobro desde la cita

1. Guarda una cita con cliente y abre **Anticipos y cobro de esta cita**.
2. Selecciona el producto de servicio facturable (activo, sin inventario) y el precio sin impuesto; pulsa **Preparar cotización**. El sistema calcula impuestos con la lógica vigente.
3. Un usuario autorizado aprueba la cotización. Preparar/aprobar no mueve dinero.
4. Con caja abierta de la misma sucursal, registra el importe real del anticipo y su medio de pago. Transferencia/tarjeta requieren referencia. Muestra total con impuestos, anticipos, saldo e historial de anticipos.
5. Completa la cita. Pulsa **Usar saldo exacto**, comprueba el importe recibido y **Facturar y cobrar saldo**. Esta acción crea/entrega la orden vinculada y factura con el flujo existente, dentro de la misma transacción. Si ya está totalmente anticipada, usa saldo 0 para facturar.
6. Para pago parcial usa anticipo; la facturación exige el saldo restante. El formulario ofrece un medio por operación. Puedes registrar anticipos sucesivos por medios distintos antes del cierre.

Los anticipos/cobros quedan vinculados a cotización, orden y venta. Reintentar un anticipo con la misma clave no duplica dinero; repetir una facturación ya realizada devuelve la venta existente. El efectivo produce movimiento de caja; transferencia/tarjeta producen registro bancario con referencia. No ejecuta transferencias externas ni verifica el banco.

Si Contabilidad está activa, configura la cuenta de pasivo para anticipos desde Operación de servicios; el sistema detiene el anticipo si falta. Al facturar se aplican los anticipos con la integración contable existente. Si cambiaron impuestos desde la cotización, se bloquea la facturación y debes revisar una nueva cotización.

Cancelar la cita no reintegra automáticamente anticipos ni anula una factura. Reintegros y devoluciones se gestionan con autorización desde las funciones existentes. Citas canceladas o con inasistencia no admiten nuevos anticipos desde el calendario. Si una cita histórica tiene varias cotizaciones, el cobro pide revisarlas en Operación de servicios, sin escoger una arbitrariamente.

## Permisos

Se conservan los permisos de Acceso 1: consultar/operar y alcance propio, sucursal o empresa. Un empleado no puede abrir el cobro de una cita ajena fuera de su alcance. Puestos/equipos requieren administración; aprobar requiere administración y `SERVICIOS_APROBAR`; anticipar/facturar requieren operar y `SERVICIOS_COBRAR`. No se conceden permisos automáticamente.

## Comprobación

Backend: 161 pruebas aprobadas (anteriores + 8 de calendario/cobros), sin fallos ni errores, en PostgreSQL PGlite aislado. Migración nueva ejecutada dos veces. Frontend: TypeScript y Vite compilados; interacciones React comprobadas con JSDOM y API simulada.

Pendiente en tu entorno: ejecutar SQL en neondb, desplegar en Render y comprobar el aspecto en un navegador real. Los PS1 no se ejecutaron en Windows aquí. La verificación de DOM no sustituye la revisión visual real.

Prueba después de instalar: agenda una cita, intenta otra que cruce al mismo empleado/equipo, reprograma, registra un anticipo, completa, factura el saldo y verifica caja/bancos. Entra con un empleado de consulta y comprueba que no pueda modificar ni consultar cobros ajenos.

Esta parte no incluye los cambios pendientes de dashboard/reportes, contabilidad guiada ni tutorial: corresponden a las siguientes entregas.
