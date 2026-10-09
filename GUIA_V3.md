# SICOM — Impuestos y PDF de compras (bloque V3 sobre V2)

Esta entrega contiene el bloque de impuestos y PDF de compras. No completa las 46 mejoras del plan. Se publica directamente en producción por tu decisión. Conserva las credenciales y variables de producción.

## Qué cambia

- Configuración → Facturación y fidelización → Impuestos y precios: activar/desactivar por empresa y elegir precio incluido o adicional.
- Tratamiento por producto/servicio vendido como producto y por combo: IVA, INC, exento, excluido, no aplica o sin configurar. La tarifa se escribe por artículo; el sistema no decide su clasificación legal.
- Consulta al backend antes de cobrar en POS/app de facturación, cierre de restaurante, confirmación de domicilio y conversión de cotización.
- Descuentos se aplican antes del impuesto en la modalidad adicional; en incluido se descuentan del precio final y se separa la base. Descuentos generales y canjes se distribuyen sin perder centavos.
- Cada venta conserva modalidad, base, tipo, tarifa e impuesto de sus líneas. Cambios posteriores no recalculan ventas anteriores. Las ventas históricas conservan sus valores; no se inventan impuestos retrospectivos.
- Se rechaza el cobro si cambió el total desde la previsualización.
- Devoluciones parciales conservan los centavos del documento original. Se reversan IVA/INC y se separa efectivo de reducción de cartera en el asiento contable.
- Impresión HTML y recibo por correo muestran los valores guardados. Utilidad excluye los impuestos generados; las cifras de cobro/ticket siguen representando el total al cliente.
- Compras → Órdenes → Seguimiento → Facturas → Descargar factura en PDF: descarga real, autenticada, con productos, cantidades, costos, impuestos registrados, total, pagos y saldo.
- Ver soportes originales permite descargar los adjuntos existentes de la factura o sus pagos. El PDF interno no sustituye el documento original del proveedor. Compras no guarda descuentos por separado; el PDF lo indica en lugar de inventarlos.
- Scripts de restauración con esquema public y tarea programada con ExecutionPolicy Bypass.

## Antes de publicar

1. Guarda un respaldo reciente de la base real. El respaldo de la base de pruebas no reemplaza el de producción.
2. Conserva las claves JWT_SECRET y SICOM_SECRETS_KEY de producción y su conexión DB_*.
3. Durante la publicación cierra los cobros en curso; primero actualiza SQL/backend y luego frontend. No actives impuestos hasta que ambos despliegues estén Live y los usuarios recarguen.

Para usar tu script de respaldo con producción, introduce los datos DB_HOST, DB_NAME y DB_USERNAME del backend real. La contraseña se configura en pgpass.conf de forma privada, con una entrada para esa conexión:

```powershell
$servidorProduccion = Read-Host "DB_HOST del backend de produccion"
$baseProduccion = Read-Host "DB_NAME del backend de produccion"
$usuarioProduccion = Read-Host "DB_USERNAME del backend de produccion"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\PROYECTOS\tiendapos_1\operacion\RESPALDAR.ps1" -PgBin "C:\Program Files\PostgreSQL\18\bin" -Servidor $servidorProduccion -Base $baseProduccion -Usuario $usuarioProduccion -Destino "C:\RESPALDOS_SICOM\PRODUCCION"
```

Espera el mensaje Respaldo creado. No compartas contraseñas, claves ni la conexión completa.

## 1. Extraer

Extrae AMBOS ZIP en `C:\PROYECTOS\ACTUALIZACION_SICOM_V3`. Deben quedar:

- `C:\PROYECTOS\ACTUALIZACION_SICOM_V3\tiendapos_1\pom.xml`
- `C:\PROYECTOS\ACTUALIZACION_SICOM_V3\tiendapos_frontem\package.json`

Las carpetas locales del proyecto siguen siendo `C:\PROYECTOS\tiendapos_1` y `C:\PROYECTOS\tiendapos_frontem`. No subas las carpetas descomprimidas como una subcarpeta del repositorio.

## 2. SQL en producción

Abre `migracion-sicom-v3.sql`, copia TODO y ejecútalo en la misma base de producción donde ya aplicaste V2. No ejecutes los demás SQL de los ZIP. Es una migración aditiva y transaccional, comprobada en ejecución repetida. Inicialmente deja los impuestos desactivados; repetirla conserva las decisiones guardadas por cada empresa.

