import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as serviciosApi from '@/api/servicios';

export function useTiposServicio() {
  return useQuery({ queryKey: ['tipos-servicio'], queryFn: serviciosApi.listarTiposServicio });
}

export function useAnaliticaServicios(desde: string, hasta: string, habilitado = true) {
  return useQuery({
    queryKey: ['analitica-servicios', desde, hasta],
    queryFn: () => serviciosApi.obtenerAnaliticaServicios(desde, hasta),
    enabled: habilitado,
  });
}

export function useCrearTipoServicio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: serviciosApi.TipoServicioRequest) => serviciosApi.crearTipoServicio(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tipos-servicio'] }),
  });
}

export function useActualizarTipoServicio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: serviciosApi.TipoServicioRequest }) =>
      serviciosApi.actualizarTipoServicio(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tipos-servicio'] }),
  });
}

export function useCitas() {
  return useQuery({ queryKey: ['citas'], queryFn: serviciosApi.listarCitas });
}

export function useCitasHistorial() {
  return useQuery({ queryKey: ['citas-historial'], queryFn: serviciosApi.listarCitasHistorial });
}

export function useCrearCita() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: serviciosApi.CitaRequest) => serviciosApi.crearCita(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['citas'] }),
  });
}

export function useActualizarCita() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: serviciosApi.CitaRequest }) => serviciosApi.actualizarCita(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['citas'] }),
  });
}

export function useCambiarEstadoCita() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: serviciosApi.EstadoCita }) => serviciosApi.cambiarEstadoCita(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
      queryClient.invalidateQueries({ queryKey: ['citas-historial'] });
    },
  });
}

export function useOrdenes(soloActivas = false) {
  return useQuery({ queryKey: ['ordenes-trabajo', soloActivas], queryFn: () => serviciosApi.listarOrdenes(soloActivas) });
}

export function useCrearOrden() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: serviciosApi.OrdenTrabajoRequest) => serviciosApi.crearOrden(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ordenes-trabajo'] }),
  });
}

export function useActualizarOrden() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: serviciosApi.OrdenTrabajoRequest }) => serviciosApi.actualizarOrden(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ordenes-trabajo'] }),
  });
}

export function useCambiarEstadoOrden() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { estado: serviciosApi.EstadoOrden; costoFinal?: number; fechaEntregaReal?: string };
    }) => serviciosApi.cambiarEstadoOrden(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ordenes-trabajo'] }),
  });
}
