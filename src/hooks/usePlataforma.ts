import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as plataformaApi from '@/api/plataforma';

export function useEmpresasPlataforma() {
  return useQuery({ queryKey: ['plataforma-empresas'], queryFn: plataformaApi.listarEmpresasPlataforma });
}

export function useSuspenderEmpresa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => plataformaApi.suspenderEmpresa(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plataforma-empresas'] }),
  });
}

export function useActivarEmpresa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => plataformaApi.activarEmpresa(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plataforma-empresas'] }),
  });
}

export function useCodigosInvitacion() {
  return useQuery({ queryKey: ['codigos-invitacion'], queryFn: plataformaApi.listarCodigosInvitacion });
}

export function useGenerarCodigoInvitacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (nota?: string) => plataformaApi.generarCodigoInvitacion(nota),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['codigos-invitacion'] }),
  });
}
