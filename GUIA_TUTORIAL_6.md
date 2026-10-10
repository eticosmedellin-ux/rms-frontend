# SICOM — nueva parte 6: tutorial, configuración y ayuda

Requiere la nueva parte 5 de contabilidad instalada. Conserva el diseño general y los campos de configuración anteriores.

## Qué incluye

- Configuración: 13 opciones en menú vertical, organizadas por Empresa y acceso, Operación, Documentos y sistema y Aprender. Búsqueda por nombre y descripción. Conserva los formularios y sus guardados anteriores; avisa de cambios sin guardar al cambiar sección.
- Tutorial en Configuración y desde el asistente flotante: 20 módulos y 104 explicaciones de acciones principales. Cada perfil ve únicamente sus módulos y acciones autorizados y contratados. El superadministrador conserva su módulo propio.
- Pantalla de práctica con botón resaltado, explicación, anterior/siguiente, búsqueda y reinicio. No monta formularios reales ni guarda, cobra, anula o cambia operaciones del negocio. El progreso se guarda solo en este navegador por empresa, empleado y versión de guía. No se sincroniza entre equipos.
- Asistente: Guía rápida con búsqueda de palabras y acceso al paso correspondiente del tutorial. Mantiene Preguntas configuradas y el árbol anterior editable por el superadministrador. La guía nueva es contenido versionado del backend: su edición requiere actualizar ese archivo, no el árbol anterior.
- Una pregunta se registra para revisión solo cuando el usuario pulsa Registrar esta pregunta. Se conserva en la base de datos de su empresa; no envía automáticamente correo, mensajes ni avisos externos. Los errores se muestran sin dejar una carga indefinida.
- Buscador general en la barra superior: productos por nombre/código/código de barras; clientes por nombre/documento/teléfono; proveedores por nombre/NIT; ventas por número de documento; citas, órdenes y préstamos por identificador o cliente. Hasta 15 resultados por tipo, sin precios, costos ni información financiera. El servidor filtra por empresa, plan y permisos; servicios y préstamos respetan sus ámbitos de acceso. No incluye todos los tipos de documento del sistema.
- Un resultado abre el módulo correspondiente sin iniciar una operación. Inventario reconoce la referencia del producto; las demás pantallas pueden requerir buscar o seleccionar el registro dentro del módulo. No se da por implementada la selección automática de todos los resultados.
- Barra superior: empresa y sucursal seleccionada de caja visibles. Este rótulo indica el contexto de caja, no un filtro global: las otras pantallas conservan sus filtros independientes. Si no se eligió sucursal de caja, se indica expresamente.

El tutorial explica acciones principales en una pantalla segura de práctica; no es una superposición que señale cada botón real de cada pantalla. No ofrece respuestas generadas por IA ni consulta balances en las explicaciones.

## Instalación en orden

1. Descargar los dos ZIP, SQL y ambos PS1 en Descargas. Los PS1 encuentran y descomprimen automáticamente los ZIP correspondientes. No pegar su contenido línea por línea.
2. Ejecutar completo `migracion-sicom-tutorial-6.sql` en pgAdmin, base `neondb`. Debe terminar con COMMIT. Si falta la parte 5, se detiene sin aplicar esta migración. Se puede ejecutar otra vez.
3. Backend, desde PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\PUBLICAR_BACKEND_TUTORIAL_6.ps1"
```

Esperar a que el backend quede Live en Render. Si falla el script, se detiene: no continuar pegando las líneas posteriores.

4. Frontend:

```powershell
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\PUBLICAR_FRONTEND_TUTORIAL_6.ps1"
```

El frontend ejecuta `npm ci` y compilación antes del commit. Los scripts verifican los archivos de la entrega, preservan variables y claves locales y bloquean cambios registrados pendientes. Si no hay diferencias no crean un commit vacío.

Carpetas de extracción: `C:\PROYECTOS\ACTUALIZACION_SICOM_T6\tiendapos_1` y `C:\PROYECTOS\ACTUALIZACION_SICOM_T6\tiendapos_frontem`. Repositorios: `C:\PROYECTOS\tiendapos_1` y `C:\PROYECTOS\tiendapos_frontem`.

## Comprobación después de publicar

- Abrir Configuración, buscar impresión o impuestos y comprobar los campos y su guardado habitual.
- Abrir Tutorial: seleccionar un módulo y varios botones de ejemplo; comprobar el resaltado, explicación, siguiente y reinicio. Confirmar que no cambia ninguna operación real.
- Abrir Guía rápida, buscar cuota o cita y Mostrar este paso en el tutorial. Probar también Preguntas configuradas.
- Entrar con un empleado limitado: no deben aparecer guías o resultados de módulos sin permiso. Una guía no concede permisos de operación.
- Buscar un producto propio por código de barras y comprobar que otra empresa no aparece.
- Verificar empresa y contexto de caja en la barra superior.

## Validación y límites

186 pruebas de backend aprobadas, sin fallos, errores ni omitidas; SQL aplicado dos veces sobre PostgreSQL PGlite 18.3 aislado. TypeScript y Vite de producción aprobados. Interacción de tutorial, progreso, ayuda, registro explícito y búsqueda comprobada en JSDOM con API simulada. Estos resultados no equivalen a inspección gráfica en navegador real ni a una instalación en tu producción.

Pendientes de entorno: ejecución PS1 en Windows, SQL en tu neondb, despliegue Render y comprobación con tus perfiles/datos. Esta entrega no declara implementadas funciones fuera del alcance descrito ni elimina los límites documentados en las partes anteriores.
