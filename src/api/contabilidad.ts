import { apiClient } from '@/api/client';
import type {
  CuentaContable, AsientoContable, AsientoManualRequest, LibroMayor, BalanceDePruebaLinea,
  EstadoResultados, BalanceGeneral, PeriodoContable, MapeoContable,
} from '@/types/contabilidad';

export const activarContabilidad = async (): Promise<void> => {
  await apiClient.post('/contabilidad/activar');
};

export const contabilidadActiva = async (): Promise<boolean> =>
  (await apiClient.get<{ activo: boolean }>('/contabilidad/activo')).data.activo;

export const listarCuentasContables = async (): Promise<CuentaContable[]> =>
  (await apiClient.get<CuentaContable[]>('/contabilidad/cuentas')).data;

export const libroDiario = async (desde: string, hasta: string): Promise<AsientoContable[]> =>
  (await apiClient.get<AsientoContable[]>('/contabilidad/libro-diario', { params: { desde, hasta } })).data;

export const crearAsientoManual = async (data: AsientoManualRequest): Promise<AsientoContable> =>
  (await apiClient.post<AsientoContable>('/contabilidad/asientos-manuales', data)).data;

export const anularAsiento = async (id: number): Promise<void> => {
  await apiClient.post(`/contabilidad/asientos/${id}/anular`);
};

export const libroMayor = async (cuentaId: number, desde: string, hasta: string): Promise<LibroMayor> =>
  (await apiClient.get<LibroMayor>(`/contabilidad/libro-mayor/${cuentaId}`, { params: { desde, hasta } })).data;

export const balanceDePrueba = async (hasta: string): Promise<BalanceDePruebaLinea[]> =>
  (await apiClient.get<BalanceDePruebaLinea[]>('/contabilidad/balance-prueba', { params: { hasta } })).data;

export const estadoDeResultados = async (desde: string, hasta: string): Promise<EstadoResultados> =>
  (await apiClient.get<EstadoResultados>('/contabilidad/estado-resultados', { params: { desde, hasta } })).data;

export const balanceGeneral = async (hasta: string): Promise<BalanceGeneral> =>
  (await apiClient.get<BalanceGeneral>('/contabilidad/balance-general', { params: { hasta } })).data;

export const listarPeriodosContables = async (): Promise<PeriodoContable[]> =>
  (await apiClient.get<PeriodoContable[]>('/contabilidad/periodos')).data;

export const cerrarPeriodoContable = async (id: number): Promise<void> => {
  await apiClient.post(`/contabilidad/periodos/${id}/cerrar`);
};

export const reabrirPeriodoContable = async (id: number): Promise<void> => {
  await apiClient.post(`/contabilidad/periodos/${id}/reabrir`);
};

export const listarMapeoContable = async (): Promise<MapeoContable[]> =>
  (await apiClient.get<MapeoContable[]>('/contabilidad/mapeo')).data;

export const actualizarMapeoContable = async (concepto: string, cuentaContableId: number): Promise<void> => {
  await apiClient.put(`/contabilidad/mapeo/${concepto}`, { cuentaContableId });
};
