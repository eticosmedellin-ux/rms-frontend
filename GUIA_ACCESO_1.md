# SICOM — nueva actualización, parte 1 de 6

Entrega: **acceso por empresa, selección de perfiles y permisos**. Requiere Préstamos 6 instalada y su SQL `prestamos-entrega-6`. Los ZIP contienen los proyectos completos y las actualizaciones anteriores. Se conserva el diseño de los módulos; se cambia la pantalla de ingreso aprobada.

## Archivos y orden

1. Descarga ambos ZIP y el SQL independiente en Descargas.
2. En pgAdmin, abre Query Tool sobre **neondb**, abre `migracion-sicom-acceso-1.sql` y ejecuta el archivo completo. Si exige Préstamos 6, falta esa migración: detente y completa esa instalación. Esta entrega no reconstruye una base vacía.
3. Publica backend con el comando siguiente. Espera que Render termine y muestre **Live**.
4. Publica frontend con su comando. Espera **Live** y comprueba el ingreso.

Los PS1 también se entregan por separado y están dentro de cada ZIP. Los comandos siguientes usan los PS1 incluidos para evitar que falte el script en Descargas. Pega cada bloque COMPLETO; no pegues el contenido del PS1 línea por línea. Cada publicación valida el marcador y hashes ANTES de copiar o subir. Un error detiene todo el bloque; “Everything up-to-date” por sí solo no demuestra una actualización.

### Backend

```powershell
& {
    $ErrorActionPreference = "Stop"
    $destino = "C:\PROYECTOS\ACTUALIZACION_SICOM_A1"
    $zip = Get-ChildItem (Join-Path $env:USERPROFILE "Downloads") -File |
        Where-Object { $_.Name -like "tiendapos_1_acceso_1*.zip" } |
        Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (!$zip) { throw "Descarga tiendapos_1_acceso_1.zip en Descargas." }
    Expand-Archive -LiteralPath $zip.FullName -DestinationPath $destino -Force
    powershell -ExecutionPolicy Bypass -File "$destino\tiendapos_1\PUBLICAR_BACKEND_ACCESO_1.ps1"
    if ($LASTEXITCODE -ne 0) { throw "Backend detenido. Copia el error; no continues con frontend." }
}
```

### Frontend — después de backend Live

```powershell
& {
    $ErrorActionPreference = "Stop"
    $destino = "C:\PROYECTOS\ACTUALIZACION_SICOM_A1"
    $zip = Get-ChildItem (Join-Path $env:USERPROFILE "Downloads") -File |
        Where-Object { $_.Name -like "tiendapos_frontem_acceso_1*.zip" } |
        Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (!$zip) { throw "Descarga tiendapos_frontem_acceso_1.zip en Descargas." }
    Expand-Archive -LiteralPath $zip.FullName -DestinationPath $destino -Force
    powershell -ExecutionPolicy Bypass -File "$destino\tiendapos_frontem\PUBLICAR_FRONTEND_ACCESO_1.ps1"
    if ($LASTEXITCODE -ne 0) { throw "Frontend detenido. Copia el error." }
}
```

Los scripts usan `C:\PROYECTOS\tiendapos_1` y `C:\PROYECTOS\tiendapos_frontem`, rama main. No copian claves ni variables. Necesitan Git y, en frontend, Node/npm. Si hay cambios locales registrados, se detienen para conservarlos. No eliminan carpetas antiguas descargadas. La guía no ejecuta automáticamente el SQL en producción ni modifica variables de Render.

## Primer ingreso y uso

