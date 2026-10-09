# SICOM — parte 4: Servicios

Instalar sobre restaurante 2 y 3. Entrega nueva de backend y frontend, SQL independiente y PowerShell. Los scripts también están dentro de cada ZIP: no necesitas descargarlos por separado para ejecutar los comandos de esta guía.

## Funciones

- Agenda por empleado y día, duración, franjas de disponibilidad por sucursal, validación de superposición entre sucursales, confirmación, reprogramación, cancelación e inasistencia.
- Citas recurrentes: de 2 a 52 repeticiones y período en días; la creación es atómica ante un conflicto.
- Cotización con cliente, empleado, servicio(s), impuestos y garantía; aprobación/rechazo con usuario y fecha; apertura de orden y estados de preparación/entrega; factura mediante el motor de ventas existente.
- Anticipos en efectivo, tarjeta y transferencia, referencia para pagos no efectivos, saldo, reintegro autorizado antes de facturar y aplicación del anticipo sin duplicar caja ni ingresos.
- Materiales descontados del Kardex con costo real y asiento cuando la contabilidad está activa. Clave de operación para reintentos sin doble consumo.
- Fotos y PDF antes/después del trabajo, máximo 5 MB, permisos restringidos y descarga autenticada.
- Comisión por empleado asignado, porcentaje configurado, importe conservado al facturar y pago en efectivo sin duplicación.
- Bonos vendidos: cliente, servicio, venta pagada, código, sesiones y vencimiento. Aplicar a citas completadas del mismo cliente y tipo de servicio vinculado. Control de saldo y de repeticiones.
- Historial del cliente con trabajos, citas, garantías y seguimiento; registro de resultado.
- Consentimiento por cliente y canal, revocación, ventana de recordatorios y bandeja para enviar manualmente y marcar enviado. Reprogramar una cita habilita su nuevo recordatorio.
- Permisos por empresa, auditoría, caja, registro bancario manual, inventario y contabilidad.

No incluye atención clínica ni historias clínicas.

## Paso 1: descomprimir los dos ZIP

Descarga los ZIP en Descargas y pega este bloque completo en PowerShell:

```powershell
& {
    $ErrorActionPreference = "Stop"
    $descargas = Join-Path $env:USERPROFILE "Downloads"
    $destino = "C:\PROYECTOS\ACTUALIZACION_SICOM_S4"
    New-Item -ItemType Directory -Force -Path $destino | Out-Null
    foreach ($nombre in @("tiendapos_1_servicios_4", "tiendapos_frontem_servicios_4")) {
        $zip = Get-ChildItem $descargas -File |
            Where-Object { $_.Name -like "$nombre*.zip" } |
            Sort-Object LastWriteTime -Descending |
            Select-Object -First 1
        if (!$zip) { throw "Falta descargar $nombre.zip en Descargas." }
        Expand-Archive -LiteralPath $zip.FullName -DestinationPath $destino -Force
    }
    foreach ($carpeta in @("tiendapos_1", "tiendapos_frontem")) {
        if (!(Test-Path "$destino\$carpeta\VERSION_SERVICIOS_4.json")) {
            throw "Falta el marcador nuevo en $carpeta."
        }
    }
    Write-Host "LISTO: ambos ZIP descomprimidos."
}
```

No copies el contenido de los PS1 línea por línea. Los comandos siguientes ejecutan los archivos incluidos en los ZIP y se detienen ante errores.

## Paso 2: ejecutar SOLO el SQL nuevo en neondb

Conserva un respaldo reciente. En pgAdmin abre Query Tool sobre neondb y comprueba:

```sql
SELECT current_database();
SELECT version FROM public.sicom_migraciones
WHERE version='restaurante-entregas-2-3';
```

Debe indicar neondb y devolver la versión anterior. Abre **migracion-sicom-servicios-4.sql** y ejecuta todo el archivo, BEGIN a COMMIT. También está dentro del ZIP del backend. No ejecutes seed.sql ni migraciones antiguas.

Comprueba:

```sql
SELECT version FROM public.sicom_migraciones
WHERE version='servicios-entrega-4';
```

Ante un error, ejecuta ROLLBACK y conserva el mensaje; no publiques el código hasta que la migración termine.

## Paso 3: publicar backend

```powershell
powershell -ExecutionPolicy Bypass -File "C:\PROYECTOS\ACTUALIZACION_SICOM_S4\tiendapos_1\PUBLICAR_BACKEND_SERVICIOS_4.ps1"
```

Usa el repositorio C:\PROYECTOS\tiendapos_1. El script valida los archivos, actualiza main, copia código, crea el commit cuando hay cambios y hace push. No incorpora variables locales ni carpetas anidadas. Espera backend Live en Render y revisa el arranque.

## Paso 4: publicar frontend

```powershell
powershell -ExecutionPolicy Bypass -File "C:\PROYECTOS\ACTUALIZACION_SICOM_S4\tiendapos_frontem\PUBLICAR_FRONTEND_SERVICIOS_4.ps1"
```

