import { apiClient } from '@/api/client';

export interface EmpresaPlataforma {
  id: number;
  nombre: string;
  nombreComercial: string | null;
  nit: string | null;
  estado: boolean;
  cantidadUsuarios: number;
  creadoEn: string;
}

export const listarEmpresasPlataforma = async (): Promise<EmpresaPlataforma[]> =>
  (await apiClient.get<EmpresaPlataforma[]>('/plataforma/empresas')).data;

export const suspenderEmpresa = async (id: number): Promise<void> => {
  await apiClient.post(`/plataforma/empresas/${id}/suspender`);
};

export const activarEmpresa = async (id: number): Promise<void> => {
  await apiClient.post(`/plataforma/empresas/${id}/activar`);
};
