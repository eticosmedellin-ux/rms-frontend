import { apiClient } from '@/api/client';
import type {
  Cliente,
  ClienteRequest,
  CajaSesion,
  CajaMovimiento,
  Venta,
  VentaRequest,
  DevolucionVentaRequest,
  DevolucionVentaResponse,
  CuentaPorCobrar,
  AbonoClienteRequest,
  Cotizacion,
  CotizacionRequest,
  ConvertirCotizacionRequest,
  NotaDebitoRequest,
  PaginaResponse,
  EstadoCuentaCliente,
} from '@/types/pos';
import type { FacturaElectronicaEstado } from '@/types/gestion';

// --- Clientes ---
export const listarClientes = async (): Promise<Cliente[]> =>
  (await apiClient.get<Cliente[]>('/clientes')).data;

export const crearCliente = async (data: ClienteRequest): Promise<Cliente> =>
  (await apiClient.post<Cliente>('/clientes', data)).data;

export const actualizarCliente = async (id: number, data: ClienteRequest): Promise<Cliente> =>
  (await apiClient.put<Cliente>(`/clientes/${id}`, data)).data;

export const obtenerEstadoCuentaCliente = async (clienteId: number): Promise<EstadoCuentaCliente> =>
  (await apiClient.get<EstadoCuentaCliente>(`/clientes/${clienteId}/estado-cuenta`)).data;

// --- Caja ---
export const obtenerCajaAbierta = async (sucursalId: number): Promise<CajaSesion | null> => {
  const response = await apiClient.get<CajaSesion>('/caja/abierta', {
    params: { sucursalId },
    validateStatus: (status) => status === 200 || status === 204,
  });
  return response.status === 204 ? null : response.data;
};

export const abrirCaja = async (data: { sucursalId: number; montoApertura: number }): Promise<CajaSesion> =>
  (await apiClient.post<CajaSesion>('/caja/abrir', data)).data;

export const cerrarCaja = async (id: number, montoCierreReal: number): Promise<CajaSesion> =>
  (await apiClient.post<CajaSesion>(`/caja/${id}/cerrar`, { montoCierreReal })).data;

export const listarMovimientosCaja = async (id: number): Promise<CajaMovimiento[]> =>
  (await apiClient.get<CajaMovimiento[]>(`/caja/${id}/movimientos`)).data;

export const registrarMovimientoCaja = async (
  id: number,
  data: { tipo: 'INGRESO' | 'EGRESO'; concepto: string; monto: number }
): Promise<CajaMovimiento> => (await apiClient.post<CajaMovimiento>(`/caja/${id}/movimientos`, data)).data;

// --- Ventas ---
export const listarVentas = async (): Promise<Venta[]> => (await apiClient.get<Venta[]>('/ventas')).data;

export const enviarFacturaPorCorreo = async (ventaId: number): Promise<void> => {
  await apiClient.post(`/ventas/${ventaId}/enviar-factura`);
};

export interface FiltrosVentas {
  desde?: string;
  hasta?: string;
  clienteId?: number;
  usuarioId?: number;
  sucursalId?: number;
  cajaSesionId?: number;
  texto?: string;
}

export const listarVentasPaginado = async (
  pagina: number, tamano: number, filtros: FiltrosVentas = {}
): Promise<PaginaResponse<Venta>> =>
  (await apiClient.get<PaginaResponse<Venta>>('/ventas/paginado', { params: { pagina, tamano, ...filtros } })).data;

export const registrarVenta = async (data: VentaRequest): Promise<Venta> =>
  (await apiClient.post<Venta>('/ventas', data)).data;

export const registrarDevolucion = async (
  ventaId: number,
  data: DevolucionVentaRequest
): Promise<DevolucionVentaResponse> =>
  (await apiClient.post<DevolucionVentaResponse>(`/ventas/${ventaId}/devoluciones`, data)).data;

export const crearNotaDebito = async (data: NotaDebitoRequest) =>
  (await apiClient.post('/notas-debito', data)).data;

export const obtenerFacturaElectronica = async (ventaId: number): Promise<FacturaElectronicaEstado> =>
  (await apiClient.get<FacturaElectronicaEstado>(`/ventas/${ventaId}/factura-electronica`)).data;

export const enviarFacturaElectronica = async (ventaId: number): Promise<FacturaElectronicaEstado> =>
  (await apiClient.post<FacturaElectronicaEstado>(`/ventas/${ventaId}/factura-electronica/enviar`)).data;

// --- Cuentas por cobrar ---
export const listarCuentasPorCobrar = async (clienteId: number): Promise<CuentaPorCobrar[]> =>
  (await apiClient.get<CuentaPorCobrar[]>(`/cuentas-por-cobrar/cliente/${clienteId}`)).data;

export const abonarCuentaPorCobrar = async (cuentaId: number, data: AbonoClienteRequest): Promise<void> => {
  await apiClient.post(`/cuentas-por-cobrar/${cuentaId}/abonos`, data);
};

// --- Cotizaciones ---
export const listarCotizaciones = async (): Promise<Cotizacion[]> =>
  (await apiClient.get<Cotizacion[]>('/cotizaciones')).data;

export const crearCotizacion = async (data: CotizacionRequest): Promise<Cotizacion> =>
  (await apiClient.post<Cotizacion>('/cotizaciones', data)).data;

export const convertirCotizacion = async (id: number, data: ConvertirCotizacionRequest): Promise<Cotizacion> =>
  (await apiClient.post<Cotizacion>(`/cotizaciones/${id}/convertir`, data)).data;
