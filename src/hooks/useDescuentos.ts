import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as descuentosApi from '@/api/descuentos';
import type { TipoDescuentoRequest } from '@/types/pos';

export function useTiposDescuento() {
  return useQuery({ queryKey: ['tipos-descuento'], queryFn: descuentosApi.listarTiposDescuento });
}

export function useCrearTipoDescuento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TipoDescuentoRequest) => descuentosApi.crearTipoDescuento(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tipos-descuento'] }),
  });
}

export function useActualizarTipoDescuento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TipoDescuentoRequest }) =>
      descuentosApi.actualizarTipoDescuento(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tipos-descuento'] }),
  });
}

export function useDesactivarTipoDescuento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => descuentosApi.desactivarTipoDescuento(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tipos-descuento'] }),
  });
}

export function useReactivarTipoDescuento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => descuentosApi.reactivarTipoDescuento(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tipos-descuento'] }),
  });
}
