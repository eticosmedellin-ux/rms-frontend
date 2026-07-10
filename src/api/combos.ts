import { apiClient } from '@/api/client';
import type { Combo, ComboRequest } from '@/types/inventario';

export const listarCombos = async (): Promise<Combo[]> =>
  (await apiClient.get<Combo[]>('/combos')).data;

export const crearCombo = async (data: ComboRequest): Promise<Combo> =>
  (await apiClient.post<Combo>('/combos', data)).data;

export const actualizarCombo = async (id: number, data: ComboRequest): Promise<Combo> =>
  (await apiClient.put<Combo>(`/combos/${id}`, data)).data;

export const desactivarCombo = async (id: number): Promise<void> => {
  await apiClient.post(`/combos/${id}/desactivar`);
};

export const reactivarCombo = async (id: number): Promise<void> => {
  await apiClient.post(`/combos/${id}/reactivar`);
};
