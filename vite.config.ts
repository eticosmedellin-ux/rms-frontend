import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true, // acepta conexiones desde fuera de tu computador (necesario para el túnel de la demo)
    allowedHosts: true, // permite el hostname temporal que genera la herramienta de túnel
    // El frontend llama a /api/... y Vite lo reenvía al backend en 8080,
    // así evitamos configurar CORS en Spring Security para desarrollo local.
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
