import { apiClient } from '@/api/client';

export type FrecuenciaPrestamo = 'MENSUAL' | 'QUINCENAL' | 'SEMANAL';
export type MetodoPagoCuota = 'EFECTIVO' | 'TRANSFERENCIA';

export interface CuotaPrestamo {
  id: number;
  numeroCuota: number;
  fechaVencimiento: string;
  montoCuota: number;
  estado: 'PENDIENTE' | 'PAGADA';
  vencida: boolean;
  fechaPago: string | null;
  montoPagado: number | null;
  metodoPago: MetodoPagoCuota | null;
  comprobante: string | null;
  confirmadoPorNombre: string | null;
  observaciones: string | null;
}

export interface Prestamo {
  id: number;
  clienteId: number;
  clienteNombre: string;
  sucursalId: number;
  sucursalNombre: string;
  montoPrincipal: number;
  tasaInteres: number | null;
  numeroCuotas: number;
  frecuenciaPago: FrecuenciaPrestamo;
  fechaInicio: string;
  estado: 'ACTIVO' | 'PAGADO' | 'CANCELADO';
  notas: string | null;
  saldoPendiente: number;
  cuotas: CuotaPrestamo[];
}

export interface PrestamoRequest {
  clienteId: number;
  sucursalId: number;
  montoPrincipal: number;
  tasaInteres?: number;
  numeroCuotas: number;
  frecuenciaPago: FrecuenciaPrestamo;
  fechaInicio: string;
  notas?: string;
}

export interface PagarCuotaRequest {
  montoPagado: number;
  metodoPago: MetodoPagoCuota;
  comprobante?: string;
  observaciones?: string;
}

export interface ClienteResumenPrestamos {
  clienteId: number;
  clienteNombre: string;
  totalPendiente: number;
  cuotasVencidas: number;
  prestamos: Prestamo[];
}

export const listarPrestamos = async (): Promise<Prestamo[]> => (await apiClient.get<Prestamo[]>('/prestamos')).data;

export const obtenerPrestamo = async (id: number): Promise<Prestamo> => (await apiClient.get<Prestamo>(`/prestamos/${id}`)).data;

export const crearPrestamo = async (data: PrestamoRequest): Promise<Prestamo> =>
  (await apiClient.post<Prestamo>('/prestamos', data)).data;

export const pagarCuota = async (prestamoId: number, cuotaId: number, data: PagarCuotaRequest): Promise<Prestamo> =>
  (await apiClient.post<Prestamo>(`/prestamos/${prestamoId}/cuotas/${cuotaId}/pagar`, data)).data;

export const actualizarPagoCuota = async (prestamoId: number, cuotaId: number, data: PagarCuotaRequest): Promise<Prestamo> =>
  (await apiClient.put<Prestamo>(`/prestamos/${prestamoId}/cuotas/${cuotaId}/pago`, data)).data;

export const resumenClientePrestamos = async (clienteId: number): Promise<ClienteResumenPrestamos> =>
  (await apiClient.get<ClienteResumenPrestamos>(`/prestamos/cliente/${clienteId}/resumen`)).data;
