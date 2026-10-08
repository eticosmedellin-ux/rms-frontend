# SICOM V2 — primera entrega de ensayo

Fecha: 8 de octubre de 2026.

## Estado y alcance real

Este paquete NO completa las 46 mejoras acordadas ni está validado para reemplazar producción. Contiene el primer bloque de autenticación, habilitación de contadores, compras, soportes, doble factor y scripts de respaldo. Conserva las funciones de facturación y puntos de la entrega anterior.

Los archivos se basan en los proyectos proporcionados y en las correcciones de autenticación realizadas en la conversación. No se descargó una versión posterior de GitHub ni se modificaron Render o la base conectada.

## Qué cambió

- La búsqueda por usuario carga empresa, roles y permisos. Las rutas públicas de login y noticias no procesan el token almacenado. Los errores internos no se sustituyen automáticamente por un 401 en el despacho de error.
- El frontend no adjunta tokens ni intenta renovar sesión ante errores del login. Se conserva la configuración CORS por dominio.
- «Mis clientes contables» requiere usuario activo, identificado como contador y habilitado por el superadministrador. Se comprueba en menú, página, listado del backend y consultas externas de contabilidad. La empresa cliente sigue concediendo acceso a sus propios datos.
- Plataforma → Contadores permite identificar y habilitar cuentas, con auditoría de la modificación.
- Las órdenes y facturas validan empresa, proveedor, sucursal y productos. Las órdenes usan un contador transaccional inicializado desde los números existentes.
- La recepción exige una orden enviada o parcialmente recibida, la misma sucursal, productos incluidos y cantidades pendientes. Una orden parcialmente recibida no se puede cancelar mediante el botón general. La autorización para excesos no está implementada: se bloquean.
- La recepción precarga pendientes. Registrar factura desde una orden precarga cantidades recibidas aún no facturadas. El backend vuelve a comprobarlas. Los costos se precargan como estimados y deben verificarse contra la factura real.
- Las facturas se vinculan a la orden. La compra rápida opcional crea recepción y factura en la misma transacción. Si falla el pago o la factura, la transacción revierte también la recepción.
- Se crea una cuenta asociada a cada nueva factura para conservar el ciclo de pagos, incluso cuando se salda de contado. Las facturas a crédito pueden tener abono inicial. Las compras de contado exigen registrar el pago completo.
- Los pagos en efectivo requieren caja abierta. Transferencias y cheques se contabilizan en el concepto BANCOS, no CAJA. La selección de una cuenta bancaria contable específica queda pendiente; esta versión usa el mapeo general configurado.
- Un bloqueo de fila protege el saldo de cuentas por pagar frente a abonos simultáneos. Se rechazan importes no positivos o superiores al saldo. Se sincroniza el estado de la factura.
- Historial por orden: recepciones, facturas y pagos con responsables. Historial por proveedor: cuentas saldadas y pendientes, abonos y soportes.
- Se pueden adjuntar PDF, JPG y PNG a la factura y a cada abono, con captura desde móvil. Máximo 5 MB; imágenes de hasta 4096 píxeles por lado. Se guardan en PostgreSQL, descargables mediante autenticación y verificación de empresa. No hay análisis antivirus ni OCR.
- Plataforma → Seguridad: configuración opcional de TOTP para el superadministrador, secreto cifrado AES-GCM, códigos de recuperación de un uso y rechazo de códigos TOTP reutilizados. La activación cambia la versión de seguridad de las sesiones anteriores. Requiere validar el flujo completo en ensayo antes de activarlo en la cuenta principal.
- MATIAS: interpretación de la respuesta documentada, comprobando success, IsValid y StatusCode; CUFE aislado no significa aceptación. Usa las URLs devueltas, no las inventa. Una factura aceptada no se reenvía. Un resultado incierto queda POR_CONFIRMAR y bloquea el reenvío manual.
- El envío MATIAS está deshabilitado por defecto. El payload fiscal completo, impuestos y validación real en Sandbox siguen pendientes. No activar SICOM_FE_ENVIO_HABILITADO en producción.
- Dependencias: actualización compatible sin --force. Auditoría final: 9 avisos (5 altos, 4 moderados); pendientes Tailwind y React Router, entre otros paquetes transitivos.
- Scripts Windows para respaldo, programación y prueba de restauración separada. No se ejecutaron en el equipo del usuario.

