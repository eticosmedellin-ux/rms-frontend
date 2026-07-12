import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/api/ayuda';
import type { NodoAyudaRequest, OpcionAyudaRequest } from '@/types/ayuda';

export function useRaizAyuda(habilitado: boolean) {
  return useQuery({ queryKey: ['ayuda-raiz'], queryFn: api.obtenerRaizAyuda, enabled: habilitado });
}

export function useNodoAyuda(id: number | null) {
  return useQuery({
    queryKey: ['ayuda-nodo', id],
    queryFn: () => api.obtenerNodoAyuda(id as number),
    enabled: id !== null,
  });
}

export function useRegistrarConsultaSinRespuesta() {
  return useMutation({
    mutationFn: ({ rutaResumen, comentarioAdicional }: { rutaResumen: string; comentarioAdicional?: string }) =>
      api.registrarConsultaSinRespuesta(rutaResumen, comentarioAdicional),
  });
}

export function useNodosAyudaAdmin() {
  return useQuery({ queryKey: ['ayuda-nodos-admin'], queryFn: api.listarNodosAyuda });
}

export function useCrearNodoAyuda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: NodoAyudaRequest) => api.crearNodoAyuda(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ayuda-nodos-admin'] }),
  });
}

export function useActualizarNodoAyuda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: NodoAyudaRequest }) => api.actualizarNodoAyuda(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ayuda-nodos-admin'] }),
  });
}

export function useEliminarNodoAyuda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.eliminarNodoAyuda(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ayuda-nodos-admin'] }),
  });
}

export function useCrearOpcionAyuda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: OpcionAyudaRequest) => api.crearOpcionAyuda(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ayuda-nodos-admin'] }),
  });
}

export function useEliminarOpcionAyuda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.eliminarOpcionAyuda(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ayuda-nodos-admin'] }),
  });
}

export function useConsultasSinRespuesta() {
  return useQuery({ queryKey: ['consultas-sin-respuesta'], queryFn: api.listarConsultasSinRespuesta });
}

export function useMarcarConsultaAtendida() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.marcarConsultaAtendida(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['consultas-sin-respuesta'] }),
  });
}
