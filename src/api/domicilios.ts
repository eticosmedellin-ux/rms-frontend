import { apiClient } from '@/api/client';
import type { Venta } from '@/types/pos';

export type EstadoDomicilio = 'RECIBIDO' | 'EN_PREPARACION' | 'EN_CAMINO' | 'ENTREGADO' | 'CANCELADO';

export interface DomicilioItem {
  id: number;
  productoId: number;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
}

export interface Domicilio {
  id: number;
  sucursalId: number;
  sucursalNombre: string;
  clienteId: number | null;
  clienteNombre: string | null;
  canal: string;
  direccionEntrega: string;
  telefonoContacto: string | null;
  repartidorId: number | null;
  repartidorNombre: string | null;
  estado: EstadoDomicilio;
  notas: string | null;
  creadoEn: string;
  fechaEntrega: string | null;
  ventaId: number | null;
  total: number;
  items: DomicilioItem[];
}

export interface DomicilioRequest {
  sucursalId: number;
  clienteId?: number;
  canal: string;
  direccionEntrega: string;
  telefonoContacto?: string;
  repartidorUsuarioId?: number;
  notas?: string;
  items: { productoId: number; cantidad: number }[];
}

export interface ConfirmarEntregaRequest {
  cajaSesionId: number;
  pagos: { metodoPago: string; monto: number }[];
  tipoDescuentoFacturaId?: number;
  facturar?: boolean;
}

export const listarDomicilios = async (soloActivos = false): Promise<Domicilio[]> =>
  (await apiClient.get<Domicilio[]>('/domicilios', { params: { soloActivos } })).data;

export const obtenerDomicilio = async (id: number): Promise<Domicilio> =>
  (await apiClient.get<Domicilio>(`/domicilios/${id}`)).data;

export const crearDomicilio = async (data: DomicilioRequest): Promise<Domicilio> =>
  (await apiClient.post<Domicilio>('/domicilios', data)).data;

export const cambiarEstadoDomicilio = async (
  id: number,
  estado: EstadoDomicilio,
  repartidorUsuarioId?: number
): Promise<Domicilio> => (await apiClient.patch<Domicilio>(`/domicilios/${id}/estado`, { estado, repartidorUsuarioId })).data;

export const confirmarEntregaDomicilio = async (id: number, data: ConfirmarEntregaRequest): Promise<Venta> =>
  (await apiClient.post<Venta>(`/domicilios/${id}/confirmar-entrega`, data)).data;

export const cancelarDomicilio = async (id: number): Promise<void> => {
  await apiClient.post(`/domicilios/${id}/cancelar`);
};
