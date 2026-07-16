import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as restauranteApi from '@/api/restaurante';
import type { EstadoItemComanda } from '@/api/restaurante';

export function useMesas() {
  return useQuery({ queryKey: ['mesas'], queryFn: restauranteApi.listarMesas });
}

export function useCrearMesa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: restauranteApi.MesaRequest) => restauranteApi.crearMesa(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mesas'] }),
  });
}

export function useActualizarMesa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: restauranteApi.MesaRequest }) => restauranteApi.actualizarMesa(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mesas'] }),
  });
}

export function useAbrirComanda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ mesaId, data }: { mesaId: number; data: { numeroComensales?: number; notas?: string } }) =>
      restauranteApi.abrirComanda(mesaId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mesas'] });
      queryClient.invalidateQueries({ queryKey: ['comandas-activas'] });
    },
  });
}

export function useComandasActivas() {
  return useQuery({ queryKey: ['comandas-activas'], queryFn: restauranteApi.listarComandasActivas, refetchInterval: 15000 });
}

export function useComanda(id: number | null) {
  return useQuery({
    queryKey: ['comanda', id],
    queryFn: () => restauranteApi.obtenerComanda(id as number),
    enabled: id !== null,
    refetchInterval: 10000,
  });
}

export function useAgregarItemComanda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ comandaId, data }: { comandaId: number; data: { productoId: number; cantidad: number; notas?: string } }) =>
      restauranteApi.agregarItemComanda(comandaId, data),
    onSuccess: (_data, { comandaId }) => {
      queryClient.invalidateQueries({ queryKey: ['comanda', comandaId] });
      queryClient.invalidateQueries({ queryKey: ['comandas-activas'] });
    },
  });
}

export function useCambiarEstadoItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ comandaId, itemId, estado }: { comandaId: number; itemId: number; estado: EstadoItemComanda }) =>
      restauranteApi.cambiarEstadoItem(comandaId, itemId, estado),
    onSuccess: (_data, { comandaId }) => {
      queryClient.invalidateQueries({ queryKey: ['comanda', comandaId] });
      queryClient.invalidateQueries({ queryKey: ['comandas-activas'] });
    },
  });
}

export function useCerrarComanda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ comandaId, data }: { comandaId: number; data: restauranteApi.CerrarComandaRequest }) =>
      restauranteApi.cerrarComanda(comandaId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mesas'] });
      queryClient.invalidateQueries({ queryKey: ['comandas-activas'] });
      queryClient.invalidateQueries({ queryKey: ['ventas'] });
    },
  });
}

export function useCancelarComanda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (comandaId: number) => restauranteApi.cancelarComanda(comandaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mesas'] });
      queryClient.invalidateQueries({ queryKey: ['comandas-activas'] });
    },
  });
}
