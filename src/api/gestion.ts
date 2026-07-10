import { apiClient } from '@/api/client';
import type {
  CategoriaGasto,
  Gasto,
  GastoRequest,
  Alerta,
  ConfiguracionAlerta,
  ReporteVentas,
  ReporteUtilidad,
  ReporteValorInventario,
  MetodoPago,
  Impuesto,
  Empresa,
  EmpresaRequest,
  RegistroAuditoria,
  RegistroAcceso,
  ConfiguracionFacturacionElectronica,
  ConfiguracionFacturacionElectronicaRequest,
} from '@/types/gestion';

// --- Gastos ---
export const listarGastos = async (): Promise<Gasto[]> => (await apiClient.get<Gasto[]>('/gastos')).data;

export const registrarGasto = async (data: GastoRequest): Promise<Gasto> =>
  (await apiClient.post<Gasto>('/gastos', data)).data;

export const listarCategoriasGasto = async (): Promise<CategoriaGasto[]> =>
  (await apiClient.get<CategoriaGasto[]>('/gastos/categorias')).data;

export const crearCategoriaGasto = async (data: { nombre: string; tipo: string }): Promise<CategoriaGasto> =>
  (await apiClient.post<CategoriaGasto>('/gastos/categorias', data)).data;

// --- Alertas ---
export const generarAlertas = async (): Promise<Alerta[]> =>
  (await apiClient.post<Alerta[]>('/alertas/generar')).data;

export const listarAlertas = async (): Promise<Alerta[]> => (await apiClient.get<Alerta[]>('/alertas')).data;

export const descartarAlerta = async (id: number): Promise<void> => {
  await apiClient.post(`/alertas/${id}/descartar`);
};

export const listarConfiguracionAlertas = async (): Promise<ConfiguracionAlerta[]> =>
  (await apiClient.get<ConfiguracionAlerta[]>('/alertas/configuracion')).data;

export const guardarConfiguracionAlerta = async (data: {
  tipoAlerta: string;
  activa?: boolean;
  umbralDias?: number;
}): Promise<ConfiguracionAlerta> => (await apiClient.put<ConfiguracionAlerta>('/alertas/configuracion', data)).data;

// --- Reportes ---
export const obtenerReporteVentas = async (desde: string, hasta: string): Promise<ReporteVentas> =>
  (await apiClient.get<ReporteVentas>('/reportes/ventas', { params: { desde, hasta } })).data;

export const obtenerReporteUtilidad = async (desde: string, hasta: string): Promise<ReporteUtilidad> =>
  (await apiClient.get<ReporteUtilidad>('/reportes/utilidad', { params: { desde, hasta } })).data;

export const obtenerReporteValorInventario = async (): Promise<ReporteValorInventario[]> =>
  (await apiClient.get<ReporteValorInventario[]>('/reportes/inventario-valor')).data;

// --- Configuración ---
export const listarMetodosPago = async (): Promise<MetodoPago[]> =>
  (await apiClient.get<MetodoPago[]>('/configuracion/metodos-pago')).data;

export const crearMetodoPago = async (nombre: string): Promise<MetodoPago> =>
  (await apiClient.post<MetodoPago>('/configuracion/metodos-pago', { nombre })).data;

export const listarImpuestos = async (): Promise<Impuesto[]> =>
  (await apiClient.get<Impuesto[]>('/configuracion/impuestos')).data;

export const crearImpuesto = async (data: { nombre: string; porcentaje: number; esDefault?: boolean }): Promise<Impuesto> =>
  (await apiClient.post<Impuesto>('/configuracion/impuestos', data)).data;

// --- Empresa ---
export const obtenerEmpresa = async (): Promise<Empresa> => (await apiClient.get<Empresa>('/empresa')).data;

export const actualizarEmpresa = async (data: EmpresaRequest): Promise<Empresa> =>
  (await apiClient.put<Empresa>('/empresa', data)).data;

// --- Auditoría ---
export const listarAuditoria = async (): Promise<RegistroAuditoria[]> =>
  (await apiClient.get<RegistroAuditoria[]>('/auditoria')).data;

// --- Historial de accesos ---
export const listarHistorialAcceso = async (): Promise<RegistroAcceso[]> =>
  (await apiClient.get<RegistroAcceso[]>('/historial-acceso')).data;

// --- Facturación electrónica ---
export const obtenerConfiguracionFacturacionElectronica = async (): Promise<ConfiguracionFacturacionElectronica> =>
  (await apiClient.get<ConfiguracionFacturacionElectronica>('/configuracion-facturacion-electronica')).data;

export const guardarConfiguracionFacturacionElectronica = async (
  data: ConfiguracionFacturacionElectronicaRequest
): Promise<ConfiguracionFacturacionElectronica> =>
  (await apiClient.put<ConfiguracionFacturacionElectronica>('/configuracion-facturacion-electronica', data)).data;
