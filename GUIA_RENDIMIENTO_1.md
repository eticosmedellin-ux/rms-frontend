# SICOM — optimización de consultas 1

Base: entrega Tutorial 6, con todas las partes anteriores. No modifica el diseño general, las tarifas, préstamos históricos ni permisos. No se ha conectado ni desplegado en tu Render/Neon: es una entrega lista para instalar y comprobar allí.

## Cambios realizados

1. Dashboard: agregaciones de ventas, categorías, horarios, existencias, caja, cartera, compras y gastos directamente en PostgreSQL. 16 consultas independientemente del número de ventas/clientes. Ya no descarga todas las ventas ni realiza consultas por cada venta/cliente/factura. Las consultas filtran empresa y, cuando aplica, sucursal. Rango diario hasta el inicio del día siguiente, incluyendo fracciones de segundo finales. La rotación menor conserva el criterio anterior: productos vendidos, no productos sin ninguna venta.
2. Productos: presentaciones de la empresa en una consulta y categoría/marca cargadas junto con productos; conserva los campos del catálogo y sus imágenes. El listado sigue completo: no se implementó paginación del catálogo ni cambio al formato de imágenes.
3. Stock: devuelve directamente los campos de existencias en vez de cargar productos completos e imágenes en cada refresco; conserva validación de empresa y cantidades.
4. Clientes: estadísticas de compras, devoluciones y cartera agrupadas. Mantiene el criterio anterior de compras del listado, incluidas ventas anuladas si el criterio previo las incluía; no es una reclasificación de tus cifras históricas.
5. Historial de ventas: detalles agrupados por página, sin consultas por cada venta/producto. Conserva detalles, impuestos y filtros. El endpoint paginado sigue siendo el recomendado; el endpoint antiguo sin paginar conserva compatibilidad y agrupa detalles en bloques de 500 ventas.
6. Frontend: catálogo de productos reutilizable durante 30 segundos; categorías y marcas durante 5 minutos. Sus guardados invalidan las listas. Caché vaciada al cambiar empresa, empleado, roles o permisos; refresh de token no vacía el catálogo. No se añade una caché de servidor para saldos o permisos. Stock continúa refrescando cada 15 segundos mientras está montado. Registrar entrada invalida también el stock del POS.
7. Servicios: historial de citas se consulta cuando se abre Paquetes, cuentas contables cuando se abre Configuración y citas disponibles cuando se abre Cotizaciones. Las cotizaciones se consultan en sus pantallas y Seguimiento. Conserva los formularios y acciones.
8. Backend: compresión de respuestas JSON desde 2 KB, carga por lotes de relaciones Hibernate y pool Hikari configurable. Hikari ya existía; ahora sus valores son explícitos, no se presenta como una conexión nueva ni se genera tráfico artificial para mantener Neon despierto.
9. Logs: registra peticiones API que superan 1500 ms con método, módulo, estado y duración. No registra datos del cliente, tokens, parámetros o texto SQL. Duración medida dentro del backend, no incluye espera previa al arranque de Render ni todo el tiempo de red.
10. SQL: 17 índices para ventas/fechas/sucursal, detalles, pagos, stock, caja, clientes, cartera, compras, gastos, kardex y código de barras, más estadísticas ANALYZE. No borra índices existentes. Puede haber índices equivalentes creados anteriormente fuera de estas entregas: el diagnóstico permite revisarlos; no se borran automáticamente.

## Instalación

Descargar ambos ZIP, SQL y los dos PS1 en Descargas. Los PS1 encuentran y descomprimen automáticamente los ZIP. Ejecutarlos como archivos completos; no pegar líneas del contenido.

1. En pgAdmin abrir neondb y ejecutar completo `migracion-sicom-rendimiento-1.sql` en horario de poca actividad. Requiere Tutorial 6. Debe terminar con COMMIT. Se puede repetir.

El SQL usa CREATE INDEX dentro de una transacción, por lo que bloquea escrituras de las tablas durante la creación de índices. Si no consigue un bloqueo en 5 segundos o una sentencia excede 5 minutos, revierte todo; hacer ROLLBACK si la sesión queda en error y reintentar en un horario tranquilo. Para una base grande con actividad continua, la alternativa es construir índices CONCURRENTLY de uno en uno fuera de una transacción, con revisión de estado: no sustituir a ciegas el archivo. Estos índices ocupan almacenamiento y añaden trabajo a las escrituras.

2. Backend:

```powershell
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\PUBLICAR_BACKEND_RENDIMIENTO_1.ps1"
```

Esperar Live en Render antes de instalar frontend.

