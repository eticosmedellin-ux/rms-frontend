# SICOM — Bloque 1: impuestos, droguerías y comercios

Base de esta entrega: V3 (impuestos individuales y PDF de compras). Publicación directa en producción, conforme al método elegido. No cambia las variables privadas de Render ni los archivos .env.

## Qué incluye

- Impuestos masivos para todos los productos activos, una categoría con sus subcategorías o una selección por ID. Vista previa de hasta 20 ejemplos y cantidad total; protección de excepciones individuales, auditoría y comprobación de que el catálogo no cambió desde la vista previa.
- Jerarquía de categorías y regla de impuesto para productos nuevos o importados. Los productos individuales ya configurados en V3 se conservan como excepciones. Cambiar la regla no modifica automáticamente productos existentes: utiliza aplicación masiva.
- Inventario por lotes, vencimientos, salida por el lote que vence primero, bloqueo de vencidos y cuarentena, trazabilidad de ventas, devoluciones y transferencias.
- Distribución del stock existente por lotes reales, sin aumentar el inventario. Activación solo cuando las cantidades distribuidas coincidan en cada sucursal.
- Ficha de medicamento: principio activo, concentración, laboratorio, presentación y registro sanitario. Estos datos los registra el negocio; no hay consulta automática a INVIMA.
- Recepción técnica: condiciones, cantidades aceptadas y rechazadas, motivo, lote y vencimiento. Los rechazos no entran al inventario; se permite registrar rechazo completo con cantidad aceptada cero.
- Presentaciones equivalentes: compra y venta en unidades base, conversión en recepción y selector de presentaciones en POS. Lectura de códigos de barras de productos y presentaciones.
- Temperatura y humedad: registro manual y alertas visuales según los límites de la ficha. No se conecta a sensores ni envía avisos automáticos.
- Soporte de fórmula PDF/JPG/PNG hasta 5 MB: obligatorio al cobrar productos marcados; descarga restringida al administrador y auditada. El sistema registra el soporte, no evalúa clínicamente su contenido.
- Variantes por talla/color: cada variante es un producto con inventario, precio y código de barras propios. Se vincula a un producto base; no se crea stock duplicado al vincular.
- Reservas con cliente, sucursal, vencimiento y cantidades. Las salidas no pueden consumir existencias reservadas; una reserva vencida libera automáticamente la disponibilidad. Al cobrar se validan cliente, sucursal y cantidades exactas.
- Listas de precios preparadas y publicadas por administrador: publicación reemplaza precios del catálogo para ventas nuevas. No selecciona una tarifa distinta por cliente durante el cobro.
- Cambio de mercancía integrado: devolución y nueva venta en una transacción, liquidación de diferencia en efectivo, auditoría y clave para impedir duplicación al reintentar la misma operación.

## Límites que debes conocer

- Medicamentos de control especial y atención clínica no están habilitados por esta entrega; requieren alcance específico. No constituye certificación de cumplimiento sanitario ni tributario.
- Los impuestos los define el administrador según la clasificación aplicable; el nombre de una categoría no determina una tarifa legal.
- Los vencidos se bloquean desde su fecha de vencimiento, usando fecha de Colombia. Una devolución de producto controlado por lote entra en cuarentena y requiere revisión del administrador para liberarla.
- Si una venta ocurrió antes de activar lotes, no hay lote histórico que pueda reconstruirse: la devolución automática de ese producto queda bloqueada para revisión. No inventamos trazabilidad anterior.
- Ajustes positivos y conteos que aumenten stock de productos con lotes requieren una entrada identificada por lote; los formularios generales no pueden crear existencias sin esa identificación. Usa recepción de compra para registrar una entrada con lote y costo verificable.
- El cambio integrado admite originales de contado y liquidación en efectivo. Para ventas a crédito, combos, soporte de fórmula u otros medios de liquidación utiliza devolución y nueva venta en POS, revisando cartera y caja.
- Las presentaciones multiplican cantidades en unidades base. En compras revisa el costo unitario convertido y su redondeo antes de confirmar. Las órdenes se registran en unidades base; no mezcles cajas con unidades en la cantidad pedida.
- Permisos: se mantienen los módulos por empresa. Impuestos masivos, fichas, estados de lotes, variantes, listas, cambios y descarga de soportes requieren administrador. Operadores con permisos de compras/ventas pueden recibir y vender mediante los flujos existentes.
- No se implementan recordatorios, rutas de cobro, funciones de restaurante ni mejoras de préstamos: pertenecen al segundo bloque.

## 1. Preparación