Usa C:\PROYECTOS\tiendapos_frontem, instala dependencias y compila antes de publicar. Espera frontend Live y recarga con Ctrl+F5. Si tus repositorios tienen otras rutas, los scripts aceptan -Repositorio y -Fuente.

## Configuración y uso

Abre Servicios → Operación completa.

1. En Configuración elige el pasivo de anticipos si hay contabilidad activa, el porcentaje de comisión y las horas de recordatorio.
2. Asigna permisos según el rol: SERVICIOS_CONFIGURAR, SERVICIOS_APROBAR, SERVICIOS_COBRAR, SERVICIOS_SOPORTES y SERVICIOS_COMISIONES. El acceso general sigue dependiendo del plan de citas u órdenes contratado. Los roles ordinarios no reciben automáticamente las nuevas facultades.
3. Crea productos de servicio activos sin inventario, con precio e impuesto configurado. El servicio facturable usa estos productos; el catálogo de tipos de cita conserva duración y agenda. Para bonos, vincula el tipo de cita con su producto facturable.
4. Configura la disponibilidad del empleado. Si no tiene ninguna franja registrada, se permite cualquier horario sin superposición. Las citas nuevas requieren empleado; las antiguas sin asignar se conservan.
5. Crea la cotización, apruébala y abre la orden. Registra anticipos, materiales y soportes mientras se ejecuta. Cambia los estados desde el mismo detalle hasta Entregada y factura cobrando solo el saldo. El cliente, empleado y sucursal de una orden cotizada se conservan.
6. Para repartir un cobro entre medios, registra anticipos de cada medio y paga el saldo final con el último. El API de facturación también acepta varios pagos finales.
7. Para bonos, realiza una venta pagada del servicio, registra el bono y sus sesiones, completa las citas y aplica cada sesión. Una venta solo puede respaldar un bono. Una venta devuelta no habilita sesiones; no se puede devolver un bono que ya tenga sesiones consumidas.
8. Programa seguimiento para garantías, registra el resultado y consulta el historial del cliente. La garantía inicia en la fecha de entrega registrada.
9. Registra la autorización obtenida del cliente antes de preparar recordatorios. La bandeja muestra citas próximas autorizadas: envía el mensaje por el canal indicado y marca enviado después.

## Alcance concreto y límites

- Marcar una cita Completada o una orden Entregada no prueba un pago y ya no genera por sí solo un asiento de contado. La factura/pago real se registra en Operación completa.
- Los antiguos abonos de casos se conservan. Las órdenes creadas desde una cotización usan el nuevo flujo de anticipos, y bloquean el uso simultáneo de abonos antiguos.
- La cotización aprobada conserva líneas y total; no se edita después de aprobar. Si cambian impuestos, el sistema bloquea la facturación y exige una nueva cotización, reintegrando los anticipos antes de sustituirla. No inventa una tarifa tributaria por tipo de servicio.
- La pantalla de creación permite un servicio por cotización; el API admite hasta 100 líneas. Para trabajos con varios servicios se utiliza un producto de servicio que represente el trabajo completo o el API. No hay editor visual de múltiples líneas en esta entrega.
- La comisión usa un porcentaje general configurable aplicado al total con impuestos y se asigna al empleado de la cotización. No tiene escalas por categoría ni porcentaje individual por empleado. Se paga en efectivo y se contabiliza como gasto cuando se paga.
- Los anticipos se reconocen como pasivo hasta facturar. Su aplicación genera una compensación de caja identificada como «sin entrega de efectivo» para eliminar el ingreso duplicado de la venta. Reintegrar antes de facturar requiere permiso y motivo; después se utiliza el flujo de devoluciones.
- Los consumos de materiales son salidas reales, independientes del producto de servicio sin inventario. No se devuelven automáticamente al cancelar: revisa físicamente los materiales y registra el ajuste autorizado existente cuando corresponda.
- Los recordatorios son una bandeja manual configurable. No hay envío automático, proveedor WhatsApp ni tarea de envío en segundo plano. No se envían mensajes desde esta entrega.
- Los servicios recurrentes se representan como citas repetidas, no como débitos automáticos ni suscripciones bancarias.
- Los documentos son soportes operativos JPG/PNG/PDF; no se implementa información clínica. La comisión y la garantía se generan al facturar el trabajo; el historial anterior no se reconstruye.

## Validación

Consulta VALIDACION_SERVICIOS_4.json: pruebas del backend y compilación del frontend, migración repetida en PostgreSQL/PGlite aislado. Las pruebas cubren citas superpuestas y disponibilidad, recurrencia, aprobación de cotización, anticipos/caja, reintegros, materiales, formatos de soportes, separación de empresas, bonos, comisiones, consentimiento y pasivo contable.

No se comprobó un despliegue en tu Render, pruebas completas de navegador ni migración sobre una copia de neondb. Comprueba después de instalar: cita y conflicto, cotización de $10.000 con anticipo de $3.000 y saldo de $7.000, caja neta de $10.000, materiales una sola vez, bono, comisión y permisos con usuario ordinario.
