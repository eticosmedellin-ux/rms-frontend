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

// --- Planes y licencias ---

export function useCatalogoRutas() {
  return useQuery({ queryKey: ['catalogo-rutas'], queryFn: plataformaApi.obtenerCatalogoRutas, staleTime: Infinity });
}

export function usePlanEmpresa(empresaId: number | null) {
  return useQuery({
    queryKey: ['plan-empresa', empresaId],
    queryFn: () => plataformaApi.obtenerPlanEmpresa(empresaId as number),
    enabled: empresaId !== null,
  });
}

export function useActualizarPlanEmpresa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ empresaId, data }: { empresaId: number; data: import('@/types/gestion').PlanEmpresaRequest }) =>
      plataformaApi.actualizarPlanEmpresa(empresaId, data),
    onSuccess: (_data, { empresaId }) => {
      queryClient.invalidateQueries({ queryKey: ['plan-empresa', empresaId] });
      queryClient.invalidateQueries({ queryKey: ['plataforma-empresas'] });
    },
  });
}

export function useMiPlan() {
  return useQuery({ queryKey: ['mi-plan'], queryFn: plataformaApi.obtenerMiPlan, staleTime: 5 * 60 * 1000 });
}

// --- Noticias del login ---

export function useNoticiasLoginActivas() {
  return useQuery({
    queryKey: ['noticias-login-activas'],
    queryFn: plataformaApi.listarNoticiasLoginActivas,
    staleTime: 60 * 1000,
    retry: false,
  });
}

export function useNoticiasLogin() {
  return useQuery({ queryKey: ['noticias-login'], queryFn: plataformaApi.listarNoticiasLogin });
}

export function useCrearNoticiaLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: plataformaApi.NoticiaLoginRequest) => plataformaApi.crearNoticiaLogin(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['noticias-login'] }),
  });
}

export function useActualizarNoticiaLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: plataformaApi.NoticiaLoginRequest }) =>
      plataformaApi.actualizarNoticiaLogin(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['noticias-login'] }),
  });
}

export function useEliminarNoticiaLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => plataformaApi.eliminarNoticiaLogin(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['noticias-login'] }),
  });
}
