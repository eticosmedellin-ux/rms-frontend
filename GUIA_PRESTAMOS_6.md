# SICOM — parte 6: cobranza y cobros más claros

Requiere la parte 5 instalada. Los dos ZIP contienen proyectos completos con las partes anteriores y esta actualización. Se conserva el diseño de Préstamos: colores, tablas, formularios y distribución. Se añaden las funciones aprobadas y se ajustan textos, importes y el cobro.

## Archivos

- tiendapos_1_prestamos_6.zip: backend completo.
- tiendapos_frontem_prestamos_6.zip: frontend completo.
- migracion-sicom-prestamos-6.sql: SQL nuevo, también dentro del backend.
- PUBLICAR_BACKEND_PRESTAMOS_6.ps1 y PUBLICAR_FRONTEND_PRESTAMOS_6.ps1: también incluidos dentro de sus ZIP.
- VALIDACION_PRESTAMOS_6.json: resultados y límites de verificación.

## 1. Descomprimir primero

Descarga AMBOS ZIP en Descargas. Pega TODO este bloque de una sola vez en PowerShell. No pegues el contenido de los PS1 línea por línea.

```powershell
& {
    $ErrorActionPreference = "Stop"
    $descargas = Join-Path $env:USERPROFILE "Downloads"
    $destino = "C:\PROYECTOS\ACTUALIZACION_SICOM_P6"
    New-Item -ItemType Directory -Force -Path $destino | Out-Null
    foreach ($nombre in @("tiendapos_1_prestamos_6", "tiendapos_frontem_prestamos_6")) {
        $zip = Get-ChildItem -LiteralPath $descargas -File |
            Where-Object { $_.Name -like "$nombre*.zip" } |
            Sort-Object LastWriteTime -Descending |
            Select-Object -First 1
        if (!$zip) { throw "Descarga $nombre.zip en Descargas." }
        Expand-Archive -LiteralPath $zip.FullName -DestinationPath $destino -Force
    }
    foreach ($carpeta in @("tiendapos_1", "tiendapos_frontem")) {
        if (!(Test-Path "$destino\$carpeta\VERSION_PRESTAMOS_6.json")) {
            throw "La extracción quedó incompleta en $carpeta."
        }
    }
    Write-Host "LISTO. Aplica ahora el SQL nuevo en neondb."
}
```

## 2. SQL en neondb

Conserva un respaldo reciente. En pgAdmin, abre Query Tool en **neondb**, y comprueba:

```sql
SELECT current_database();
SELECT version FROM public.sicom_migraciones WHERE version='prestamos-entrega-5';
```

Debe indicar neondb y devolver la versión 5. Ejecuta TODO migracion-sicom-prestamos-6.sql, desde BEGIN hasta COMMIT. También está en C:\PROYECTOS\ACTUALIZACION_SICOM_P6\tiendapos_1. No ejecutes seed.sql ni SQL de entregas anteriores.

```sql
SELECT version FROM public.sicom_migraciones WHERE version='prestamos-entrega-6';
```

Si hay error: ROLLBACK y conserva el mensaje. La migración es repetible y no recalcula ni elimina cuotas o pagos anteriores.

## 3. Publicar backend

Ejecuta esta única línea; no el contenido del archivo:

```powershell
powershell -ExecutionPolicy Bypass -File "C:\PROYECTOS\ACTUALIZACION_SICOM_P6\tiendapos_1\PUBLICAR_BACKEND_PRESTAMOS_6.ps1"
```

Actualiza C:\PROYECTOS\tiendapos_1. Valida archivos, comprueba cambios locales, actualiza main, copia código y documentos, crea commit cuando hay cambios y hace push. Espera backend Live en Render y revisa el arranque antes del frontend. Las variables y claves locales se conservan.

## 4. Publicar frontend

```powershell
powershell -ExecutionPolicy Bypass -File "C:\PROYECTOS\ACTUALIZACION_SICOM_P6\tiendapos_frontem\PUBLICAR_FRONTEND_PRESTAMOS_6.ps1"
```

Actualiza C:\PROYECTOS\tiendapos_frontem y compila antes de hacer push. Espera frontend Live en Render y recarga SICOM con Ctrl+F5. Los scripts aceptan -Repositorio y -Fuente si usas otras rutas. «Everything up-to-date» confirma que Git no tiene cambios por subir; no reemplaza la comprobación del despliegue ni de la pantalla.

