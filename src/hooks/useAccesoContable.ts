import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as accesoContableApi from '@/api/accesoContable';

export function useAccesosContables() {
  return useQuery({ queryKey: ['accesos-contables'], queryFn: accesoContableApi.listarAccesosContables });
}

export function useOtorgarAccesoContable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: accesoContableApi.AccesoContableRequest) => accesoContableApi.otorgarAccesoContable(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accesos-contables'] }),
  });
}

export function useRevocarAccesoContable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => accesoContableApi.revocarAccesoContable(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accesos-contables'] }),
  });
}

export function useMisClientesContables() {
  return useQuery({ queryKey: ['mis-clientes-contables'], queryFn: accesoContableApi.listarMisClientesContables });
}

export function useEstadoDeResultadosCliente(empresaId: number | null, desde: string, hasta: string, habilitado: boolean) {
  return useQuery({
    queryKey: ['estado-resultados-cliente', empresaId, desde, hasta],
    queryFn: () => accesoContableApi.estadoDeResultadosCliente(empresaId as number, desde, hasta),
    enabled: habilitado && empresaId !== null,
  });
}

export function useBalanceGeneralCliente(empresaId: number | null, hasta: string, habilitado: boolean) {
  return useQuery({
    queryKey: ['balance-general-cliente', empresaId, hasta],
    queryFn: () => accesoContableApi.balanceGeneralCliente(empresaId as number, hasta),
    enabled: habilitado && empresaId !== null,
  });
}