- Abre `/login` en la dirección actual de SICOM. Ya no hace falta un enlace privado de empresa para ver sus perfiles.
- Primer ingreso de empresa: usuario y contraseña del **Administrador General existente**. Si tiene doble factor, escribe su código. Solo este administrador puede inicializar la cuenta de empresa; un empleado o superadministrador no puede hacerlo mediante este formulario.
- Después aparece la selección de empleados y administradores activos. Selecciona uno y escribe **su contraseña personal** y doble factor si está activado. La contraseña de empresa no sustituye las contraseñas personales.
- “Recordar empresa” conserva el acceso durante 30 días en ese dispositivo; sin marcarlo, se guarda en la sesión del navegador por hasta 12 horas. No se guarda la contraseña.
- “Cambiar perfil / salir” cierra el usuario y vuelve a perfiles. “Cerrar sesión de empresa / cambiar empresa” elimina y revoca el acceso de empresa guardado.
- En **Configuración → Cuenta de empresa y perfiles**, el Administrador General puede establecer una cuenta y contraseña de empresa independientes. Cambiarlas invalida los accesos de empresa recordados. Las sesiones personales ya abiertas conservan su ciclo de autenticación existente.
- `/acceso-general` queda para Administrador General y superadministrador. Los enlaces antiguos de perfiles ya no muestran usuarios sin autenticar a la empresa.

## Permisos del empleado

En **Administración → Roles**, configura por separado Restaurante, Servicios Citas, Servicios Órdenes y Préstamos. Asigna el rol al usuario y sus sucursales en Usuarios. El empleado debe salir y volver a ingresar para renovar la interfaz; el backend verifica sus roles vigentes en cada petición.

| Permiso | Qué permite |
| --- | --- |
| Consultar | Leer el módulo, junto con un alcance válido |
| Operar | Registrar y actualizar operaciones normales; también necesita Consultar para usar la pantalla |
| Ver propios | Comandas del mesero, citas/órdenes asignadas, cotizaciones del empleado o creador, contratos creados y préstamos asignados a rutas abiertas del cobrador |
| Ver sucursal | Registros de las sucursales asignadas en Usuarios |
| Ver empresa | Registros de toda su empresa; no de otras empresas |
| Ver reportes | Informes administrativos, junto con Ver empresa |
| Ver costos | Costos y márgenes; estos campos se retiran de las respuestas si falta este permiso |
| Administrar | Configuración, aprobación/desembolso, refinanciación, anulaciones, reversión y secciones administrativas sensibles; no sustituye otros permisos específicos existentes |

El Administrador General y el superadministrador conservan sus facultades existentes. No se conceden los permisos nuevos automáticamente a roles de empleados.

**Alcance de la consulta:** listas y detalles operativos principales se restringen en el backend. Mesas y reservas son recursos compartidos de sucursales asignadas. Secciones que agregan información de toda la empresa (bancos, comisiones, seguimiento global, paquetes, liquidaciones, estadísticas y controles de cartera) requieren Ver empresa; las administrativas requieren además Administrar, y reportes/costos sus permisos correspondientes. No se presentan esos agregados como si fueran informes parciales del empleado. Un permiso nuevo no reemplaza las autorizaciones específicas de pagos, soportes y caja que ya existían.

## Comprobación después de Render

1. En ventana privada, confirma que se solicita la empresa antes de mostrar perfiles.
2. Inicializa con el administrador, elige su perfil y entra con su contraseña personal.
3. Cambia de perfil: debe conservar la empresa y pedir la contraseña del empleado.
4. Entra como empleado con Consultar + Ver propios: comprueba los registros asignados, sin reportes ni configuración administrativa.
5. Prueba un registro ajeno y una sección sin permiso: debe responder 403, incluso usando la URL de la API.
6. Cambia la cuenta/contraseña de empresa y comprueba que un navegador con el acceso anterior debe autenticar de nuevo la empresa.

## Validación y límites

Consulta `VALIDACION_ACCESO_1.json` para los resultados exactos. Se probó contra PostgreSQL PGlite aislado y se compiló el frontend. No se ha ejecutado esta publicación en tus repositorios Windows ni verificado tu Render; las pruebas locales no sustituyen la comprobación posterior.

Esta parte no incluye el editor visual, reorganización de Configuración, calendario dinámico, nuevos reportes, contabilidad ni tutorial. Corresponden a las otras cinco partes acordadas.
