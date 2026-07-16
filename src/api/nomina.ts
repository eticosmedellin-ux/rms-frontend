import { apiClient } from '@/api/client';

export interface Trabajador {
  id: number;
  nombre: string;
  apellido: string | null;
  documento: string | null;
  cargo: string | null;
  salario: number | null;
  sucursalId: number | null;
  sucursalNombre: string | null;
  frecuenciaPago: 'MENSUAL' | 'QUINCENAL' | 'SEMANAL';
  diaPago1: number;
  diaPago2: number | null;
  telefono: string | null;
  email: string | null;
  fechaIngreso: string | null;
  estado: boolean;
  proximaFechaPago: string | null;
  ultimoPagoFecha: string | null;
}

export interface TrabajadorRequest {
  nombre: string;
  apellido?: string;
  documento?: string;
  cargo?: string;
  salario?: number;
  sucursalId: number;
  frecuenciaPago: 'MENSUAL' | 'QUINCENAL' | 'SEMANAL';
  diaPago1: number;
  diaPago2?: number;
  telefono?: string;
  email?: string;
  fechaIngreso?: string;
  estado?: boolean;
}

export interface PagoNomina {
  id: number;
  fechaPeriodo: string;
  monto: number;
  fechaConfirmacion: string;
  comprobante: string | null;
  confirmadoPorNombre: string | null;
  observaciones: string | null;
}

export interface ConfirmarPagoNominaRequest {
  fechaPeriodo: string;
  monto: number;
  comprobante?: string;
  observaciones?: string;
}

export const listarTrabajadores = async (): Promise<Trabajador[]> =>
  (await apiClient.get<Trabajador[]>('/nomina/trabajadores')).data;

export const crearTrabajador = async (data: TrabajadorRequest): Promise<Trabajador> =>
  (await apiClient.post<Trabajador>('/nomina/trabajadores', data)).data;

export const actualizarTrabajador = async (id: number, data: TrabajadorRequest): Promise<Trabajador> =>
  (await apiClient.put<Trabajador>(`/nomina/trabajadores/${id}`, data)).data;

export const listarPagosTrabajador = async (trabajadorId: number): Promise<PagoNomina[]> =>
  (await apiClient.get<PagoNomina[]>(`/nomina/trabajadores/${trabajadorId}/pagos`)).data;

export const confirmarPagoNomina = async (
  trabajadorId: number,
  data: ConfirmarPagoNominaRequest
): Promise<PagoNomina> => (await apiClient.post<PagoNomina>(`/nomina/trabajadores/${trabajadorId}/pagos`, data)).data;
