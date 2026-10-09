# SICOM — parte 5: Préstamos, cálculo y pagos

Requiere Servicios 4. Incluye backend y frontend completos actualizados, SQL nuevo, scripts independientes y scripts dentro de los ZIP.

## Incluido

Simulación, comparación de hasta cinco planes, tasa nominal mensual/anual explícita, tres métodos (cuota fija sobre saldo, capital constante e interés fijo sobre capital original), cuotas con ajuste de redondeo final, solicitud y aprobación, límite de aprobación, vigencia de reglas, desembolso en efectivo o transferencia, pagos parciales a cuotas, cancelación anticipada con saldo de hoy, distribución exacta por capital/interés/mora, comprobantes y estado de cuenta PDF, soportes restringidos, refinanciación encadenada, auditoría y revisión de contratos históricos.

La parte 6 seguirá con seguimiento de cobranza, promesas de pago, rutas, control de cobradores, reversión autorizada, inconsistencias y rentabilidad de cartera. Estas funciones no se dan por implementadas en esta entrega.

## 1. Descargar y descomprimir

Guarda los dos ZIP en Descargas. Pega TODO este bloque de una sola vez:

```powershell
& {
    $ErrorActionPreference = "Stop"
    $descargas = Join-Path $env:USERPROFILE "Downloads"
    $destino = "C:\PROYECTOS\ACTUALIZACION_SICOM_P5"
    New-Item -ItemType Directory -Force -Path $destino | Out-Null
    foreach ($nombre in @("tiendapos_1_prestamos_5", "tiendapos_frontem_prestamos_5")) {
        $zip = Get-ChildItem $descargas -File |
            Where-Object { $_.Name -like "$nombre*.zip" } |
            Sort-Object LastWriteTime -Descending |
            Select-Object -First 1
        if (!$zip) { throw "Falta descargar $nombre.zip en Descargas." }
        Expand-Archive -LiteralPath $zip.FullName -DestinationPath $destino -Force
    }
    foreach ($carpeta in @("tiendapos_1", "tiendapos_frontem")) {
        if (!(Test-Path "$destino\$carpeta\VERSION_PRESTAMOS_5.json")) {
            throw "Falta el marcador nuevo en $carpeta."
        }
    }
    Write-Host "LISTO: ambos ZIP descomprimidos."
}
```

Los PS1 están dentro de los ZIP. No pegues su contenido línea por línea.

## 2. SQL nuevo en neondb

Conserva un respaldo reciente. En pgAdmin, Query Tool sobre neondb:

```sql
SELECT current_database();
SELECT version FROM public.sicom_migraciones
WHERE version='servicios-entrega-4';
```

Debe indicar neondb y devolver la versión anterior. Abre **migracion-sicom-prestamos-5.sql** y ejecuta todo el archivo, desde BEGIN hasta COMMIT. El SQL descargado y el del ZIP del backend son idénticos. No ejecutes seed.sql ni migraciones anteriores.

Comprueba:

```sql
SELECT version FROM public.sicom_migraciones
WHERE version='prestamos-entrega-5';
```

Ante error, ejecuta ROLLBACK y conserva el mensaje. Publica solo después de aplicar la migración correctamente. Es repetible; crea tablas nuevas y amplía la precisión del campo de tasa anterior sin recalcular contratos históricos.

## 3. Backend

```powershell
powershell -ExecutionPolicy Bypass -File "C:\PROYECTOS\ACTUALIZACION_SICOM_P5\tiendapos_1\PUBLICAR_BACKEND_PRESTAMOS_5.ps1"
```

Actualiza el repositorio C:\PROYECTOS\tiendapos_1, verifica archivos, conserva variables locales, hace commit si hay cambios y push. Espera backend Live en Render y revisa el arranque.

## 4. Frontend

```powershell
powershell -ExecutionPolicy Bypass -File "C:\PROYECTOS\ACTUALIZACION_SICOM_P5\tiendapos_frontem\PUBLICAR_FRONTEND_PRESTAMOS_5.ps1"
```

Actualiza C:\PROYECTOS\tiendapos_frontem, compila antes de publicar. Espera frontend Live y recarga con Ctrl+F5. Los scripts aceptan -Repositorio y -Fuente para otras rutas.

## 5. Configuración y uso