Conserva un respaldo reciente de la base de PRODUCCIÓN. Los respaldos anteriores de pruebas no sustituyen un respaldo actual de producción.

Descomprime ambos ZIP en C:\PROYECTOS\ACTUALIZACION_SICOM_B1. Deben quedar:

- C:\PROYECTOS\ACTUALIZACION_SICOM_B1\tiendapos_1\pom.xml
- C:\PROYECTOS\ACTUALIZACION_SICOM_B1\tiendapos_frontem\package.json

También se admiten las subcarpetas anidadas que utilizaste antes; los comandos solo las usan si contienen GUIA_BLOQUE_1.md de esta entrega.

## 2. PostgreSQL primero

En pgAdmin abre Query Tool de la base de producción neondb. Ejecuta:

```sql
SELECT current_database();
SELECT version FROM public.sicom_migraciones WHERE version='v3-impuestos-pdf-compras';
```

Debe mostrar neondb y la versión V3. Copia TODO migracion-sicom-bloque-1.sql, desde BEGIN hasta COMMIT, y ejecuta F5 sin selección parcial. Solo aplica este SQL nuevo; no ejecutes seed.sql ni todas las migraciones.

Comprueba:

```sql
SELECT version, aplicada_en
FROM public.sicom_migraciones
WHERE version='bloque-1-impuestos-drogueria-comercio';
```

Debe devolver una fila. La migración es transaccional y se comprobó su reejecución; repetirla no restablece excepciones modificadas posteriormente.

## 3. Backend — PowerShell

```powershell
cd "C:\PROYECTOS\tiendapos_1"
& {
    $ErrorActionPreference = "Stop"
    $fuente = "C:\PROYECTOS\ACTUALIZACION_SICOM_B1\tiendapos_1"
    if (!(Test-Path "$fuente\GUIA_BLOQUE_1.md")) { $fuente = "C:\PROYECTOS\tiendapos_1\tiendapos_1" }
    if (!(Test-Path "$fuente\GUIA_BLOQUE_1.md")) { throw "No se encontro el ZIP nuevo descomprimido." }
    git fetch origin
    if ($LASTEXITCODE -ne 0) { throw "Fallo git fetch." }
    git switch main
    if ($LASTEXITCODE -ne 0) { throw "No se pudo cambiar a main." }
    git pull --ff-only origin main
    if ($LASTEXITCODE -ne 0) { throw "No se pudo actualizar main." }
    $cambios = git status --porcelain --untracked-files=no
    if ($cambios) { git status; throw "Hay cambios locales. Copia el resultado antes de continuar." }
    Copy-Item "$fuente\src" -Destination "." -Recurse -Force
    Copy-Item "$fuente\operacion" -Destination "." -Recurse -Force
    Copy-Item "$fuente\migracion-sicom-bloque-1.sql" -Destination "." -Force
    Copy-Item "$fuente\GUIA_BLOQUE_1.md" -Destination "." -Force
    Copy-Item "$fuente\VALIDACION_BLOQUE_1.json" -Destination "." -Force
    git add -- src operacion migracion-sicom-bloque-1.sql GUIA_BLOQUE_1.md VALIDACION_BLOQUE_1.json
    if ($LASTEXITCODE -ne 0) { throw "Fallo git add." }
    git diff --cached --check
    if ($LASTEXITCODE -ne 0) { throw "Copia el resultado de la revision." }
    git commit -m "SICOM bloque 1: impuestos, lotes y comercios"
    if ($LASTEXITCODE -ne 0) { throw "No se creo el commit. Copia el resultado." }
    git push origin main
    if ($LASTEXITCODE -ne 0) { throw "No se pudo subir. Copia el resultado." }
}
```

Espera Deploy succeeded | Live en rms-backend-v193 de producción. No uses npm para este backend Java/Docker.

## 4. Frontend — PowerShell

