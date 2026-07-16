import { apiClient } from '@/api/client';

export interface TipoServicio {
  id: number;
  nombre: string;
  duracionMinutos: number | null;
  precio: number | null;
  activo: boolean;
}

export interface TipoServicioRequest {
  nombre: string;
  duracionMinutos?: number;
  precio?: number;
  activo?: boolean;
}

export type EstadoCita = 'PROGRAMADA' | 'CONFIRMADA' | 'EN_CURSO' | 'COMPLETADA' | 'CANCELADA' | 'NO_ASISTIO';

export interface Cita {
  id: number;
  sucursalId: number;
  sucursalNombre: string;
  clienteId: number | null;
  clienteNombre: string | null;
  tipoServicioId: number | null;
  tipoServicioNombre: string | null;
  asignadoAId: number | null;
  asignadoANombre: string | null;
  fechaHora: string;
  duracionMinutos: number;
  estado: EstadoCita;
  notas: string | null;
}

export interface CitaRequest {
  sucursalId: number;
  clienteId?: number;
  tipoServicioId?: number;
  asignadoAUsuarioId?: number;
  fechaHora: string;
  duracionMinutos?: number;
  notas?: string;
}

export type EstadoOrden = 'RECIBIDA' | 'EN_PROCESO' | 'ESPERANDO_REPUESTOS' | 'LISTA' | 'ENTREGADA' | 'CANCELADA';
export type PrioridadOrden = 'BAJA' | 'MEDIA' | 'ALTA';

export interface OrdenTrabajo {
  id: number;
  titulo: string;
  descripcion: string | null;
  sucursalId: number;
  sucursalNombre: string;
  clienteId: number | null;
  clienteNombre: string | null;
  asignadoAId: number | null;
  asignadoANombre: string | null;
  estado: EstadoOrden;
  prioridad: PrioridadOrden;
  fechaRecepcion: string;
  fechaEstimadaEntrega: string | null;
  fechaEntregaReal: string | null;
  costoEstimado: number | null;
  costoFinal: number | null;
  notas: string | null;
  creadoEn: string;
}

export interface OrdenTrabajoRequest {
  titulo: string;
  descripcion?: string;
  sucursalId: number;
  clienteId?: number;
  asignadoAUsuarioId?: number;
  prioridad?: PrioridadOrden;
  fechaEstimadaEntrega?: string;
  costoEstimado?: number;
  notas?: string;
}

export const listarTiposServicio = async (): Promise<TipoServicio[]> =>
  (await apiClient.get<TipoServicio[]>('/servicios/tipos')).data;

export const crearTipoServicio = async (data: TipoServicioRequest): Promise<TipoServicio> =>
  (await apiClient.post<TipoServicio>('/servicios/tipos', data)).data;

export const actualizarTipoServicio = async (id: number, data: TipoServicioRequest): Promise<TipoServicio> =>
  (await apiClient.put<TipoServicio>(`/servicios/tipos/${id}`, data)).data;

export const listarCitas = async (): Promise<Cita[]> => (await apiClient.get<Cita[]>('/servicios/citas')).data;

export const listarCitasHistorial = async (): Promise<Cita[]> =>
  (await apiClient.get<Cita[]>('/servicios/citas/historial')).data;

export const crearCita = async (data: CitaRequest): Promise<Cita> =>
  (await apiClient.post<Cita>('/servicios/citas', data)).data;

export const actualizarCita = async (id: number, data: CitaRequest): Promise<Cita> =>
  (await apiClient.put<Cita>(`/servicios/citas/${id}`, data)).data;

export const cambiarEstadoCita = async (id: number, estado: EstadoCita): Promise<Cita> =>
  (await apiClient.patch<Cita>(`/servicios/citas/${id}/estado`, { estado })).data;

export const listarOrdenes = async (soloActivas = false): Promise<OrdenTrabajo[]> =>
  (await apiClient.get<OrdenTrabajo[]>('/servicios/ordenes', { params: { soloActivas } })).data;

export const crearOrden = async (data: OrdenTrabajoRequest): Promise<OrdenTrabajo> =>
  (await apiClient.post<OrdenTrabajo>('/servicios/ordenes', data)).data;

export const actualizarOrden = async (id: number, data: OrdenTrabajoRequest): Promise<OrdenTrabajo> =>
  (await apiClient.put<OrdenTrabajo>(`/servicios/ordenes/${id}`, data)).data;

export const cambiarEstadoOrden = async (
  id: number,
  data: { estado: EstadoOrden; costoFinal?: number; fechaEntregaReal?: string }
): Promise<OrdenTrabajo> => (await apiClient.patch<OrdenTrabajo>(`/servicios/ordenes/${id}/estado`, data)).data;