## 5. Cobro por cuota

1. En Contratos y cuotas, abre el préstamo y selecciona la sucursal con caja abierta.
2. En Registrar pago del cliente, selecciona una cuota. Verás número, vencimiento, valor pactado, abonado, mora pendiente y pendiente exacto.
3. Cuánto paga el cliente viene con el pendiente sugerido y se puede modificar para un abono parcial.
4. Escribe importes como 1.000.000 o 106.410,25. También admite 1000000. El punto separa miles y la coma separa centavos.
5. Elige efectivo o transferencia; para transferencia indica banco y referencia.
6. Pulsa Revisar pago. Comprueba la distribución entre mora, interés y capital, y luego Confirmar y registrar pago, únicamente al recibir el dinero real.

La selección aplica el pago a ESA cuota. Si existen cuotas anteriores pendientes, se avisa y permanecen pendientes. Dentro de la cuota se aplica mora, interés pactado y capital, en ese orden. No se reamortiza automáticamente el contrato.

Un excedente exige seleccionar expresamente aplicarlo a las cuotas siguientes y revisar su distribución. No se aplica silenciosamente a otra cuota ni se inventa un cambio de efectivo. Para cerrar el préstamo hoy elige Cancelar todo el préstamo hoy y usa el saldo exacto, eliminando intereses futuros no devengados.

Refinanciar préstamo permanece cerrado; pulsa su encabezado para abrirlo hacia abajo. Los métodos financieros de la parte 5 se conservan. Límites y reglas incorpora nombres más sencillos y ayuda debajo de los campos. Las tasas siguen siendo NOMINALES, configuradas por el administrador/contador, sin tarifa legal automática.

## 6. Seguimiento y promesas

Agenda: elige contrato, responsable, fecha/hora de Colombia, canal y tarea. Al realizar o cancelar, registra el resultado. Es una agenda interna: no envía mensajes ni llamadas automáticamente.

Promesas: elige cuota, importe, fecha prometida y acuerdo. No reduce la deuda ni mueve dinero. Solo admite una promesa vigente por cuota. Verificar cumplimiento exige pagos reales suficientes aplicados a esa cuota desde la creación de la promesa. Vencida sin resolver aparece como INCUMPLIDA; el usuario verifica o cancela el acuerdo. La comprobación de cumplimiento es manual, respaldada por los pagos del sistema, no por pulsar un botón sin pagar.

## 7. Rutas y dinero del cobrador

1. El supervisor crea ruta para una sucursal, con fecha, cobrador y visitas ordenadas por contrato/cuota/dirección.
2. El cobrador asignado abre su ruta y registra visitado, no localizado o cancelado con resultado. Solo el cobrador asignado puede registrar dinero recogido.
3. La recogida registra lo recibido del cliente, medio y referencia. Todavía está POR ENTREGAR y NO entra en caja, banco ni contabilidad. No es el comprobante final de pago.
4. El supervisor recibe el efectivo real o verifica la transferencia y pulsa Confirmar entrega / banco. Se aplica a la cuota y se genera el comprobante; efectivo entra a la caja abierta de la misma sucursal y transferencia queda en registro bancario manual. La caja y la contabilidad se registran al conciliar.
5. Se conserva la fecha de recogida como fecha del pago del cliente para el cálculo de mora; la fecha de conciliación queda registrada aparte. La recogida se registra al recibir el dinero, no se admite introducir fechas anteriores desde la pantalla.
6. Si el dinero se devuelve al cliente antes de conciliar, documenta la devolución real con constancia y motivo. No se crea una salida ficticia de caja porque ese dinero nunca ingresó.
7. Para cerrar la ruta deben estar resueltas todas las visitas y conciliado o documentado como devuelto todo el dinero.

Mientras exista dinero por entregar de un contrato se bloquean pagos directos, refinanciación y reversión de sus pagos. Primero concilia o documenta la devolución para evitar dos cobros sobre el mismo pendiente. Las recogidas acumuladas no pueden superar el pendiente de la cuota. La conciliación repetida no genera un segundo pago. La supervisión es por empresa; un cobrador sin permiso de supervisor solo consulta sus rutas.

## 8. Reversión autorizada

En el historial del contrato pulsa Solicitar reversión y registra motivo. No cambia el dinero ni la deuda todavía. Otro usuario con permiso debe entrar a Control y rentabilidad y autorizar o rechazar, indicando respuesta.

