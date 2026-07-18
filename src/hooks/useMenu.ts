import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as menuApi from '@/api/menu';

export function useMenuPublico(sucursalId: number | null) {
  return useQuery({
    queryKey: ['menu-publico', sucursalId],
    queryFn: () => menuApi.listarMenuPublico(sucursalId as number),
    enabled: sucursalId !== null,
    retry: false,
  });
}

export function useMenuArchivos() {
  return useQuery({ queryKey: ['menu-archivos'], queryFn: menuApi.listarMenu });
}

export function useSubirArchivoMenu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: menuApi.MenuArchivoRequest) => menuApi.subirArchivoMenu(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['menu-archivos'] }),
  });
}

export function useActivarArchivoMenu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, activo }: { id: number; activo: boolean }) => menuApi.activarArchivoMenu(id, activo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['menu-archivos'] }),
  });
}

export function useEliminarArchivoMenu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => menuApi.eliminarArchivoMenu(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['menu-archivos'] }),
  });
}
