# SICOM — parte 2 de 6: apariencia y Configuración organizada

Requiere la parte 1 de Acceso instalada y el marcador SQL `acceso-permisos-entrega-1`. Los ZIP contienen los proyectos completos con las entregas anteriores. Esta parte añade el editor visual del superadministrador y reorganiza Configuración; no cambia cálculos, registros de ventas ni permisos de la parte 1.

## Instalación

Descarga ambos ZIP en Descargas y el SQL independiente. Los PS1 están dentro de los ZIP y también se entregan por separado. No pegues el contenido de los PS1 línea por línea. Pega cada bloque completo.

### 1. SQL

En pgAdmin, selecciona **neondb**, abre Query Tool, abre `migracion-sicom-apariencia-2.sql` y ejecuta el archivo completo. Si exige Acceso parte 1, falta su SQL: completa esa instalación antes de publicar. Esta migración añade tablas y es repetible; no elimina información existente.

### 2. Backend

```powershell
& {
    $ErrorActionPreference = "Stop"
    $destino = "C:\PROYECTOS\ACTUALIZACION_SICOM_D2"
    $zip = Get-ChildItem (Join-Path $env:USERPROFILE "Downloads") -File |
        Where-Object { $_.Name -like "tiendapos_1_apariencia_2*.zip" } |
        Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (!$zip) { throw "Descarga tiendapos_1_apariencia_2.zip en Descargas." }
    Expand-Archive -LiteralPath $zip.FullName -DestinationPath $destino -Force
    powershell -ExecutionPolicy Bypass -File "$destino\tiendapos_1\PUBLICAR_BACKEND_APARIENCIA_2.ps1"
    if ($LASTEXITCODE -ne 0) { throw "Backend detenido. Copia el error; no publiques frontend todavía." }
}
```

Espera **Live** en Render antes del siguiente paso.

### 3. Frontend

```powershell
& {
    $ErrorActionPreference = "Stop"
    $destino = "C:\PROYECTOS\ACTUALIZACION_SICOM_D2"
    $zip = Get-ChildItem (Join-Path $env:USERPROFILE "Downloads") -File |
        Where-Object { $_.Name -like "tiendapos_frontem_apariencia_2*.zip" } |
        Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (!$zip) { throw "Descarga tiendapos_frontem_apariencia_2.zip en Descargas." }
    Expand-Archive -LiteralPath $zip.FullName -DestinationPath $destino -Force
    powershell -ExecutionPolicy Bypass -File "$destino\tiendapos_frontem\PUBLICAR_FRONTEND_APARIENCIA_2.ps1"
    if ($LASTEXITCODE -ne 0) { throw "Frontend detenido. Copia el error." }
}
```

Los scripts validan el marcador y los hashes antes de copiar archivos. Usan main en `C:\PROYECTOS\tiendapos_1` y `C:\PROYECTOS\tiendapos_frontem`; conservan variables y claves locales. Si hay cambios registrados pendientes, se detienen. El frontend ejecuta npm ci y su compilación antes de subir. No aplican el SQL ni comprueban Render automáticamente.

## Editor visual

Entra como **superadministrador** a **Plataforma → Apariencia en vivo**. El Administrador General de una empresa puede usar Configuración, pero no modificar la marca global.

- **Marca y logo:** nombre, subtítulo, logo subido o sin logo.
- **Colores y texto:** botones, texto, tarjetas, bordes, fuente, tamaño y redondeado.
- **Fondos:** ingreso/perfiles, sistema, menú lateral y cabecera. Cada zona admite color o imagen, velo para legibilidad y ajuste cubrir/completa/repetir.
- **Tamaños y posición:** ancho y alto del logo; posición del logo; ancho y posición del formulario. También se puede arrastrar en la vista previa o usar las flechas del teclado al seleccionar el control. En móviles se limita el desplazamiento para conservar el ingreso visible; el logo lateral usa límites acordes al ancho del menú.
- **Imágenes:** subir PNG/JPG, elegir de la galería y descargar el archivo original.
- **Historial:** fecha, usuario y versión de cada publicación; recuperar una versión como borrador o preparar el diseño original.