1. En Préstamos → Límites y reglas configura capital máximo sin aprobación especial, máxima tasa NOMINAL anual autorizada y fecha de vigencia. No se fija ninguna tasa legal en el código. El sistema no convierte automáticamente un límite efectivo anual en nominal.
2. Define mora nominal anual y días de gracia. Su valor se conserva en cada solicitud; cambiar la configuración no cambia contratos existentes. Sin regla vigente no se puede aprobar ni desembolsar un contrato nuevo.
3. Asigna permisos: PRESTAMOS_CONFIGURAR, PRESTAMOS_APROBAR, PRESTAMOS_DESEMBOLSAR, PRESTAMOS_RECAUDAR, PRESTAMOS_REFINANCIAR y PRESTAMOS_SOPORTES. Los roles ordinarios no reciben automáticamente estos permisos. La aprobación por encima del capital límite exige PRESTAMOS_APROBAR.
4. Si hay contabilidad activa, revisa las cuentas de CARTERA_PRESTAMOS, CAJA, BANCOS e INGRESOS_INTERESES en la configuración contable existente.
5. Simula y compara planes. Elige uno, asigna cliente y sucursal y guarda la solicitud. Aprobar todavía no mueve dinero. Desembolsar registra salida en caja o registro bancario y asiento correspondiente. Para efectivo se comprueba saldo disponible.
6. Registra abonos en Contratos y cuotas. Un abono menor que la cuota conserva su estado pendiente y muestra capital e interés pagados. Para cancelar anticipadamente elige Cancelar hoy y cobra exactamente el saldo mostrado.
7. Descarga el comprobante de cada pago y el estado de cuenta en PDF. Sube contratos y soportes JPG/PNG/PDF, máximo 5 MB.
8. Para refinanciar, el capital nuevo debe coincidir con el saldo de cancelación de hoy y la fecha inicial debe ser hoy. Se conserva el contrato anterior con estado REFINANCIADO y se enlaza el nuevo. No hay salida de dinero por el capital ya prestado. Si se trasladan intereses/mora al nuevo capital, se requiere regla habilitada y aceptación expresa; se muestra el desglose y se conserva el motivo.
9. Los contratos antiguos aparecen pendientes de revisión. Comprueba cuotas y pagos, luego Incorpora contrato revisado con permiso de aprobación y motivo. No se altera el importe pactado de cada cuota ni se reconstruyen movimientos anteriores de caja o banco. Las inconsistencias de pagos históricos bloquean la incorporación.

## Cómo calcula y aplica pagos

- Tasas NOMINALES: anual /12 para mes, /24 para quincena, /52 para semana; mensual ×12 y luego división por los períodos anuales. No son tasas efectivas ni tasas legales inferidas. El comparador muestra capital, interés total, cuota y calendario.
- Interés fijo: capital original × tasa del período. Capital constante: mismo capital amortizado por período, interés sobre saldo. Cuota fija: amortización mediante fórmula de anualidad sobre saldo. El último capital ajusta los centavos para sumar exactamente el principal. Hasta 600 cuotas; los límites técnicos de precisión no representan límites legales.
- Un abono a CUOTAS se aplica de la más antigua a la siguiente: mora pendiente, interés pactado y capital. Puede adelantar cuotas del calendario con su interés pactado. No reduce el plazo ni recalcula automáticamente intereses después de un abono extraordinario exclusivamente a capital.
- CANCELACIÓN anticipada total: capital pendiente más interés devengado y mora. El interés vencido se reconoce completo y el período en curso se prorratea por días reales entre sus fechas; el interés futuro se elimina y queda registrado como interés condonado. Un interés ya pagado no se reintegra automáticamente.
- Mora: capital vencido restante × tasa nominal anual × días /36500, después de la gracia. Considera fechas y capital aplicado de los pagos; resta mora ya cobrada. No cobra mora sobre intereses ni sobre mora. No hay cargos adicionales ocultos.
- El recaudo no se sobrescribe: se guarda cada pago y su aplicación por cuota con clave de operación. Reintentar el mismo pago no vuelve a ingresar dinero. Las correcciones/reversiones autorizadas corresponden a la parte 6.
- Transferencias: registro manual de banco/referencia, sin API bancaria ni comprobación automática del saldo real del banco. Los pagos en transferencia no ingresan al efectivo de caja.
- Los estados de cuenta muestran valores de la fecha de consulta en America/Bogota. No se permite desembolsar una solicitud cuya fecha inicial ya pasó: genera una nueva con fecha vigente.

## Históricos y reportes

La incorporación usa capital distribuido entre cuotas históricas, con ajuste final, e interés igual al importe original menos ese capital. Es una reconstrucción de componentes para contratos anteriores; se identifica como LEGADO_TOTAL y no se presenta como amortización francesa original. Solo se incorpora tras revisión autorizada. Un pago histórico marcado pagado con un importe diferente a la cuota debe conciliarse antes.

Los pagos importados se identifican HISTORICO. No se contabilizan otra vez ni se mezclan con los nuevos recaudos en el resumen. La refinanciación es una transferencia interna de deuda, no un interés cobrado en efectivo; el reporte la excluye de recaudos. Los intereses capitalizados se reconocen contablemente según el asiento configurado y quedan separados del dinero recibido.

Los endpoints antiguos de crear, pagar, sobrescribir un pago o renovar quedan bloqueados con indicación del nuevo flujo. Usa la nueva pantalla Préstamos para operar; las consultas anteriores se conservan por compatibilidad, pero su dashboard anterior de interés aproximado no es el reporte de esta entrega.

## Validación e instalación

VALIDACION_PRESTAMOS_5.json registra las verificaciones: backend, TypeScript/Vite, migración repetida en PostgreSQL/PGlite y revisión visual de comprobantes PDF. Se probaron amortización, desembolso, abonos parciales, cancelación, mora/gracia, permisos, transferencias, contabilidad, historial y refinanciación.

No se probó un despliegue en tu Render, migración sobre copia de neondb ni un recorrido completo de navegador. Después de instalar prueba: capital $1.000 al 2% nominal mensual, capital constante y 2 cuotas; debe mostrar $520 y $510. Desembolsa desde una caja con saldo, registra un abono pequeño, comprueba que la cuota siga pendiente, revisa el comprobante y el saldo de cancelación.
