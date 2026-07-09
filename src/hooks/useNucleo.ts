import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as nucleoApi from '@/api/nucleo';
import type { RolRequest, SucursalRequest, UsuarioEditRequest, UsuarioRequest } from '@/types/nucleo';

export function useUsuarios() {
  return useQuery({ queryKey: ['usuarios'], queryFn: nucleoApi.listarUsuarios });
}

export function useCrearUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UsuarioRequest) => nucleoApi.crearUsuario(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });
}

export function useEditarUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UsuarioEditRequest }) => nucleoApi.editarUsuario(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });
}

export function useDesactivarUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => nucleoApi.desactivarUsuario(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });
}

export function useReactivarUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => nucleoApi.reactivarUsuario(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });
}

export function useRoles() {
  return useQuery({ queryKey: ['roles'], queryFn: nucleoApi.listarRoles });
}

export function useCrearRol() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RolRequest) => nucleoApi.crearRol(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  });
}

export function useActualizarRol() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: RolRequest }) => nucleoApi.actualizarRol(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  });
}

export function usePermisos() {
  return useQuery({ queryKey: ['permisos'], queryFn: nucleoApi.listarPermisos });
}

export function useCrearSucursal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SucursalRequest) => nucleoApi.crearSucursal(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sucursales'] }),
  });
}
