import { apiClient } from '@/api/client';
import type {
  Proveedor,
  ProveedorRequest,
  OrdenCompra,
  OrdenCompraRequest,
  RecepcionCompraRequest,
  FacturaCompra,
  FacturaCompraRequest,
  CuentaPorPagar,
  AbonoProveedorRequest,
} from '@/types/compras';

// --- Proveedores ---
export const listarProveedores = async (): Promise<Proveedor[]> =>
  (await apiClient.get<Proveedor[]>('/proveedores')).data;

export const crearProveedor = async (data: ProveedorRequest): Promise<Proveedor> =>
  (await apiClient.post<Proveedor>('/proveedores', data)).data;

// --- Órdenes de compra ---
export const listarOrdenesCompra = async (): Promise<OrdenCompra[]> =>
  (await apiClient.get<OrdenCompra[]>('/ordenes-compra')).data;

export const crearOrdenCompra = async (data: OrdenCompraRequest): Promise<OrdenCompra> =>
  (await apiClient.post<OrdenCompra>('/ordenes-compra', data)).data;

export const enviarOrdenCompra = async (id: number): Promise<OrdenCompra> =>
  (await apiClient.post<OrdenCompra>(`/ordenes-compra/${id}/enviar`)).data;

export const cancelarOrdenCompra = async (id: number): Promise<OrdenCompra> =>
  (await apiClient.post<OrdenCompra>(`/ordenes-compra/${id}/cancelar`)).data;

// --- Recepciones ---
export const registrarRecepcion = async (data: RecepcionCompraRequest): Promise<void> => {
  await apiClient.post('/recepciones-compra', data);
};

// --- Facturas ---
export const registrarFactura = async (data: FacturaCompraRequest): Promise<FacturaCompra> =>
  (await apiClient.post<FacturaCompra>('/facturas-compra', data)).data;

export const listarFacturasPorProveedor = async (proveedorId: number): Promise<FacturaCompra[]> =>
  (await apiClient.get<FacturaCompra[]>(`/facturas-compra/proveedor/${proveedorId}`)).data;

// --- Cuentas por pagar ---
export const listarCuentasPorPagar = async (proveedorId: number): Promise<CuentaPorPagar[]> =>
  (await apiClient.get<CuentaPorPagar[]>(`/cuentas-por-pagar/proveedor/${proveedorId}`)).data;

export const abonarCuentaPorPagar = async (cuentaId: number, data: AbonoProveedorRequest): Promise<void> => {
  await apiClient.post(`/cuentas-por-pagar/${cuentaId}/abonos`, data);
};
