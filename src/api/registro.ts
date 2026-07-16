import { apiClient } from '@/api/client';

export interface RegistroEmpresaRequest {
  codigoInvitacion: string;
  nombreEmpresa: string;
  nombreComercial?: string;
  nit?: string;
  moneda?: string;
  zonaHoraria?: string;
  nombreSucursal?: string;
  tiposNegocioIds: number[];
  administrador: {
    nombre: string;
    apellido?: string;
    username: string;
    email: string;
    password: string;
  };
}

export interface RegistroEmpresaResponse {
  empresaId: number;
  nombreEmpresa: string;
  sucursalId: number;
  nombreSucursal: string;
  usuarioId: number;
  username: string;
  mensaje: string;
}

export const registrarEmpresa = async (data: RegistroEmpresaRequest): Promise<RegistroEmpresaResponse> =>
  (await apiClient.post<RegistroEmpresaResponse>('/registro-empresa', data)).data;