Comprueba:

```sql
SELECT version, aplicada_en
FROM public.sicom_migraciones
WHERE version = 'v3-impuestos-pdf-compras';
```

Debe devolver una fila. No publiques el backend nuevo si el SQL falla.

## 3. Backend → main

```powershell
cd "C:\PROYECTOS\tiendapos_1"
& {
    git fetch origin
    if ($LASTEXITCODE -ne 0) { throw "Fallo git fetch" }
    git switch main
    if ($LASTEXITCODE -ne 0) { throw "No se pudo cambiar a main" }
    git pull --ff-only origin main
    if ($LASTEXITCODE -ne 0) { throw "No se pudo actualizar main" }
    $cambiosLocales = git status --porcelain --untracked-files=no
    if ($cambiosLocales) { throw "Hay cambios locales. Copia git status antes de continuar" }
    $fuenteBackend = "C:\PROYECTOS\ACTUALIZACION_SICOM_V3\tiendapos_1"
    if (!(Test-Path "$fuenteBackend\migracion-sicom-v3.sql")) { throw "No se encontro la actualizacion descomprimida" }
    Copy-Item "$fuenteBackend\src" -Destination "." -Recurse -Force
    Copy-Item "$fuenteBackend\operacion" -Destination "." -Recurse -Force
    Copy-Item "$fuenteBackend\migracion-sicom-v3.sql" -Destination "." -Force
    Copy-Item "$fuenteBackend\GUIA_V3.md" -Destination "." -Force
    Copy-Item "$fuenteBackend\VALIDACION_V3.json" -Destination "." -Force
    git add -- src operacion migracion-sicom-v3.sql GUIA_V3.md VALIDACION_V3.json
    if ($LASTEXITCODE -ne 0) { throw "Fallo git add" }
    git diff --cached --check
    if ($LASTEXITCODE -ne 0) { throw "Revisa el resultado antes de subir" }
    git commit -m "SICOM: impuestos configurables y PDF de compras"
    if ($LASTEXITCODE -ne 0) { throw "No se creo el commit" }
    git push origin main
    if ($LASTEXITCODE -ne 0) { throw "No se pudo subir" }
}
```

Espera Deploy succeeded | Live en rms-backend-v193. Si falla, copia el primer error de los logs. No ejecutes npm en este backend Java. Render compila con su Dockerfile. No hay nuevas dependencias Maven.

## 4. Frontend → main

La integración de la rama V2 incluida aquí también funciona si ya se integró. Si existen commits divergentes, el comando se detiene; no fuerces ni sobrescribas la historia.

```powershell
cd "C:\PROYECTOS\tiendapos_frontem"
& {
    git fetch origin
    if ($LASTEXITCODE -ne 0) { throw "Fallo git fetch" }
    git switch main
    if ($LASTEXITCODE -ne 0) { throw "No se pudo cambiar a main" }
    git pull --ff-only origin main
    if ($LASTEXITCODE -ne 0) { throw "No se pudo actualizar main" }
    git merge --ff-only origin/ensayo/sicom-v2
    if ($LASTEXITCODE -ne 0) { throw "No se pudo integrar la base V2" }
    $cambiosLocales = git status --porcelain --untracked-files=no
    if ($cambiosLocales) { throw "Hay cambios locales. Copia git status antes de continuar" }
    $fuenteFrontend = "C:\PROYECTOS\ACTUALIZACION_SICOM_V3\tiendapos_frontem"
    if (!(Test-Path "$fuenteFrontend\GUIA_V3.md")) { throw "No se encontro la actualizacion descomprimida" }
    Copy-Item "$fuenteFrontend\src" -Destination "." -Recurse -Force
    Copy-Item "$fuenteFrontend\GUIA_V3.md" -Destination "." -Force
    Copy-Item "$fuenteFrontend\VALIDACION_V3.json" -Destination "." -Force
    npm ci
    if ($LASTEXITCODE -ne 0) { throw "Fallo npm ci" }
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Fallo la compilacion" }
    git add -- src package-lock.json GUIA_V3.md VALIDACION_V3.json
    if ($LASTEXITCODE -ne 0) { throw "Fallo git add" }
    git diff --cached --check
    if ($LASTEXITCODE -ne 0) { throw "Revisa el resultado antes de subir" }
    git commit -m "SICOM: interfaz de impuestos y descarga de compras"
    if ($LASTEXITCODE -ne 0) { throw "No se creo el commit" }
    git push origin main
    if ($LASTEXITCODE -ne 0) { throw "No se pudo subir" }
}
```

