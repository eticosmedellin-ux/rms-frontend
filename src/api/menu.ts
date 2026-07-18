import { apiClient } from '@/api/client';

export type TipoArchivoMenu = 'IMAGEN' | 'PDF';

export interface MenuArchivo {
  id: number;
  nombre: string;
  tipoArchivo: TipoArchivoMenu;
  contenido: string;
  sucursalId: number | null;
  sucursalNombre: string | null;
  orden: number;
  activo: boolean;
}

export interface MenuArchivoRequest {
  nombre: string;
  tipoArchivo: TipoArchivoMenu;
  contenido: string;
  sucursalId?: number;
  orden?: number;
}

/** Público — lo consume la vista de menú al escanear el QR de la mesa, sin sesión. */
export const listarMenuPublico = async (sucursalId: number): Promise<MenuArchivo[]> =>
  (await apiClient.get<MenuArchivo[]>('/restaurante/menu/publico', { params: { sucursalId } })).data;

export const listarMenu = async (): Promise<MenuArchivo[]> =>
  (await apiClient.get<MenuArchivo[]>('/restaurante/menu')).data;

export const subirArchivoMenu = async (data: MenuArchivoRequest): Promise<MenuArchivo> =>
  (await apiClient.post<MenuArchivo>('/restaurante/menu', data)).data;

export const activarArchivoMenu = async (id: number, activo: boolean): Promise<MenuArchivo> =>
  (await apiClient.patch<MenuArchivo>(`/restaurante/menu/${id}/activo`, { activo })).data;

export const eliminarArchivoMenu = async (id: number): Promise<void> => {
  await apiClient.delete(`/restaurante/menu/${id}`);
};