```powershell
cd "C:\PROYECTOS\tiendapos_frontem"
& {
    $ErrorActionPreference = "Stop"
    $fuente = "C:\PROYECTOS\ACTUALIZACION_SICOM_B1\tiendapos_frontem"
    if (!(Test-Path "$fuente\GUIA_BLOQUE_1.md")) { $fuente = "C:\PROYECTOS\tiendapos_frontem\tiendapos_frontem" }
    if (!(Test-Path "$fuente\GUIA_BLOQUE_1.md")) { throw "No se encontro el ZIP nuevo descomprimido." }
    git fetch origin
    if ($LASTEXITCODE -ne 0) { throw "Fallo git fetch." }
    git switch main
    if ($LASTEXITCODE -ne 0) { throw "No se pudo cambiar a main." }
    git pull --ff-only origin main
    if ($LASTEXITCODE -ne 0) { throw "No se pudo actualizar main." }
    $cambios = git status --porcelain --untracked-files=no
    if ($cambios) { git status; throw "Hay cambios locales. Copia el resultado antes de continuar." }
    Copy-Item "$fuente\src" -Destination "." -Recurse -Force
    Copy-Item "$fuente\GUIA_BLOQUE_1.md" -Destination "." -Force
    Copy-Item "$fuente\VALIDACION_BLOQUE_1.json" -Destination "." -Force
    npm ci
    if ($LASTEXITCODE -ne 0) { throw "Fallo npm ci." }
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Fallo la compilacion. Copia el error." }
    git add -- src GUIA_BLOQUE_1.md VALIDACION_BLOQUE_1.json
    if ($LASTEXITCODE -ne 0) { throw "Fallo git add." }
    git diff --cached --check
    if ($LASTEXITCODE -ne 0) { throw "Copia el resultado de la revision." }
    git commit -m "SICOM bloque 1: interfaz de drogueria y comercios"
    if ($LASTEXITCODE -ne 0) { throw "No se creo el commit. Copia el resultado." }
    git push origin main
    if ($LASTEXITCODE -ne 0) { throw "No se pudo subir. Copia el resultado." }
}
```

Espera Live en sicom-pos. El repositorio es rms-frontend; conserva VITE_API_BASE_URL apuntando al backend de producción. No copies .env del ZIP ni cambies claves privadas.

## 5. Comprobación después de implementar

1. Ctrl+F5, ingreso y PDF de compras anterior.
2. Configuración → impuestos → aplicación masiva. Las clasificaciones anteriores se conservaron como excepciones: marca reemplazo solo cuando quieras cambiarlas. Genera vista previa antes de aplicar.
3. Selecciona categoría, jerarquía y regla; crea un producto sin clasificación propia y confirma herencia. Prueba excepción individual.
4. Inventario → Droguería y lotes. Registra ficha. Si hay stock, distribúyelo por sus lotes reales en cada sucursal y luego activa control. No activar lotes indiscriminadamente a todo el catálogo.
5. Compras → recibir orden: cantidades aceptadas en unidades base, lote, fecha y condiciones. Confirma que solo las aceptadas entran al inventario.
6. Comprueba que vencidos y cuarentena no pueden venderse; usa el historial del lote para identificar las salidas. Las devoluciones se conservan en cuarentena.
7. Registra lectura fuera del rango configurado y revisa alerta. Guarda presentación y comprueba cantidad y precio en POS.
8. Para producto que requiera fórmula, el cobro debe bloquearse sin soporte. Adjunta archivo real cuando corresponda y comprueba descarga con administrador.
9. Inventario → Variantes y reservas: vincula variantes existentes. Verifica que cada una conserve su stock y código.
10. Crea reserva de cliente; comprueba disponibilidad y selección al cobrar las cantidades exactas en POS. Cancelación y vencimiento liberan disponibilidad.
11. Prepara lista de precios, compara precio actual y nuevo, publica y comprueba el catálogo. Las ventas históricas conservan su precio.
12. Cambio integrado: abre caja en la sucursal, consulta venta de contado, selecciona producto devuelto y reemplazo, calcula y confirma. Comprueba devolución, nueva venta y diferencia real en caja. Para otros casos usa devolución y venta en POS.
13. Comprueba con cuentas de empresas diferentes que no puedan consultar o modificar fichas, lotes, reservas, listas o soportes ajenos.

## Validación realizada antes de entregar

Compilación Java/Maven y pruebas automatizadas; TypeScript y Vite; migración sobre motor PostgreSQL embebido, aplicada repetidamente sobre la estructura existente; selección de lotes válidos y conservación de excepciones al repetir SQL. El archivo VALIDACION_BLOQUE_1.json contiene el resultado concreto. No se ha ejecutado esta entrega en tu Render ni sobre tu base de producción; los pasos anteriores comprueban esa instalación real.

## Recuperación ante un error

Conserva los commits anteriores. Si ya registraste movimientos por lote, reservas aplicadas o cambios de mercancía, no reviertas al backend V3: no interpreta esas operaciones. Conserva el esquema y corrige el error con sus registros. No borres tablas ni restaures un respaldo encima de ventas nuevas sin conciliarlas. Copia el error exacto de Render o del navegador para diagnosticarlo.
