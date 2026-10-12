# SICOM — Parte 2: pagos, restaurante, servicios, préstamos y administración

Esta entrega continúa los dos ZIP de compras e inventario que compartiste. Conserva sus cambios y los componentes, colores y distribución del sistema; agrega controles dentro de los formularios existentes. Backend: Java 21 / Spring Boot. Frontend: React / TypeScript / Vite.

## Archivos

- `tiendapos_1_parte_2.zip`: backend completo, migración, pruebas, guía y script de publicación.
- `tiendapos_frontem_parte_2.zip`: frontend completo, guía y script de publicación.
- `migracion-sicom-parte-2.sql`: SQL separado para tu base actual.
- `COMANDOS_PARTE_2.ps1`: localiza los ZIP en Descargas, los extrae y ejecuta los scripts con las rutas de tus repositorios.
- `VALIDACION_PARTE_2.json`: resultados y alcance de las comprobaciones.

## Funciones terminadas

| Área | Resultado y ubicación |
|---|---|
| Pagos | Al confirmar un cobro con tarjeta o transferencia aparece un cuadro para adjuntar PDF, PNG o JPG de hasta 5 MB por pago. Cancelarlo cancela la petición de cobro. El backend exige y valida el archivo; soporte y venta quedan en la misma transacción. Aplica a POS, cotizaciones, domicilios, cierre de restaurante y facturación de servicios/citas. |
| Consulta | Ventas → `Pagos y soportes`. Caja → Cierre → `Soportes del corte`. Consulta y vista previa protegidas por empresa y permisos. Los pagos antiguos pueden aparecer sin soporte; no se inventan comprobantes históricos. |
| Anticipos | Los nuevos anticipos y abonos de tarjeta/transferencia también exigen archivo. Al facturar, se conserva su soporte y se asocia al pago de la venta. Para anticipos anteriores sin archivo: `Adjuntar soporte anterior` en abonos de restaurante, anticipos de servicios o cobro de cita. No reemplaza soportes ya guardados. |
| Restaurante | Operación → Turnos → `Configurar turnos`, solo administrador. Nombre, horario inicial/final y estado; admite horarios nocturnos. Empleados eligen un turno activo. Turnos y reportes tienen filtros de fecha y empleado. Usuarios sin reportes solo consultan sus propios turnos. El cierre limita sus abonos a la sucursal del turno. |
| Citas | `Crear cliente rápido` desde el formulario de cita; se guarda y selecciona sin cerrar la cita. Se mantiene la búsqueda de clientes por coincidencias. |
| Correo | Servicios → Recordatorios → registrar autorización EMAIL y destino → `Enviar correo autorizado`. Solo se envían citas próximas, vigentes, con consentimiento y sin recordatorio previo. Solo se marca enviado después de la confirmación del proveedor. WhatsApp conserva su operación manual. |
| Préstamos | Simulador → elegir plan → `Crear y activar el plan elegido`. Requiere cliente, sucursal, caja abierta, método/referencia, permisos, límites vigentes, aprobación y desembolso. Todo se ejecuta en una transacción; los reintentos con la misma clave no duplican contrato ni movimiento. Sigue disponible el proceso separado de solicitud, aprobación y desembolso. |
| Clientes de préstamos | Creación rápida, búsqueda por nombre/documento/teléfono y campo `Quién lo recomienda`. El detalle del contrato muestra la recomendación guardada. |
| Vouchers | Contratos y cuotas → fila del pago → `Vouchers y cuotas`. Permite adjuntar voucher, consultar las cuotas a las que se aplicó el pago y verlo dentro de SICOM. Mantiene la descarga del comprobante contable generado. Requiere permiso de soportes. |
| Empresas | Plataforma → Eliminar empresa. Solo superadministrador. Exige exactamente `ELIMINAR EMPRESA ID`, con el ID mostrado. Elimina filas de la empresa y sus dependencias, incluidos archivos binarios guardados en la base. Impide eliminar la empresa de la sesión. Si detecta referencias de otra empresa o dependencias sin resolver, revierte el borrado. Limpia el contexto de persistencia y las consultas del frontend; los usuarios eliminados dejan de autenticarse. |