## Verificaciones realizadas

- Java 21: compilación, empaquetado Maven y 18 pruebas unitarias aprobadas.
- TypeScript y Vite: compilación aprobada.
- SQL: esquema de ensayo + migración anterior + nueva migración; cada migración aplicada dos veces en PGlite.
- PGlite verifica estructura SQL; no valida las consultas Hibernate, el driver JDBC ni concurrencia de PostgreSQL nativo.
- Pendientes: integración completa con PostgreSQL 18 nativo, pruebas visuales de navegador, concurrencia con carga, Windows PowerShell y restauración real, TOTP completo en una aplicación desplegada, MATIAS Sandbox.

## Preparar el ensayo

1. Conserva una copia de las dos carpetas actuales y un respaldo de la base.
2. Crea una base aislada, preferentemente una copia en un entorno privado. No uses la conexión de producción. Evita copiar datos personales a un entorno accesible públicamente.
3. Crea servicios de backend/frontend de pruebas en Render, con sus propias variables, URL y base. Puedes usar una rama de ensayo en cada repositorio.
4. Extrae los ZIP en un directorio temporal. Cada uno incluye una carpeta raíz: tiendapos_1 o tiendapos_frontem.
5. Copia el CONTENIDO de esas carpetas al proyecto de ensayo, conservando .git y .env propios del ensayo. No copies la carpeta raíz dentro de otra carpeta con el mismo nombre.
6. No copies node_modules, dist ni target. Los ZIP ya los excluyen.

Si la base de ensayo es una copia de la base actual y ya tiene la primera actualización, ejecuta únicamente `migracion-sicom-v2.sql`. Si todavía no tiene las tablas sicom de la entrega anterior, aplica primero `migracion-sicom-actualizacion.sql` y luego `migracion-sicom-v2.sql`. No ejecutes todos los archivos migracion-*.sql del proyecto.

La migración V2 añade columnas y tablas. No borra ventas ni restablece contraseñas. Es requisito antes de arrancar este backend: Hibernate usa ddl-auto=validate.

La reversión del código requiere conservar estas columnas/tablas; no eliminarlas después de que existan datos. La recuperación completa de una base modificada debe planificarse y probarse desde un respaldo separado.

## Variables del backend de ensayo

Conserva los nombres DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD y DB_SSL_MODE, apuntando a la base AISLADA. Configura:

- JWT_SECRET: clave propia del ensayo, suficientemente larga. No publicar ni compartir su valor.
- CORS_ORIGINS: URL exacta del frontend de ensayo, sin barra final.
- FRONTEND_URL: URL del frontend de ensayo.
- SICOM_FE_ENVIO_HABILITADO=false.
- SICOM_SECRETS_KEY: necesaria solo si pruebas la activación de doble factor; clave AES de 32 bytes codificada en Base64. Conservarla de forma privada junto con la estrategia de recuperación.

Para generar la clave de cifrado en tu PowerShell, sin una clave fija compartida:

```powershell
$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$rng.Dispose()
[Convert]::ToBase64String($bytes)
```

Copia el resultado únicamente en la variable del backend de ensayo. No lo envíes por chat ni lo subas a Git. Cambiar esa clave impide descifrar los secretos TOTP anteriores.

Frontend de ensayo: VITE_API_BASE_URL debe ser la URL del backend de ensayo terminada en /api.

## Compilar desde PowerShell

Dentro de la carpeta frontend de ENSAYO:

```powershell
npm ci
npm run build
```

Dentro del backend de ENSAYO, con Java 21 y Maven instalados:

```powershell
java -version
mvn test
mvn package
```

El backend usa Java. No ejecutar npm en tiendapos_1. Los comandos de compilación no publican el sistema.

Para enviar a una rama de ensayo, primero comprueba si ya existe y si Render apunta a ella. No publiques esta entrega en main:

