import { apiClient } from '@/api/client';
import type {
  SuscripcionEmpresa, PagoSuscripcion, ConfiguracionPagoRecurrente, ConfiguracionPagoRecurrenteRequest,
} from '@/types/suscripcion';

export const listarSuscripciones = async (): Promise<SuscripcionEmpresa[]> =>
  (await apiClient.get<SuscripcionEmpresa[]>('/plataforma/suscripciones')).data;

export const historialSuscripcion = async (empresaId: number): Promise<PagoSuscripcion[]> =>
  (await apiClient.get<PagoSuscripcion[]>(`/plataforma/suscripciones/${empresaId}/historial`)).data;

export const activarSuscripcion = async (
  empresaId: number,
  valorMensual: number,
  frecuencia: 'MENSUAL' | 'ANUAL' = 'MENSUAL'
): Promise<SuscripcionEmpresa> =>
  (await apiClient.post<SuscripcionEmpresa>(`/plataforma/suscripciones/${empresaId}/activar`, { valorMensual, frecuencia })).data;

export const cancelarSuscripcion = async (empresaId: number): Promise<void> => {
  await apiClient.post(`/plataforma/suscripciones/${empresaId}/cancelar`);
};

export const marcarPagoManual = async (
  empresaId: number,
  data?: { monto?: number; comprobante?: string }
): Promise<SuscripcionEmpresa> =>
  (await apiClient.post<SuscripcionEmpresa>(`/plataforma/suscripciones/${empresaId}/marcar-pago-manual`, data ?? {})).data;

export const obtenerConfiguracionPago = async (): Promise<ConfiguracionPagoRecurrente> =>
  (await apiClient.get<ConfiguracionPagoRecurrente>('/plataforma/suscripciones/configuracion')).data;

export const actualizarConfiguracionPago = async (
  data: ConfiguracionPagoRecurrenteRequest
): Promise<ConfiguracionPagoRecurrente> =>
  (await apiClient.put<ConfiguracionPagoRecurrente>('/plataforma/suscripciones/configuracion', data)).data;
