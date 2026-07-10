import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as combosApi from '@/api/combos';
import type { ComboRequest } from '@/types/inventario';

export function useCombos() {
  return useQuery({ queryKey: ['combos'], queryFn: combosApi.listarCombos });
}

export function useCrearCombo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ComboRequest) => combosApi.crearCombo(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['combos'] }),
  });
}

export function useActualizarCombo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ComboRequest }) => combosApi.actualizarCombo(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['combos'] }),
  });
}

export function useDesactivarCombo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => combosApi.desactivarCombo(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['combos'] }),
  });
}

export function useReactivarCombo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => combosApi.reactivarCombo(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['combos'] }),
  });
}