```powershell
git status
git switch -c ensayo/sicom-v2
```

Después revisa los cambios. En backend se deben incluir src, la migración V2 y operacion; en frontend src y package-lock.json. Comprueba que no se incluyan .env ni subcarpetas duplicadas. El commit y push a la rama de ensayo se realizan solo después de pasar las comprobaciones. No incluimos un bloque de publicación automática de producción.

## Pruebas funcionales de compras

1. Usa empresa, proveedor y productos ficticios de ensayo.
2. Crea orden de 10 unidades y confírmala (estado ENVIADA; no es un correo automático).
3. Recibe 6. Verifica +6 en inventario/Kardex y 4 pendientes.
4. Intenta recibir más de 4: debe rechazarlo sin modificar existencias.
5. Registra factura a crédito desde la orden por las 6 recibidas. Verifica cuenta por pagar, vencimiento y relación con la orden. Inventario no debe aumentar otra vez.
6. Intenta facturar esas mismas 6 con otro número: debe rechazarlo por superar lo recibido pendiente de facturar.
7. Registra abono por transferencia. Verifica saldo, estado PARCIAL y concepto BANCOS en contabilidad si el módulo está habilitado.
8. Adjunta PDF de factura y foto de abono. Descarga y compara los archivos.
9. Completa el pago. Verifica factura PAGADA y cuenta en historial, aunque desaparezca de pendientes.
10. Recibe las otras 4 y registra su factura. Verifica seguimiento de la orden.
11. Prueba compra rápida sin orden con 3 unidades. Inventario aumenta 3 una sola vez; se crea factura y el pago seleccionado.
12. Fuerza un error controlado usando un pago en efectivo sin caja abierta: la compra rápida debe fallar sin dejar recepción, factura o aumento de stock.
13. Dos usuarios intentan abonar el mismo saldo a la vez: uno debe quedar rechazado cuando ya no existe saldo suficiente.
14. Intenta acceder por ID desde otra empresa: debe rechazar la consulta y descarga.

No hay fecha ni referencia bancaria personalizable en el nuevo abono: se conserva la fecha de registro del modelo actual. Esas mejoras siguen pendientes. Tampoco hay reverso de pago a proveedor ni devolución de compra en esta entrega.

## Pruebas de contadores y acceso

- Usuario común: menú contable externo oculto y API denegada.
- Cuenta marcada contador sin habilitar: igual.
- Cuenta habilitada y activa: menú disponible después de volver a ingresar. Solo ve empresas que le concedieron acceso.
- Revoca habilitación desde superadmin: las consultas deben quedar rechazadas aunque el navegador conserve el menú antiguo.
- Ingreso habitual y por perfiles; usuario inactivo; empresa suspendida; renovación de sesión; noticias públicas.
- Doble factor: usar cuenta superadmin de ensayo, guardar códigos de recuperación, salir y entrar con TOTP; rechazar código erróneo/reutilizado; usar un código de recuperación y comprobar que no se reutiliza. Verificar rechazo de tokens anteriores tras activar MFA.

## Respaldos Windows

Los scripts están en tiendapos_1/operacion. Requieren herramientas PostgreSQL compatibles con la versión del servidor, acceso de red y credenciales con permisos de lectura.

Guarda las credenciales en `%APPDATA%\postgresql\pgpass.conf`, protegido para tu usuario, con formato `servidor:puerto:base:usuario:contraseña`. No adjuntes ese archivo, no lo subas a Git y no lo incluyas en los ZIP. Conserva los respaldos con permisos privados y una copia adicional fuera del equipo.

Primero ejecuta RESPALDAR.ps1 manualmente con parámetros PgBin, Servidor, Base y Usuario. Genera dump custom y checksum; no elimina respaldos previos si falla. La retención predeterminada es 14 días.

PROGRAMAR_RESPALDO.ps1 crea una tarea diaria a las 23:00. Debes comprobar su último resultado en el Programador de tareas. El equipo debe estar encendido y la cuenta disponible; no funciona como respaldo autónomo de la nube.