Los horarios son opciones administrativas para abrir turnos manualmente; no abren ni cierran turnos automáticamente por reloj. El correo se envía desde el botón autorizado; no se incorpora un programador automático.

## Instalación en orden

1. Conserva un respaldo de la base y los repositorios actuales.
2. En pgAdmin o tu cliente SQL, selecciona **la base real de SICOM** (en tu entorno anterior era `neondb`). Ejecuta completo `migracion-sicom-parte-2.sql`. No lo ejecutes en la base de mantenimiento `postgres` si ahí no están las tablas del sistema.
3. Esta migración presupone que están aplicadas las migraciones de los módulos que ya contiene la parte 1, incluidos restaurante, servicios y préstamos. Si indica una tabla ausente, completa la migración de ese módulo antes de continuar. El SQL es repetible y no elimina ninguna empresa por sí solo.
4. Descarga ambos ZIP y `COMANDOS_PARTE_2.ps1` a Descargas.
5. Ejecuta los comandos siguientes, ajustando las dos rutas a tus repositorios. El script valida hashes de archivos, conserva `.env`, verifica cambios locales, actualiza `main`, copia el código, crea commit y hace push. Puede activar el despliegue que ya tengas configurado en Render.

```powershell
Set-ExecutionPolicy -Scope Process Bypass
& "$env:USERPROFILE\Downloads\COMANDOS_PARTE_2.ps1" `
  -BackendRepo "C:\PROYECTOS\tiendapos_1" `
  -FrontendRepo "C:\PROYECTOS\tiendapos_frontem"
```

Si los repositorios están en otras carpetas, usa esas rutas. No hace falta ubicar manualmente el contenido de los ZIP. El script busca la copia más reciente, incluyendo nombres que terminan en `(1)`.

También puedes publicar por separado, después de extraer ambos ZIP en `C:\PROYECTOS\ACTUALIZACION_SICOM_PARTE2`:

```powershell
& "C:\PROYECTOS\ACTUALIZACION_SICOM_PARTE2\tiendapos_1\PUBLICAR_BACKEND_PARTE_2.ps1" -Repositorio "C:\PROYECTOS\tiendapos_1"
& "C:\PROYECTOS\ACTUALIZACION_SICOM_PARTE2\tiendapos_frontem\PUBLICAR_FRONTEND_PARTE_2.ps1" -Repositorio "C:\PROYECTOS\tiendapos_frontem"
```

El frontend debe conservar `VITE_API_BASE_URL` apuntando a tu backend. El backend conserva las variables de conexión a PostgreSQL, JWT y CORS existentes.

## Configuración de correo

En el backend configura `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` y, opcionalmente, `BREVO_SENDER_NOMBRE`. Usa un remitente autorizado en tu cuenta. Si falta configuración o el proveedor falla, SICOM informa el error y no marca el recordatorio como enviado.

## Comprobaciones y pendientes externos

Consulta `VALIDACION_PARTE_2.json` para los resultados exactos. Se ejecutaron pruebas de integración de Spring Boot sobre PostgreSQL PGlite aislado y pruebas de interfaz con JSDOM/API simulada, además de la compilación TypeScript/Vite. Se comprobaron soportes, activación e idempotencia, asociación de vouchers a cuotas, turnos y filtros, consentimiento y errores de correo, borrado de dependencias y conservación de otra empresa.

**Pendiente en tu entorno:** aplicar SQL, desplegar ambos componentes y comprobar un envío real con las credenciales del proveedor. Estas acciones no se ejecutaron en tu servidor ni en tu base de producción. No hay envío real de correos en las pruebas: el proveedor está simulado.

Tras desplegar, prueba una venta con tarjeta y otra por transferencia, consulta sus soportes en venta/corte, crea un cliente desde citas, configura un turno, convierte un plan con caja abierta y adjunta un voucher a una cuota. Prueba la eliminación únicamente con una empresa de demostración creada para ese propósito.