La vista previa ofrece **Ingreso, Perfiles y Sistema**, con tamaños de escritorio, tablet y teléfono. Sus datos son ejemplos y sus botones no registran ventas ni operaciones. El editor personaliza estas zonas y elementos previstos; no es un editor de HTML libre ni modifica la estructura operativa de los módulos.

**Guardar borrador** conserva el diseño sin cambiar el que ven los clientes. Guarda antes de salir del editor o cambiar de pestaña. **Publicar diseño** solicita confirmación y aplica el diseño global a todas las empresas. Los otros dispositivos lo consultan al actualizar o dentro de un minuto mientras la aplicación esté abierta. Si otro superadministrador modifica el diseño, se exige recargar para no sobrescribirlo.

Al instalar esta parte se conserva el diseño existente: la personalización se activa al marcar **Usar diseño personalizado** y publicar. Recuperar un diseño anterior no lo publica directamente: permite revisarlo primero. Para volver al aspecto original, prepara el diseño original desde Historial y publícalo.

La marca global se aplica al ingreso, perfiles, acceso general y encabezado lateral, junto con los colores/fondos del sistema y sus pantallas simplificadas. El logo empresarial en documentos y facturas sigue siendo el de cada empresa.

### Transparencia y recorte automático

PNG conserva su transparencia. El recorte automático elimina **fondos uniformes conectados al borde**, con tolerancia ajustable; conserva zonas interiores cerradas y el archivo original. Comprueba la imagen en la vista previa antes de publicarla.

**No realiza segmentación de personas u objetos sobre fondos fotográficos complejos.** Si no detecta fondo uniforme, conserva la imagen y lo informa. Para esos casos, sube un PNG ya recortado. No depende de una API externa de imágenes.

Límites: PNG/JPG reales hasta 5 MB, máximo 4096 píxeles por lado y 8 millones de píxeles. No se aceptan SVG ni archivos animados. Las imágenes de borrador y los originales requieren superadministrador; solo las imágenes del diseño activo publicado se sirven públicamente.

El sistema comprueba contraste antes de guardar/publicar. El ingreso y el menú usan letras claras y necesitan colores oscuros de fondo; el velo ayuda a leer el texto cuando se elige una imagen. Revisa también el resultado visual de la fotografía.

## Configuración organizada

La pantalla presenta un menú vertical con búsqueda y doce temas:

1. Mi empresa.
2. Cuenta y perfiles.
3. Métodos de pago.
4. Redes y bancos.
5. Sistema.
6. Ventas.
7. Inventario.
8. Impresión.
9. Impuestos y categorías.
10. Facturación electrónica.
11. Fidelización.
12. Usuarios de facturación.

Se conservan las tarjetas, campos y guardados de las opciones existentes. Impuestos individuales/masivos y reglas por categoría están en Impuestos y categorías. Fidelización y permisos de facturadores se muestran por separado. Cambiar de sección con modificaciones pendientes pide confirmación. En teléfonos el menú se adapta arriba del contenido.

## Validación y comprobación posterior

Los resultados exactos están en `VALIDACION_APARIENCIA_2.json`: backend, migración repetida, compilación del frontend e interacción React en DOM simulado. No se ha publicado en tu Windows/Render ni ejecutado una comprobación gráfica en un navegador real en esta sesión.

Después de ambos despliegues Live:

1. Verifica que Configuración contiene las doce secciones y que puedes guardar una modificación normal.
2. Como superadministrador, entra al editor, sube un PNG transparente o un logo con fondo uniforme y revisa el resultado.
3. Cambia colores y posiciones. Guarda el borrador y comprueba en ventana privada que el diseño público sigue igual.
4. Publica y verifica ingreso, perfiles y una pantalla de operación en escritorio y teléfono.
5. Entra como empleado: debe conservar sus permisos y no poder editar apariencia ni acceder a imágenes de borrador.
6. Recupera una publicación anterior como borrador, revísala y publica si corresponde.

Calendario dinámico, nuevos reportes/dashboard, contabilidad y tutorial corresponden a las siguientes partes.
