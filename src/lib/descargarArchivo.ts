import { apiClient } from '@/api/client';

/** Descarga un archivo binario (ej. un .xlsx) que el backend entrega con cabeceras de
 *  adjunto — funciona para cualquier endpoint que devuelva bytes en vez de JSON. */
export async function descargarArchivo(url: string, nombreSugerido: string, params?: Record<string, string>) {
  const response = await apiClient.get(url, { responseType: 'blob', params });
  const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = nombreSugerido;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
}
