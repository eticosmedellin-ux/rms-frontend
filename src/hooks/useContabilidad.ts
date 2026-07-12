import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/api/contabilidad';
import type { AsientoManualRequest } from '@/types/contabilidad';

export function useContabilidadActiva() {
  return useQuery({ queryKey: ['contabilidad-activa'], queryFn: api.contabilidadActiva });
}

export function useActivarContabilidad() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.activarContabilidad,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contabilidad-activa'] }),
  });
}

export function useCuentasContables() {
  return useQuery({ queryKey: ['cuentas-contables'], queryFn: api.listarCuentasContables });
}

export function useLibroDiario(desde: string, hasta: string, habilitado: boolean) {
  return useQuery({
    queryKey: ['libro-diario', desde, hasta],
    queryFn: () => api.libroDiario(desde, hasta),
    enabled: habilitado,
  });
}

export function useCrearAsientoManual() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AsientoManualRequest) => api.crearAsientoManual(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['libro-diario'] }),
  });
}

export function useAnularAsiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.anularAsiento(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['libro-diario'] }),
  });
}

export function useLibroMayor(cuentaId: number | null, desde: string, hasta: string) {
  return useQuery({
    queryKey: ['libro-mayor', cuentaId, desde, hasta],
    queryFn: () => api.libroMayor(cuentaId as number, desde, hasta),
    enabled: cuentaId !== null,
  });
}

export function useBalanceDePrueba(hasta: string, habilitado: boolean) {
  return useQuery({
    queryKey: ['balance-prueba', hasta],
    queryFn: () => api.balanceDePrueba(hasta),
    enabled: habilitado,
  });
}

export function useEstadoDeResultados(desde: string, hasta: string, habilitado: boolean) {
  return useQuery({
    queryKey: ['estado-resultados', desde, hasta],
    queryFn: () => api.estadoDeResultados(desde, hasta),
    enabled: habilitado,
  });
}

export function useBalanceGeneral(hasta: string, habilitado: boolean) {
  return useQuery({
    queryKey: ['balance-general', hasta],
    queryFn: () => api.balanceGeneral(hasta),
    enabled: habilitado,
  });
}

export function usePeriodosContables() {
  return useQuery({ queryKey: ['periodos-contables'], queryFn: api.listarPeriodosContables });
}

export function useCerrarPeriodoContable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.cerrarPeriodoContable(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['periodos-contables'] }),
  });
}

export function useReabrirPeriodoContable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.reabrirPeriodoContable(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['periodos-contables'] }),
  });
}

export function useMapeoContable() {
  return useQuery({ queryKey: ['mapeo-contable'], queryFn: api.listarMapeoContable });
}

export function useActualizarMapeoContable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ concepto, cuentaContableId }: { concepto: string; cuentaContableId: number }) =>
      api.actualizarMapeoContable(concepto, cuentaContableId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mapeo-contable'] }),
  });
}