Autorizar y devolver registra una operación REAL: egreso de caja (con saldo suficiente) o salida bancaria manual, asiento inverso cuando contabilidad está activa, recuperación del pendiente y auditoría. Nunca borra el pago original; se muestra REVERTIDO y su PDF lo indica. Puede utilizar la caja actualmente abierta de la misma sucursal, sin alterar el cierre de la caja original. La devolución conserva el medio del pago original.

Se revierten primero los pagos posteriores para mantener el orden del historial. Solo se admiten recaudos reales en efectivo/transferencia de contratos activos o pagados. No se alteran desde aquí importaciones históricas, movimientos internos de refinanciación ni cadenas de contratos refinanciados. Una solicitud por pago, con respuesta definitiva; una solicitud rechazada queda conservada. Se restaura el interés futuro eliminado si se revierte una cancelación anticipada. Las promesas cumplidas cuyo pago de soporte se revierte vuelven a revisión.

## 9. Alertas y rentabilidad

Alertas: contratos históricos activos sin revisar, cuotas con capital vencido, promesas incumplidas, dinero del cobrador sin conciliar, desglose de cuota diferente a aplicaciones vigentes y recaudos sin movimiento de caja/banco coincidente. No corrige importes automáticamente ni pretende detectar toda posible inconsistencia externa.

Rentabilidad por período: intereses y mora efectivamente cobrados, menos costos de operación y financiación registrados. El capital recuperado se muestra aparte y NO es utilidad. Excluye históricos importados, refinanciación interna y pagos revertidos. Los pagos de ruta se agrupan por fecha de recogida del cliente. Una reversión posterior puede corregir el resultado de un período anterior; este informe no sustituye al flujo de caja por fecha del asiento.

Registrar costo soportado permite indicar contrato opcional, fecha, tipo, importe, concepto y referencia al comprobante/asiento existente. Es un registro analítico de costos YA PAGADOS O CONTABILIZADOS; no vuelve a mover caja ni a contabilizarlos. El resultado depende de que se registren todos los costos correspondientes. No es una tasa de retorno ni calcula automáticamente provisiones, pérdidas, impuestos o costo del capital sin datos registrados. Los costos registrados se conservan para auditoría.

El registro bancario sigue siendo manual: no verifica saldos ni realiza transferencias a un banco externo.

## 10. Permisos

Asigna permisos a los roles de tu empresa y vuelve a iniciar sesión para actualizar la sesión del frontend. No se asignan automáticamente a roles ordinarios.

| Permiso | Uso |
| --- | --- |
| PRESTAMOS_COBRANZA | Agenda y promesas |
| PRESTAMOS_RUTAS | Crear rutas, supervisar, conciliar y cerrar |
| PRESTAMOS_COBRAR_RUTA | Visitas y recogidas de rutas asignadas |
| PRESTAMOS_SOLICITAR_REVERSO | Solicitar reversión |
| PRESTAMOS_AUTORIZAR_REVERSO | Autorizar/rechazar solicitudes de OTRO usuario |
| PRESTAMOS_REPORTES | Alertas y rentabilidad |
| PRESTAMOS_COSTOS | Registrar costos soportados |

Conciliar requiere también PRESTAMOS_RECAUDAR de parte 5. La configuración, aprobaciones, desembolsos, soportes y refinanciación mantienen sus permisos anteriores. Las operaciones comprueban pertenencia a la empresa desde el backend.

## 11. Validación y revisión al instalar

Comprobado: 125 pruebas backend sin fallos ni omisiones, incluidas 37 de integración de préstamos; 16 comprobaciones de formato y renderizado del formulario; TypeScript/Vite; SQL repetido, prerrequisito, claves y restricción de dos usuarios; PDF renderizados para revisión visual.

No comprobado en tu entorno: instalación en Render, copia de neondb, navegación completa en navegador y concurrencia de varios cobradores reales. No se ejecutaron operaciones en tu producción.

Después de publicar, en empresa de prueba, comprueba cuota seleccionada con abono parcial, excedente explícito, refinanciación cerrada, configuración con ayudas, promesa con pago real, ruta con entrega y cierre, reversión con dos usuarios y sus efectos en caja/contabilidad, alertas y costos. No registres cobros de prueba sobre contratos reales.

Para desarrolladores: verificacion_prestamos contiene la base aislada y las instrucciones para repetir integración. Los tests de integración no deben apuntarse a neondb.