PROBAR_RESTAURACION.ps1 exige una base NUEVA, VACÍA y con nombre sicom_pruebas_*. No usa --clean ni crea bases. Verifica checksum, restaura en una transacción y consulta usuarios, ventas y productos. Eso es una comprobación básica: falta abrir el sistema con esa base y validar operaciones.

## Alcance de 46: seguimiento

| N.º | Mejora | Estado de esta entrega |
|---:|---|---|
|1|Acceso, roles y permisos|Correcciones implementadas; integración pendiente|
|2|Mensajes de errores|Mejoras parciales|
|3|Contadores habilitados|Implementado; prueba funcional pendiente|
|4|Perfil tributario por empresa|Pendiente|
|5|Impuestos por producto/servicio|Pendiente|
|6|Cálculos y precios con impuestos|Pendiente|
|7|Historial fiscal completo|Pendiente; se conservan importes originales existentes|
|8|Tipos de documentos fiscales|Pendiente de integración|
|9|Validación electrónica y resolución|Respuesta reforzada; payload y validación real pendientes|
|10|Notas crédito electrónicas|Pendiente|
|11|Datos personales y autorizaciones|Pendiente|
|12|Promociones y puntos|Funciones anteriores conservadas; revisión completa pendiente|
|13|Arqueo y cierre de caja|Funciones existentes; mejoras pendientes|
|14|Conteos, mínimos y ajustes|Funciones existentes; revisión pendiente|
|15|Atajos y búsqueda|Funciones existentes; mejora pendiente|
|16|Superadministrador|Panel de contadores y seguridad añadido; resto pendiente|
|17|Diseño|Formularios y pestañas nuevas; rediseño general pendiente|
|18|Entorno separado|Guía; servicios no provisionados|
|19|Respaldos y restauración|Scripts Windows; ejecución y verificación pendientes|
|20|Dependencias|17 a 9 avisos; migraciones mayores pendientes|
|21|Doble factor|Implementado; prueba funcional completa pendiente|
|22|Aprobaciones por límites|Pendiente; excesos de recepción bloqueados|
|23|Cola electrónica|Pendiente; resultados inciertos bloquean reenvíos|
|24|Conciliación|Pendiente|
|25|Lotes y vencimientos|Pendiente|
|26|Mesas, división y propinas|Funciones existentes; revisión y cambios pendientes|
|27|Aislamiento|Validaciones de compras añadidas; cobertura global pendiente|
|28|Pruebas completas|18 unitarias; flujo completo y navegador pendientes|
|29|Integridad transaccional|Compra rápida transaccional; prueba nativa pendiente|
|30|Duplicados y concurrencia|Controles de facturas, saldos y consecutivos; idempotencia global y carga pendientes|
|31|Migraciones y recuperación|Registro de versión y guía; recuperación real pendiente|
|32|Credenciales y sesiones|TOTP cifrado y versiones de sesión; migración global de tokens/API keys pendiente|
|33|Archivos persistentes|Soportes de compras en PostgreSQL; resto por revisar|
|34|Auditoría, reversos, crédito, monitoreo|Habilitación auditada; cobertura restante pendiente|
|35|Flujo guiado compras|Implementado; ensayo funcional pendiente|
|36|Recepción precargada|Implementado|
|37|Recepciones parciales y adicionales|Parciales y límites implementados; aprobación de excesos pendiente|
|38|Factura desde orden|Implementado; selección de recepción individual pendiente|
|39|Cuenta por pagar automática|Implementado|
|40|Contado y abono inicial|Implementado; ensayo contable pendiente|
|41|Soportes y captura|Implementado; prueba de móvil pendiente|
|42|Historial completo|Orden y proveedor implementados; detalle de líneas de recepción pendiente|
|43|Estados, saldos y vencimientos|Implementado para nuevas facturas; saneamiento histórico pendiente|
|44|Caja y bancos|Conceptos contables corregidos; selección de cuenta específica pendiente|
|45|Validaciones de compras|Implementadas varias; idempotencia total y prueba de carga pendientes|
|46|Compra rápida|Implementado; integración nativa pendiente|

La revisión del nombre SICOM y su eventual registro/cambio queda fuera del código de esta entrega.