3. Frontend:

```powershell
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\PUBLICAR_FRONTEND_RENDIMIENTO_1.ps1"
```

Los scripts conservan claves y variables locales, validan hashes antes de copiar, bloquean cambios registrados pendientes y evitan commits vacíos. Frontend compila antes de subir. Extracción automática: `C:PROYECTOSACTUALIZACION_SICOM_OPT1`. Repositorios: `C:PROYECTOS	iendapos_1` y `C:PROYECTOS	iendapos_frontem`.

## Render y Neon

- El código usa las mismas variables DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD y DB_SSL_MODE anteriores. No publica ni reemplaza tus credenciales.
- Valores nuevos opcionales en el backend de Render: DB_POOL_MAX=5, DB_POOL_MIN=1, DB_POOL_CONNECTION_TIMEOUT_MS=30000, HTTP_SLOW_REQUEST_MS=1500. Ya son los valores por defecto del código; no necesitas crearlos para comenzar. Ajustar el máximo solo después de medir concurrencia, memoria y espera de conexiones.
- Comparar las regiones actuales de backend y base: la distancia y los viajes repetidos agregan latencia. No se cambia ninguna región automáticamente ni se migra tu base.
- Si hay muchos procesos/instancias concurrentes, Neon ofrece conexión pooled: tomar la conexión oficial de Connect, no inventar el hostname. Esta entrega no cambia el host ni necesita obligatoriamente el pooler. Probar transacciones y permisos antes de alterar una conexión de producción.
- Si Render es Free, se suspende tras 15 minutos sin tráfico y la siguiente visita necesita arrancarlo. Neon también puede suspender el compute según su configuración. La primera carga lenta después de inactividad no se elimina solo añadiendo índices. No se cambia tu plan ni se desactiva suspensión automáticamente.

Referencias oficiales: https://render.com/docs/free · https://neon.com/docs/manage/endpoints/ · https://neon.com/blog/how-to-minimise-the-impact-of-database-latency · https://www.postgresql.org/docs/current/sql-createindex.html

## Comprobar la mejora

1. Antes y después usar el mismo usuario, empresa, sucursal y fechas; comparar dashboard, listado de clientes, catálogo, stock e historial de ventas.
2. Abrir F12 > Red y anotar duración de las llamadas API. Separar la primera visita después de inactividad de las siguientes. Entrar en inventario, salir y volver antes de 30 segundos: no debería repetirse la consulta del catálogo ya vigente. Guardar un cambio debe actualizarlo.
3. Revisar logs del backend buscando Petición lenta. Si el navegador espera mucho más que la duración del log, puede existir demora fuera de las consultas. Un módulo rápido en el backend no prueba por sí solo que la red o Render sean rápidos.
4. Ejecutar `DIAGNOSTICO_RENDIMIENTO.sql` en neondb; solo lectura, muestra índices, estimaciones de filas y estados de conexión, sin texto de consultas de clientes. Sus contadores son acumulados y no demuestran por sí solos que un índice falte.
5. Si persiste una pantalla lenta, identificar su llamada exacta y obtener su plan EXPLAIN (ANALYZE, BUFFERS) sobre una consulta SELECT autorizada y representativa. No ejecutar EXPLAIN ANALYZE sobre operaciones que modifican dinero/datos.

## Verificación y límites

194 pruebas backend aprobadas, incluidas comparación completa del dashboard con la versión anterior, cantidad fija de consultas, centésimas finales del día, stock, catálogo, estadísticas de clientes, detalles/impuestos paginados y aislamiento de empresa. Migración aplicada dos veces en PostgreSQL PGlite 18.3 aislado. Compilación TypeScript/Vite aprobada. JSDOM verifica reutilización de catálogo, invalidación por guardado y separación de caché por perfil/empresa.

La medición local `RENDIMIENTO_LOCAL.json` usa 120 ventas del período y 81 clientes, datos sintéticos, y una ejecución: pasó de 336 consultas a 16. Los tiempos locales no son tiempos de Neon ni permiten garantizar un porcentaje en tu producción. El código anterior usado para comparación está solo en pruebas, no se incorpora como servicio de producción.

Pendientes de entorno: ejecución PS1 Windows, SQL neondb real, despliegue Render, prueba gráfica y medición con tu volumen de datos. Esta entrega optimiza los caminos enumerados; no afirma que todas las consultas de todos los módulos hayan sido perfiladas. Los catálogos con imágenes muy grandes, búsquedas por texto sobre tablas enormes y endpoints históricos sin paginar pueden requerir una segunda optimización basada en mediciones reales.
