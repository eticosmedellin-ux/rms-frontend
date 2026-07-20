import { apiClient } from '@/api/client';
import type { EstadoResultados, BalanceGeneral } from '@/types/contabilidad';

export interface AccesoContable {
  id: number;
  contadorUsuarioId: number;
  contadorNombre: string;
  contadorUsername: string;
  empresaClienteId: number;
  empresaClienteNombre: string;
  nivel: 'LECTURA' | 'GESTION';
  activo: boolean;
  creadoEn: string;
}

export interface AccesoContableRequest {
  contadorUsername: string;
  nivel: 'LECTURA' | 'GESTION';
}

export const otorgarAccesoContable = async (data: AccesoContableRequest): Promise<AccesoContable> =>
  (await apiClient.post<AccesoContable>('/contabilidad/accesos-contables', data)).data;

export const listarAccesosContables = async (): Promise<AccesoContable[]> =>
  (await apiClient.get<AccesoContable[]>('/contabilidad/accesos-contables')).data;

export const revocarAccesoContable = async (id: number): Promise<void> => {
  await apiClient.delete(`/contabilidad/accesos-contables/${id}`);
};

export const listarMisClientesContables = async (): Promise<AccesoContable[]> =>
  (await apiClient.get<AccesoContable[]>('/contabilidad/mis-clientes')).data;

// --- Consulta de la contabilidad de una empresa cliente (como contador externo) ---

export const estadoDeResultadosCliente = async (
  empresaId: number, desde: string, hasta: string
): Promise<EstadoResultados> =>
  (await apiClient.get(`/contabilidad/clientes/${empresaId}/estado-resultados`, { params: { desde, hasta } })).data;

export const balanceGeneralCliente = async (
  empresaId: number, hasta: string
): Promise<BalanceGeneral> =>
  (await apiClient.get(`/contabilidad/clientes/${empresaId}/balance-general`, { params: { hasta } })).data;
