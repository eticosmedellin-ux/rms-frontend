import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as prestamosApi from '@/api/prestamos';

export function usePrestamos() {
  return useQuery({ queryKey: ['prestamos'], queryFn: prestamosApi.listarPrestamos });
}

export function usePrestamo(id: number | null) {
  return useQuery({
    queryKey: ['prestamo', id],
    queryFn: () => prestamosApi.obtenerPrestamo(id as number),
    enabled: id !== null,
  });
}

export function useCrearPrestamo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: prestamosApi.PrestamoRequest) => prestamosApi.crearPrestamo(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prestamos'] }),
  });
}

export function usePagarCuota() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      prestamoId,
      cuotaId,
      data,
    }: {
      prestamoId: number;
      cuotaId: number;
      data: prestamosApi.PagarCuotaRequest;
    }) => prestamosApi.pagarCuota(prestamoId, cuotaId, data),
    onSuccess: (_data, { prestamoId }) => {
      queryClient.invalidateQueries({ queryKey: ['prestamo', prestamoId] });
      queryClient.invalidateQueries({ queryKey: ['prestamos'] });
    },
  });
}

export function useActualizarPagoCuota() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      prestamoId,
      cuotaId,
      data,
    }: {
      prestamoId: number;
      cuotaId: number;
      data: prestamosApi.PagarCuotaRequest;
    }) => prestamosApi.actualizarPagoCuota(prestamoId, cuotaId, data),
    onSuccess: (_data, { prestamoId }) => {
      queryClient.invalidateQueries({ queryKey: ['prestamo', prestamoId] });
      queryClient.invalidateQueries({ queryKey: ['prestamos'] });
    },
  });
}

export function useResumenClientePrestamos(clienteId: number | null) {
  return useQuery({
    queryKey: ['resumen-prestamos-cliente', clienteId],
    queryFn: () => prestamosApi.resumenClientePrestamos(clienteId as number),
    enabled: clienteId !== null,
  });
}
