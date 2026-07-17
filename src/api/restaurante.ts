import { apiClient } from '@/api/client';
import type { Venta } from '@/types/pos';

export interface Mesa {
  id: number;
  numero: string;
  zona: string | null;
  capacidad: number | null;
  sucursalId: number;
  sucursalNombre: string;
  estado: 'LIBRE' | 'OCUPADA' | 'RESERVADA' | 'LIMPIEZA';
  activa: boolean;
  comandaActivaId: number | null;
}

export interface MesaRequest {
  numero: string;
  zona?: string;
  capacidad?: number;
  sucursalId: number;
  activa?: boolean;
}

export type EstadoItemComanda = 'PENDIENTE' | 'PREPARANDO' | 'LISTO' | 'ENTREGADO' | 'CANCELADO';

export interface ComandaItem {
  id: number;
  productoId: number;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  notas: string | null;
  estado: EstadoItemComanda;
}

export interface Comanda {
  id: number;
  mesaId: number;
  mesaNumero: string;
  meseroId: number;
  meseroNombre: string;
  estado: 'ABIERTA' | 'CERRADA' | 'CANCELADA';
  numeroComensales: number | null;
  notas: string | null;
  fechaApertura: string;
  fechaCierre: string | null;
  ventaId: number | null;
  total: number;
  propina: number | null;
  items: ComandaItem[];
}

export interface CerrarComandaRequest {
  cajaSesionId: number;
  clienteId?: number;
  pagos: { metodoPago: string; monto: number }[];
  tipoDescuentoFacturaId?: number;
  facturar?: boolean;
  propina?: number;
}

export const listarMesas = async (): Promise<Mesa[]> => (await apiClient.get<Mesa[]>('/restaurante/mesas')).data;

export const crearMesa = async (data: MesaRequest): Promise<Mesa> =>
  (await apiClient.post<Mesa>('/restaurante/mesas', data)).data;

export const actualizarMesa = async (id: number, data: MesaRequest): Promise<Mesa> =>
  (await apiClient.put<Mesa>(`/restaurante/mesas/${id}`, data)).data;

export const cambiarEstadoMesa = async (id: number, estado: Mesa['estado']): Promise<Mesa> =>
  (await apiClient.patch<Mesa>(`/restaurante/mesas/${id}/estado`, { estado })).data;

export const abrirComanda = async (
  mesaId: number,
  data: { numeroComensales?: number; notas?: string }
): Promise<Comanda> => (await apiClient.post<Comanda>(`/restaurante/mesas/${mesaId}/comandas`, data)).data;

export const listarComandasActivas = async (): Promise<Comanda[]> =>
  (await apiClient.get<Comanda[]>('/restaurante/comandas/activas')).data;

export const listarComandasHistorial = async (): Promise<Comanda[]> =>
  (await apiClient.get<Comanda[]>('/restaurante/comandas/historial')).data;

export const obtenerComanda = async (id: number): Promise<Comanda> =>
  (await apiClient.get<Comanda>(`/restaurante/comandas/${id}`)).data;

export const agregarItemComanda = async (
  comandaId: number,
  data: { productoId: number; cantidad: number; notas?: string }
): Promise<Comanda> => (await apiClient.post<Comanda>(`/restaurante/comandas/${comandaId}/items`, data)).data;

export const cambiarEstadoItem = async (
  comandaId: number,
  itemId: number,
  estado: EstadoItemComanda
): Promise<Comanda> => (await apiClient.patch<Comanda>(`/restaurante/comandas/${comandaId}/items/${itemId}`, { estado })).data;

export const cerrarComanda = async (comandaId: number, data: CerrarComandaRequest): Promise<Venta> =>
  (await apiClient.post<Venta>(`/restaurante/comandas/${comandaId}/cerrar`, data)).data;

export const cancelarComanda = async (comandaId: number): Promise<void> => {
  await apiClient.post(`/restaurante/comandas/${comandaId}/cancelar`);
};

export const cambiarMesaComanda = async (comandaId: number, nuevaMesaId: number): Promise<Comanda> =>
  (await apiClient.post<Comanda>(`/restaurante/comandas/${comandaId}/cambiar-mesa`, { nuevaMesaId })).data;

export const unirComanda = async (comandaId: number, otraComandaId: number): Promise<Comanda> =>
  (await apiClient.post<Comanda>(`/restaurante/comandas/${comandaId}/unir/${otraComandaId}`)).data;

export const asignarMesero = async (comandaId: number, meseroUsuarioId: number): Promise<Comanda> =>
  (await apiClient.patch<Comanda>(`/restaurante/comandas/${comandaId}/mesero`, { meseroUsuarioId })).data;
