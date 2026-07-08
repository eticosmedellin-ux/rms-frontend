# RMS Frontend — Incremento 1 (Login + Dashboard base)

Primer incremento del frontend: React 19 + TypeScript + Vite + Tailwind CSS, conectado
al backend que ya tienes corriendo en `localhost:8080`.

## Qué incluye este incremento

- Proyecto Vite con React 19, TypeScript, Tailwind CSS.
- Identidad visual propia del RMS (paleta azul-tinta + ámbar, tipografía Inter/Lexend) —
  ver `tailwind.config.js` para los tokens de diseño.
- `LoginPage`: formulario validado con React Hook Form + Zod, conectado a
  `POST /api/auth/login`.
- Sesión manejada con Zustand (`src/stores/authStore.ts`), persistida en `localStorage`.
- Cliente Axios (`src/api/client.ts`) que adjunta el JWT automáticamente y **refresca el
  access token solo** si una petición responde 401 (usando el refresh token), sin que el
  usuario tenga que volver a hacer login a cada rato.
- Rutas protegidas: si no hay sesión, cualquier ruta privada redirige a `/login`.
- Layout general (sidebar + topbar) con navegación a los módulos.
- Dashboard y las demás pantallas de módulo como placeholders — se conectan a la API real
  módulo por módulo en los próximos incrementos, en el mismo orden que el backend.

## Cómo correrlo

1. Asegúrate de que el backend (`rms-backend`) esté corriendo en `http://localhost:8080`
   (mismo `RmsApplication` que ya tienes funcionando en IntelliJ).

2. Abre una terminal **en la carpeta de este proyecto** (`rms-frontend`) y corre:
   ```
   npm install
   ```
   Esto descarga todas las dependencias (equivalente a lo que hace Maven, pero para
   JavaScript). Puede tardar uno o dos minutos la primera vez.

3. Corre el servidor de desarrollo:
   ```
   npm run dev
   ```
   La terminal te va a mostrar algo como:
   ```
   ➜  Local:   http://localhost:5173/
   ```

4. Abre esa URL en tu navegador. Deberías ver la pantalla de login.

5. Ingresa con el usuario que ya creaste en el `seed.sql` del backend (`admin` / la
   contraseña que definiste). Si el login es correcto, entras al Dashboard.

## Notas importantes

- **No necesitas configurar CORS en el backend.** Vite está configurado para reenviar
  cualquier petición a `/api/...` hacia `http://localhost:8080` (ver `vite.config.ts`,
  sección `server.proxy`) — el navegador solo ve una llamada al mismo origen (`5173`).
- Si cambias el puerto del backend, actualiza `vite.config.ts`.
- Si cierras y abres el navegador, la sesión se mantiene (queda en `localStorage`) hasta
  que le des clic a "Salir" o el refresh token expire (7 días, según `application.yml`).

## Siguiente paso

Con Login + Dashboard + navegación funcionando, el siguiente incremento conecta el
**módulo de Inventario**: listado y CRUD de productos, categorías y marcas, y la vista
de stock/kardex — reemplazando el placeholder de `/inventario`.
