import { apiClient } from '@/api/client';

export interface Sucursal {
  id: number;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  esPrincipal: boolean;
  estado: boolean;
}

export const listarSucursales = async (): Promise<Sucursal[]> =>
  (await apiClient.get<Sucursal[]>('/sucursales')).data;
