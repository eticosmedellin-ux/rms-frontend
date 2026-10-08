export interface LoginRequest {
  username: string;
  password: string;
  codigoDobleFactor?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  usuarioId: number;
  username: string;
  nombreCompleto: string;
  empresaId: number;
  nombreEmpresa: string;
  roles: string[];
  permisos: string[];
  esSuperadmin: boolean;
  esAdministradorTotal: boolean;
  accesoClientesContables?: boolean;
}

export interface ApiErrorBody {
  timestamp: string;
  status: number;
  error: string;
  mensaje: string;
}
