import { apiClient } from '@/api/client';
import type { TipoDescuento, TipoDescuentoRequest } from '@/types/pos';

export const listarTiposDescuento = async (): Promise<TipoDescuento[]> =>
  (await apiClient.get<TipoDescuento[]>('/tipos-descuento')).data;

export const crearTipoDescuento = async (data: TipoDescuentoRequest): Promise<TipoDescuento> =>
  (await apiClient.post<TipoDescuento>('/tipos-descuento', data)).data;

export const actualizarTipoDescuento = async (id: number, data: TipoDescuentoRequest): Promise<TipoDescuento> =>
  (await apiClient.put<TipoDescuento>(`/tipos-descuento/${id}`, data)).data;

export const desactivarTipoDescuento = async (id: number): Promise<void> => {
  await apiClient.post(`/tipos-descuento/${id}/desactivar`);
};

export const reactivarTipoDescuento = async (id: number): Promise<void> => {
  await apiClient.post(`/tipos-descuento/${id}/reactivar`);
};