Render frontend real: repositorio rms-frontend, rama main, comando npm ci && npm run build, carpeta dist, VITE_API_BASE_URL=https://rms-backend-v193.onrender.com/api. Conserva la reescritura /* → /index.html. Espera Live y recarga https://sicom-pos.onrender.com con Ctrl+F5.

## 5. Revisión en el sistema ya publicado

Primero, con impuestos desactivados: ingreso y Authenticator, permisos de contadores, abrir historial de una compra y descargar PDF/soporte existente. Compara PDF con los datos reales, incluidos abonos/saldo.

Después configura los artículos de UNA empresa desde Configuración o el formulario de producto. Si llevas contabilidad, asigna IVA_VENTAS y/o INC_VENTAS a las cuentas apropiadas antes de cobrar. El INC no se asigna automáticamente a una cuenta de IVA.

Elige incluido o adicional y activa los impuestos para esa empresa. Confirma el cálculo en pantalla sin cobrar: precio 10.000 y tarifa de ejemplo 19 % → incluido base 8.403,36, impuesto 1.596,64, total 10.000; adicional base 10.000, impuesto 1.900, total 11.900. Esos valores son ejemplos matemáticos, no una indicación de qué impuesto corresponde a cada producto.

Comprueba una venta real autorizada: impresión, caja y asiento. Verifica el cierre de restaurante, entrega de domicilio y conversión de cotización si los usas. Una devolución real debe tener motivo y autorización: nunca registres compras/ventas ficticias en producción. Compara factura anterior antes y después de cambiar una tarifa: debe conservar sus valores.

Para desactivar el cálculo nuevo de una empresa, usa la casilla de Configuración; no borra los impuestos ya registrados. No modifiques filas de ventas para probar.

## Alcance y límites

- No habilita ni certifica el envío DIAN/MATIAS. La clasificación fiscal, retenciones, otros tributos, impuestos compuestos y condiciones por contribuyente requieren bloques posteriores. Las tarifas no se asignan automáticamente según giro de negocio.
- El precio del combo lleva su regla explícita; no se deduce un impuesto combinado de sus componentes. Clasifica el combo antes de activarlo.
- Servicios facturados directamente en el módulo de citas/órdenes y préstamos no se convirtieron al nuevo motor; sí están cubiertos los servicios vendidos como producto desde POS.
- Cotizaciones: el importe fiscal se recalcula y se muestra al convertir a venta. La generación inicial del documento de cotización sigue con su formato anterior.
- Las utilidades siguen siendo estimaciones del modelo existente; esta entrega corrige el impuesto incluido en ingresos, no completa una conciliación de devoluciones, propinas y costos de combos.
- Si el mismo artículo tiene distintos precios en un pedido, la agrupación se detiene para revisar el pedido antes de cobrar.
- No modifica facturas históricas de compra para reconstruir descuentos o tributación por línea. El PDF toma el subtotal e impuesto registrado existentes.
- Validación: 32 pruebas unitarias, backend empaquetado con Java 21, TypeScript/Vite compilados, SQL aplicado repetidamente en motor compatible PostgreSQL (PGlite), preservación de configuración por empresa y PDF renderizado/revisado. No se ejecutó aquí contra tu Neon de producción ni se verificó una sesión completa de navegador en Render.

## Si debes volver al código anterior

Primero desactiva impuestos nuevos para todas las empresas donde los activaste. Conserva la base y las ventas reales. Revertir código no deshace movimientos reales ni impuestos ya contabilizados.

Si todavía no registraste ventas con impuestos activos, identifica los commits nuevos con git log --oneline -5 en CADA repositorio. Puedes revertir primero el commit de frontend y esperar Live; después el de backend. Usa git revert CODIGO_DEL_COMMIT y git push origin main. No uses reset --hard ni borres columnas. La migración aditiva puede conservarse.

Si ya existen ventas con impuestos activos, conserva el backend de esta versión para interpretar sus impuestos y devoluciones. Desactiva la función para ventas nuevas y revisa el error antes de decidir una reversión de código. No restaures una copia anterior sobre ventas nuevas.
