# SICOM — Usuarios, contraseñas y permisos de pestañas 3

Continúa la parte 2 conservando compras, inventario, conversiones, XML y el diseño existente. No corrige ni modifica movimientos históricos de inventario.

## Cambios

- Restaurante → Operación y liquidaciones → Turnos: se ocultan exactamente los filtros Desde, Hasta y Empleado marcados en la imagen. Se conservan sucursal, turno configurado, apertura, cierre y listado. Los filtros siguen en Preparación y margen. El listado de turnos usa los últimos 30 días, en vez de una fecha invisible fijada al día actual.
- Administración → Usuarios: búsqueda con lupa por nombre, usuario, correo, teléfono y empresa; selección abre ficha. Administradores consultan su empresa; usuarios delegados necesitan el permiso Cambiar contraseñas de usuarios de la empresa y acceso a la pestaña Usuarios.
- Plataforma → Usuarios y contraseñas: el superadministrador busca usuarios entre todas las empresas, abre ficha y puede cambiar sus contraseñas.
- Ficha: identidad, estado, empresa, roles, sucursales, permisos, acceso total y registros de accesos, auditoría, ventas, cajas, turnos, citas, préstamos solicitados y órdenes de compra creadas. Cada historial muestra los últimos 50 registros, no todo el histórico. La búsqueda devuelve hasta 200 coincidencias; acota el texto para localizar un usuario específico.
- Contraseña: botón Cambiar contraseña en ficha y en la cabecera para la propia cuenta. La propia requiere contraseña actual. Cambio administrativo exige administrador o permiso explícito dentro de la empresa; el superadministrador gestiona otras empresas. Los delegados no pueden cambiar cuentas administradoras ni superadministradoras. Mínimo 10 caracteres, hasta 72 bytes UTF-8; confirmación obligatoria. BCrypt, revocación de sesiones de acceso/refresh y de enlaces de recuperación pendientes; auditoría sin claves. No se muestran contraseñas actuales ni se envían nuevas por correo.
- Roles: 105 permisos de pestañas/secciones en Ventas, Inventario, Compras, Administración, Contabilidad, Reportes, Configuración, Restaurante, Servicios de citas/órdenes y Préstamos. Las pestañas y su contenido respetan la selección; hay controles de API para las operaciones y consultas específicas. Las consultas compartidas de catálogos conservan su uso en formularios autorizados. Se mantienen además las reglas anteriores de consultar, operar, administrar, alcance, costos y reportes; habilitar una pestaña no reemplaza esos permisos.
- Comunicaciones: permiso Enviar comunicaciones y documentos al cliente. Facturas/comprobantes por correo y recordatorios requieren permiso, además del acceso al módulo. No agrega canales nuevos ni envío automático. La transmisión a DIAN es otra operación y conserva su control anterior.

El administrador general predeterminado y el superadministrador mantienen acceso total. Usa roles personalizados para limitar pestañas. Los módulos que no tienen pestañas mantienen sus permisos de módulo y operaciones anteriores.

## SQL y publicación

Aplica primero `migracion-sicom-usuarios-pestanas-3.sql` en la base de SICOM, después de los SQL de las partes 1 y 2. La migración añade el catálogo de permisos; en la primera ejecución conserva el acceso de roles existentes a las pestañas de sus módulos. Después puedes desmarcar pestañas. Repetirla no vuelve a conceder permisos que quitaste.

Descarga los dos ZIP y `COMANDOS_USUARIOS_PESTANAS_3.ps1` en Descargas. El comando prepara ambos proyectos y publica en main con validación de hashes y comprobaciones Git, conservando variables y archivos de entorno:

```powershell
Set-ExecutionPolicy -Scope Process Bypass -Force
& "$env:USERPROFILE\Downloads\COMANDOS_USUARIOS_PESTANAS_3.ps1" -BackendRepo "C:\PROYECTOS\tiendapos_1" -FrontendRepo "C:\PROYECTOS\tiendapos_frontem"
```

También puedes publicar por separado después de extraerlos:

```powershell
& "C:\PROYECTOS\ACTUALIZACION_SICOM_USUARIOS3\tiendapos_1\PUBLICAR_BACKEND_USUARIOS_PESTANAS_3.ps1" -Repositorio "C:\PROYECTOS\tiendapos_1"
& "C:\PROYECTOS\ACTUALIZACION_SICOM_USUARIOS3\tiendapos_frontem\PUBLICAR_FRONTEND_USUARIOS_PESTANAS_3.ps1" -Repositorio "C:\PROYECTOS\tiendapos_frontem"
```

Verifica Live del backend y frontend. Cierra sesión y vuelve a entrar. Al editar permisos de un rol se revocan las sesiones de sus usuarios para que su menú vuelva a cargarse con permisos actuales.

## Prueba de roles por pestaña

1. Como administrador, crea o edita un rol personalizado; marca los permisos de operación/consulta y el alcance que necesita.
2. Dentro de su módulo, marca solo las entradas Pestaña que quieres mostrar. Para una subpestaña operativa marca también la pestaña contenedora Operación completa/Operación y liquidaciones.
3. Ejemplo restaurante: habilita Mesas, Operación y liquidaciones y Operación: turnos. Desmarca bancos, propinas, mermas, recetas, plataformas, configuración y reportes si no corresponden al usuario.
4. Ejemplo ventas: habilita Vender e Historial de ventas. Si no debe enviar al cliente, desmarca Enviar comunicaciones y documentos al cliente.
5. Guarda, asigna el rol al empleado y vuelve a entrar con esa cuenta. Las pestañas desmarcadas y su contenido no deben mostrarse. Si no tiene ninguna habilitada, verá el mensaje correspondiente.
6. La regla de pestañas usa la unión de permisos de todos los roles del usuario: si otro rol le concede una pestaña, seguirá disponible. No pruebes restricciones con Administrador General, que tiene acceso total.

## Pruebas de usuarios y contraseñas

- Admin empresa: busca empleado con lupa, abre ficha y verifica datos/roles/sucursales e historiales. No debe acceder a un usuario de otra empresa.
- Superadmin: Plataforma → Usuarios y contraseñas; busca por correo o nombre de empresa y abre al usuario.
- Cambio: escribe nueva clave y confirmación. Valores distintos deben bloquear. Cambia una contraseña de prueba y verifica que el empleado vuelva a ingresar con la nueva. No uses contraseñas reales en capturas ni mensajes de prueba.
- Cuenta propia: desde cabecera usa Cambiar contraseña; debe exigir la actual y cerrar tu sesión al terminar.
- Delegado: asigna permiso Cambiar contraseñas de usuarios de la empresa y pestaña Usuarios. Puede gestionar cuentas normales de su empresa; no cuentas administradoras ni de otra empresa.
- Restaurante: en Turnos no debe aparecer Desde/Hasta/Empleado. En Preparación y margen deben conservarse los filtros.
- Envíos: con permiso correspondiente aparece la acción; sin permiso se oculta y la API bloquea el envío. Un permiso no sustituye las credenciales ni el consentimiento autorizado para recordatorios.

## Comprobación y pendientes

Consulta `VALIDACION_USUARIOS_PESTANAS_3.json` para los resultados exactos. Se ejecutan compilación backend, pruebas con PostgreSQL PGlite aislado, compilación TypeScript/Vite y pruebas de interfaz JSDOM con API simulada.

Pendiente en tu entorno: aplicar SQL, comprobar scripts en PowerShell/Windows, publicar ambos repositorios y probar con los usuarios/roles reales. No se cambió ninguna contraseña real ni se enviaron comunicaciones reales durante esta entrega.
