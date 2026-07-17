import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/api/suscripcion';
import type { ConfiguracionPagoRecurrenteRequest } from '@/types/suscripcion';

export function useSuscripciones() {
  return useQuery({ queryKey: ['suscripciones'], queryFn: api.listarSuscripciones });
}

export function useHistorialSuscripcion(empresaId: number | null) {
  return useQuery({
    queryKey: ['historial-suscripcion', empresaId],
    queryFn: () => api.historialSuscripcion(empresaId as number),
    enabled: empresaId !== null,
  });
}

export function useActivarSuscripcion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ empresaId, valorMensual, frecuencia }: { empresaId: number; valorMensual: number; frecuencia?: 'MENSUAL' | 'ANUAL' }) =>
      api.activarSuscripcion(empresaId, valorMensual, frecuencia),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suscripciones'] }),
  });
}

export function useCancelarSuscripcion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (empresaId: number) => api.cancelarSuscripcion(empresaId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suscripciones'] }),
  });
}

export function useMarcarPagoManual() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ empresaId, data }: { empresaId: number; data?: { monto?: number; comprobante?: string } }) =>
      api.marcarPagoManual(empresaId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suscripciones'] });
      queryClient.invalidateQueries({ queryKey: ['historial-suscripcion'] });
    },
  });
}

export function useConfiguracionPagoRecurrente() {
  return useQuery({ queryKey: ['configuracion-pago-recurrente'], queryFn: api.obtenerConfiguracionPago });
}

export function useActualizarConfiguracionPago() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ConfiguracionPagoRecurrenteRequest) => api.actualizarConfiguracionPago(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['configuracion-pago-recurrente'] }),
  });
}
