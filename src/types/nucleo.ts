export interface UsuarioEmpleado {
  id: number;
  nombre: string;
  apellido: string | null;
  username: string;
  email: string;
  telefono: string | null;
  estado: boolean;
  ultimoAcceso: string | null;
  roles: string[];
  rolIds: number[];
  sucursales: string[];
  sucursalIds: number[];
  passwordTemporal: string | null;
}

export interface UsuarioRequest {
  nombre: string;
  apellido?: string;
  username: string;
  email: string;
  password?: string;
  telefono?: string;
  rolIds: number[];
  sucursalIds?: number[];
}

export interface UsuarioEditRequest {
  nombre: string;
  apellido?: string;
  email: string;
  telefono?: string;
  rolIds: number[];
  sucursalIds?: number[];
}

export interface Rol {
  id: number;
  nombre: string;
  descripcion: string | null;
  esPredeterminado: boolean;
  permisos: string[];
}

export interface Permiso {
  id: number;
  modulo: string;
  accion: string;
  codigo: string;
  descripcion: string | null;
}

export interface RolRequest {
  nombre: string;
  descripcion?: string;
  permisoIds: number[];
}

export interface SucursalRequest {
  nombre: string;
  direccion?: string;
  telefono?: string;
  montoMaximoEfectivo?: number | null;
  alertaEfectivoActiva?: boolean;
  emailNotificaciones?: string | null;
}
