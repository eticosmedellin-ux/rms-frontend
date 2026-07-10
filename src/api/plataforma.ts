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
