import { apiClient } from '@/api/client';
import type { PlanEmpresa, PlanEmpresaRequest, RutaPlan } from '@/types/gestion';

export interface EmpresaPlataforma {
  id: number;
  nombre: string;
  nombreComercial: string | null;
  nit: string | null;
  estado: boolean;
  cantidadUsuarios: number;
  creadoEn: string;
}

export interface CodigoInvitacion {
  id: number;
  codigo: string;
  usado: boolean;
  empresaCreada: string | null;
  nota: string | null;
  creadoEn: string;
  usadoEn: string | null;
}

export const listarEmpresasPlataforma = async (): Promise<EmpresaPlataforma[]> =>
  (await apiClient.get<EmpresaPlataforma[]>('/plataforma/empresas')).data;

export const suspenderEmpresa = async (id: number): Promise<void> => {
  await apiClient.post(`/plataforma/empresas/${id}/suspender`);
};

export const eliminarEmpresa = async (id: number): Promise<void> => {
  await apiClient.delete(`/plataforma/empresas/${id}`);
};

export const activarEmpresa = async (id: number): Promise<void> => {
  await apiClient.post(`/plataforma/empresas/${id}/activar`);
};

export const listarCodigosInvitacion = async (): Promise<CodigoInvitacion[]> =>
  (await apiClient.get<CodigoInvitacion[]>('/plataforma/codigos-invitacion')).data;

export const generarCodigoInvitacion = async (nota?: string): Promise<CodigoInvitacion> =>
  (await apiClient.post<CodigoInvitacion>('/plataforma/codigos-invitacion', { nota })).data;

// --- Planes y licencias ---

export const obtenerCatalogoRutas = async (): Promise<RutaPlan[]> =>
  (await apiClient.get<RutaPlan[]>('/plataforma/catalogo-rutas')).data;

export const obtenerPlanEmpresa = async (empresaId: number): Promise<PlanEmpresa> =>
  (await apiClient.get<PlanEmpresa>(`/plataforma/empresas/${empresaId}/plan`)).data;

export const actualizarPlanEmpresa = async (empresaId: number, data: PlanEmpresaRequest): Promise<PlanEmpresa> =>
  (await apiClient.put<PlanEmpresa>(`/plataforma/empresas/${empresaId}/plan`, data)).data;

export const obtenerMiPlan = async (): Promise<PlanEmpresa> =>
  (await apiClient.get<PlanEmpresa>('/mi-plan')).data;

// --- Noticias del login (barra de anuncios en la pantalla de login, de plataforma) ---

export interface NoticiaLogin {
  id: number;
  mensaje: string;
  tipo: 'INFO' | 'ADVERTENCIA' | 'EXITO';
  activa: boolean;
  creadoEn: string;
}

export interface NoticiaLoginRequest {
  mensaje: string;
  tipo?: 'INFO' | 'ADVERTENCIA' | 'EXITO';
  activa?: boolean;
}

/** Público — no requiere sesión, la consume la pantalla de login. */
export const listarNoticiasLoginActivas = async (): Promise<NoticiaLogin[]> =>
  (await apiClient.get<NoticiaLogin[]>('/noticias-login/activas')).data;

export const listarNoticiasLogin = async (): Promise<NoticiaLogin[]> =>
  (await apiClient.get<NoticiaLogin[]>('/noticias-login')).data;

export const crearNoticiaLogin = async (data: NoticiaLoginRequest): Promise<NoticiaLogin> =>
  (await apiClient.post<NoticiaLogin>('/noticias-login', data)).data;

export const actualizarNoticiaLogin = async (id: number, data: NoticiaLoginRequest): Promise<NoticiaLogin> =>
  (await apiClient.put<NoticiaLogin>(`/noticias-login/${id}`, data)).data;

export const eliminarNoticiaLogin = async (id: number): Promise<void> => {
  await apiClient.delete(`/noticias-login/${id}`);
};

// --- Tipos de negocio ---

export interface TipoNegocioModulo {
  id: number;
  moduloClave: string;
  moduloEtiqueta: string;
  esFuturo: boolean;
}

export interface TipoNegocio {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  orden: number;
  modulos: TipoNegocioModulo[];
}

export interface TipoNegocioRequest {
  nombre: string;
  descripcion?: string;
  activo?: boolean;
  orden?: number;
}

export interface TipoNegocioModuloRequest {
  moduloClave: string;
  moduloEtiqueta: string;
  esFuturo?: boolean;
}

/** Público — lo consume el formulario de registro de empresa, sin sesión. */
export const listarTiposNegocioActivos = async (): Promise<TipoNegocio[]> =>
  (await apiClient.get<TipoNegocio[]>('/catalogo-tipos-negocio')).data;

export const listarTiposNegocio = async (): Promise<TipoNegocio[]> =>
  (await apiClient.get<TipoNegocio[]>('/plataforma/tipos-negocio')).data;

export const crearTipoNegocio = async (data: TipoNegocioRequest): Promise<TipoNegocio> =>
  (await apiClient.post<TipoNegocio>('/plataforma/tipos-negocio', data)).data;

export const actualizarTipoNegocio = async (id: number, data: TipoNegocioRequest): Promise<TipoNegocio> =>
  (await apiClient.put<TipoNegocio>(`/plataforma/tipos-negocio/${id}`, data)).data;

export const desactivarTipoNegocio = async (id: number): Promise<void> => {
  await apiClient.delete(`/plataforma/tipos-negocio/${id}`);
};

export const agregarModuloTipoNegocio = async (
  tipoNegocioId: number,
  data: TipoNegocioModuloRequest
): Promise<TipoNegocio> => (await apiClient.post<TipoNegocio>(`/plataforma/tipos-negocio/${tipoNegocioId}/modulos`, data)).data;

export const eliminarModuloTipoNegocio = async (moduloId: number): Promise<void> => {
  await apiClient.delete(`/plataforma/tipos-negocio/modulos/${moduloId}`);
};

// --- Dashboard ejecutivo ---

export interface DashboardEjecutivo {
  totalEmpresas: number;
  empresasActivas: number;
  empresasSuspendidas: number;
  empresasNuevasEsteMes: number;
  mrr: number;
  totalUsuarios: number;
  ingresosPorMes: { mes: string; monto: number }[];
  empresasPorTipoNegocio: { etiqueta: string; cantidad: number }[];
  modulosMasUsados: { etiqueta: string; cantidad: number }[];
  empresasEnRiesgo: { empresaId: number; nombreEmpresa: string; estadoSuscripcion: string; ultimoPagoMensaje: string | null }[];
}

export const obtenerDashboardEjecutivo = async (): Promise<DashboardEjecutivo> =>
  (await apiClient.get<DashboardEjecutivo>('/plataforma/dashboard')).data;
