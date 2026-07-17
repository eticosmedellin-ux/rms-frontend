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

export function useEliminarEmpresa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => plataformaApi.eliminarEmpresa(id),
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

// --- Tipos de negocio ---

export function useTiposNegocioActivos() {
  return useQuery({
    queryKey: ['tipos-negocio-activos'],
    queryFn: plataformaApi.listarTiposNegocioActivos,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTiposNegocio() {
  return useQuery({ queryKey: ['tipos-negocio'], queryFn: plataformaApi.listarTiposNegocio });
}

export function useCrearTipoNegocio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: plataformaApi.TipoNegocioRequest) => plataformaApi.crearTipoNegocio(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-negocio'] });
      queryClient.invalidateQueries({ queryKey: ['tipos-negocio-activos'] });
    },
  });
}

export function useActualizarTipoNegocio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: plataformaApi.TipoNegocioRequest }) =>
      plataformaApi.actualizarTipoNegocio(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-negocio'] });
      queryClient.invalidateQueries({ queryKey: ['tipos-negocio-activos'] });
    },
  });
}

export function useDesactivarTipoNegocio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => plataformaApi.desactivarTipoNegocio(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-negocio'] });
      queryClient.invalidateQueries({ queryKey: ['tipos-negocio-activos'] });
    },
  });
}

export function useAgregarModuloTipoNegocio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tipoNegocioId, data }: { tipoNegocioId: number; data: plataformaApi.TipoNegocioModuloRequest }) =>
      plataformaApi.agregarModuloTipoNegocio(tipoNegocioId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tipos-negocio'] }),
  });
}

export function useEliminarModuloTipoNegocio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (moduloId: number) => plataformaApi.eliminarModuloTipoNegocio(moduloId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tipos-negocio'] }),
  });
}

// --- Dashboard ejecutivo ---

export function useDashboardEjecutivo() {
  return useQuery({ queryKey: ['dashboard-ejecutivo'], queryFn: plataformaApi.obtenerDashboardEjecutivo });
}
