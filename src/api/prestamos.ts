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
  estado: 'ACTIVO' | 'PAGADO' | 'REFINANCIADO' | 'RENOVADO' | 'EN_MORA' | 'CANCELADO';
  renovadoDesdeId: number | null;
  tipoRenovacion: TipoRenovacion | null;
  notas: string | null;
  saldoPendiente: number;
  cuotas: CuotaPrestamo[];
}

export type TipoRenovacion = 'RENOVACION' | 'REFINANCIACION' | 'AMPLIACION' | 'COMPRA_CARTERA';

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

export interface InfoRenovacion {
  prestamoId: number;
  clienteId: number;
  clienteNombre: string;
  capitalPendiente: number;
  interesPendiente: number;
  saldoPendienteTotal: number;
  cuotasPagadas: number;
  cuotasFaltantes: number;
  calificacionCliente: 'BUENA' | 'REGULAR' | 'MALA' | 'SIN_HISTORIAL';
  historialCliente: Prestamo[];
}

export interface RenovarPrestamoRequest {
  tipoRenovacion: TipoRenovacion;
  montoNuevo?: number;
  tasaInteres?: number;
  numeroCuotas: number;
  frecuenciaPago: FrecuenciaPrestamo;
  fechaInicio: string;
  notas?: string;
}

export interface RenovacionResultado {
  prestamoAnterior: Prestamo;
  prestamoNuevo: Prestamo;
  saldoCanceladoAnterior: number;
  dineroEntregadoAlCliente: number;
}

export interface PrestamoDashboard {
  prestamosActivos: number;
  prestamosEnMora: number;
  prestamosRenovados: number;
  refinanciaciones: number;
  clientesElegiblesParaRenovar: number;
  clientesEnMora: number;
  valorTotalPrestado: number;
  capitalRecuperado: number;
  interesesGenerados: number;
  rentabilidadMensual: number;
  tasaRenovacion: number;
  proximosVencimientos: {
    prestamoId: number;
    clienteNombre: string;
    numeroCuota: number;
    fechaVencimiento: string;
    montoCuota: number;
  }[];
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

export const obtenerInfoRenovacion = async (prestamoId: number): Promise<InfoRenovacion> =>
  (await apiClient.get<InfoRenovacion>(`/prestamos/${prestamoId}/renovar/info`)).data;

export const renovarPrestamo = async (prestamoId: number, data: RenovarPrestamoRequest): Promise<RenovacionResultado> =>
  (await apiClient.post<RenovacionResultado>(`/prestamos/${prestamoId}/renovar`, data)).data;

export const obtenerDashboardPrestamos = async (): Promise<PrestamoDashboard> =>
  (await apiClient.get<PrestamoDashboard>('/prestamos/dashboard')).data;
