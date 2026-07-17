import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as domiciliosApi from '@/api/domicilios';
import type { EstadoDomicilio } from '@/api/domicilios';

export function useDomicilios(soloActivos = false) {
  return useQuery({
    queryKey: ['domicilios', soloActivos],
    queryFn: () => domiciliosApi.listarDomicilios(soloActivos),
    refetchInterval: 15000,
  });
}

export function useDomicilio(id: number | null) {
  return useQuery({
    queryKey: ['domicilio', id],
    queryFn: () => domiciliosApi.obtenerDomicilio(id as number),
    enabled: id !== null,
  });
}

export function useCrearDomicilio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: domiciliosApi.DomicilioRequest) => domiciliosApi.crearDomicilio(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['domicilios'] }),
  });
}

export function useCambiarEstadoDomicilio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado, repartidorUsuarioId }: { id: number; estado: EstadoDomicilio; repartidorUsuarioId?: number }) =>
      domiciliosApi.cambiarEstadoDomicilio(id, estado, repartidorUsuarioId),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['domicilios'] });
      queryClient.invalidateQueries({ queryKey: ['domicilio', id] });
    },
  });
}

export function useConfirmarEntregaDomicilio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: domiciliosApi.ConfirmarEntregaRequest }) =>
      domiciliosApi.confirmarEntregaDomicilio(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domicilios'] });
      queryClient.invalidateQueries({ queryKey: ['ventas'] });
    },
  });
}

export function useCancelarDomicilio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => domiciliosApi.cancelarDomicilio(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['domicilios'] }),
  });
}
