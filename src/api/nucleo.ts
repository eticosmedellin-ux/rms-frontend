import { apiClient } from '@/api/client';
import type { UsuarioEmpleado, UsuarioRequest, UsuarioEditRequest, Rol, RolRequest, Permiso, SucursalRequest } from '@/types/nucleo';
import type { Sucursal } from '@/api/sucursales';

export const listarUsuarios = async (): Promise<UsuarioEmpleado[]> =>
  (await apiClient.get<UsuarioEmpleado[]>('/usuarios')).data;

export const crearUsuario = async (data: UsuarioRequest): Promise<UsuarioEmpleado> =>
  (await apiClient.post<UsuarioEmpleado>('/usuarios', data)).data;

export const editarUsuario = async (id: number, data: UsuarioEditRequest): Promise<UsuarioEmpleado> =>
  (await apiClient.put<UsuarioEmpleado>(`/usuarios/${id}`, data)).data;

export const desactivarUsuario = async (id: number): Promise<void> => {
  await apiClient.post(`/usuarios/${id}/desactivar`);
};

export const reactivarUsuario = async (id: number): Promise<void> => {
  await apiClient.post(`/usuarios/${id}/reactivar`);
};

export const listarRoles = async (): Promise<Rol[]> => (await apiClient.get<Rol[]>('/roles')).data;

export const crearRol = async (data: RolRequest): Promise<Rol> =>
  (await apiClient.post<Rol>('/roles', data)).data;

export const actualizarRol = async (id: number, data: RolRequest): Promise<Rol> =>
  (await apiClient.put<Rol>(`/roles/${id}`, data)).data;

export const listarPermisos = async (): Promise<Permiso[]> =>
  (await apiClient.get<Permiso[]>('/permisos')).data;

export const crearSucursal = async (data: SucursalRequest): Promise<Sucursal> =>
  (await apiClient.post<Sucursal>('/sucursales', data)).data;

export const actualizarSucursal = async (id: number, data: SucursalRequest): Promise<Sucursal> =>
  (await apiClient.put<Sucursal>(`/sucursales/${id}`, data)).data;
