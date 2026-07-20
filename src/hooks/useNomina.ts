import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as nominaApi from '@/api/nomina';

export function useTrabajadores() {
  return useQuery({ queryKey: ['trabajadores'], queryFn: nominaApi.listarTrabajadores });
}

export function useCrearTrabajador() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: nominaApi.TrabajadorRequest) => nominaApi.crearTrabajador(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trabajadores'] }),
  });
}

export function useActualizarTrabajador() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: nominaApi.TrabajadorRequest }) =>
      nominaApi.actualizarTrabajador(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trabajadores'] }),
  });
}

export function usePagosTrabajador(trabajadorId: number | null) {
  return useQuery({
    queryKey: ['pagos-nomina', trabajadorId],
    queryFn: () => nominaApi.listarPagosTrabajador(trabajadorId as number),
    enabled: trabajadorId !== null,
  });
}

export function useComisionSugerida(trabajadorId: number | null, desde: string, hasta: string, habilitado: boolean) {
  return useQuery({
    queryKey: ['comision-sugerida', trabajadorId, desde, hasta],
    queryFn: () => nominaApi.obtenerComisionSugerida(trabajadorId as number, desde, hasta),
    enabled: habilitado && trabajadorId !== null && !!desde && !!hasta,
  });
}

export function useConfirmarPagoNomina() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ trabajadorId, data }: { trabajadorId: number; data: nominaApi.ConfirmarPagoNominaRequest }) =>
      nominaApi.confirmarPagoNomina(trabajadorId, data),
    onSuccess: (_data, { trabajadorId }) => {
      queryClient.invalidateQueries({ queryKey: ['pagos-nomina', trabajadorId] });
      queryClient.invalidateQueries({ queryKey: ['trabajadores'] });
    },
  });
}
