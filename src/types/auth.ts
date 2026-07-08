export interface LoginRequest {
  username: string;
  password: string;
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
  esSuperadmin: boolean;
}

export interface ApiErrorBody {
  timestamp: string;
  status: number;
  error: string;
  mensaje: string;
}
