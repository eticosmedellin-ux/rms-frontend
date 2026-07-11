import { apiClient } from '@/api/client';
import type {
  KardexLinea, CompraLinea, GastoLinea, ClienteReporte, ProveedorReporte, ArqueoReporte, CuentaPorPagarReporte,
} from '@/types/reportesExtendidos';

export const reporteKardex = async (desde: string, hasta: string): Promise<KardexLinea[]> =>
  (await apiClient.get<KardexLinea[]>('/reportes/kardex', { params: { desde, hasta } })).data;

export const reporteCompras = async (desde: string, hasta: string): Promise<CompraLinea[]> =>
  (await apiClient.get<CompraLinea[]>('/reportes/compras', { params: { desde, hasta } })).data;

export const reporteGastos = async (desde: string, hasta: string): Promise<GastoLinea[]> =>
  (await apiClient.get<GastoLinea[]>('/reportes/gastos', { params: { desde, hasta } })).data;

export const reporteClientes = async (): Promise<ClienteReporte[]> =>
  (await apiClient.get<ClienteReporte[]>('/reportes/clientes')).data;

export const reporteProveedores = async (): Promise<ProveedorReporte[]> =>
  (await apiClient.get<ProveedorReporte[]>('/reportes/proveedores')).data;

export const reporteArqueos = async (desde: string, hasta: string): Promise<ArqueoReporte[]> =>
  (await apiClient.get<ArqueoReporte[]>('/reportes/arqueos', { params: { desde, hasta } })).data;

export const reporteCuentasPorPagar = async (): Promise<CuentaPorPagarReporte[]> =>
  (await apiClient.get<CuentaPorPagarReporte[]>('/reportes/cuentas-por-pagar')).data;
