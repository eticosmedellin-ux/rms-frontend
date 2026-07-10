import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as gestionApi from '@/api/gestion';
import type { GastoRequest } from '@/types/gestion';

// --- Gastos ---
export function useGastos() {
  return useQuery({ queryKey: ['gastos'], queryFn: gestionApi.listarGastos });
}

export function useCategoriasGasto() {
  return useQuery({ queryKey: ['categorias-gasto'], queryFn: gestionApi.listarCategoriasGasto });
}

export function useCrearCategoriaGasto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { nombre: string; tipo: string }) => gestionApi.crearCategoriaGasto(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categorias-gasto'] }),
  });
}

export function useRegistrarGasto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GastoRequest) => gestionApi.registrarGasto(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['gastos'] });
      if (variables.cajaSesionId) {
        queryClient.invalidateQueries({ queryKey: ['caja-movimientos', variables.cajaSesionId] });
      }
    },
  });
}

// --- Alertas ---
export function useAlertas() {
  return useQuery({ queryKey: ['alertas'], queryFn: gestionApi.listarAlertas });
}

export function useGenerarAlertas() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: gestionApi.generarAlertas,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alertas'] }),
  });
}

export function useDescartarAlerta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => gestionApi.descartarAlerta(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alertas'] }),
  });
}

export function useConfiguracionAlertas() {
  return useQuery({ queryKey: ['configuracion-alertas'], queryFn: gestionApi.listarConfiguracionAlertas });
}

export function useGuardarConfiguracionAlerta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { tipoAlerta: string; activa?: boolean; umbralDias?: number }) =>
      gestionApi.guardarConfiguracionAlerta(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['configuracion-alertas'] }),
  });
}

// --- Reportes ---
export function useReporteVentas(desde: string, hasta: string, enabled: boolean) {
  return useQuery({
    queryKey: ['reporte-ventas', desde, hasta],
    queryFn: () => gestionApi.obtenerReporteVentas(desde, hasta),
    enabled,
  });
}

export function useReporteUtilidad(desde: string, hasta: string, enabled: boolean) {
  return useQuery({
    queryKey: ['reporte-utilidad', desde, hasta],
    queryFn: () => gestionApi.obtenerReporteUtilidad(desde, hasta),
    enabled,
  });
}

export function useReporteValorInventario() {
  return useQuery({ queryKey: ['reporte-inventario-valor'], queryFn: gestionApi.obtenerReporteValorInventario });
}

// --- Configuración ---
export function useMetodosPago() {
  return useQuery({ queryKey: ['metodos-pago'], queryFn: gestionApi.listarMetodosPago });
}

export function useCrearMetodoPago() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (nombre: string) => gestionApi.crearMetodoPago(nombre),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['metodos-pago'] }),
  });
}

export function useImpuestos() {
  return useQuery({ queryKey: ['impuestos'], queryFn: gestionApi.listarImpuestos });
}

export function useCrearImpuesto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { nombre: string; porcentaje: number; esDefault?: boolean }) => gestionApi.crearImpuesto(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['impuestos'] }),
  });
}

// --- Empresa ---
export function useEmpresa() {
  return useQuery({ queryKey: ['empresa'], queryFn: gestionApi.obtenerEmpresa });
}

export function useActualizarEmpresa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof gestionApi.actualizarEmpresa>[0]) => gestionApi.actualizarEmpresa(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresa'] });
      queryClient.invalidateQueries({ queryKey: ['auditoria'] });
    },
  });
}

// --- Auditoría ---
export function useAuditoria() {
  return useQuery({ queryKey: ['auditoria'], queryFn: gestionApi.listarAuditoria });
}

// --- Historial de accesos ---
export function useHistorialAcceso() {
  return useQuery({ queryKey: ['historial-acceso'], queryFn: gestionApi.listarHistorialAcceso });
}

// --- Facturación electrónica ---
export function useConfiguracionFacturacionElectronica() {
  return useQuery({
    queryKey: ['configuracion-facturacion-electronica'],
    queryFn: gestionApi.obtenerConfiguracionFacturacionElectronica,
  });
}

export function useGuardarConfiguracionFacturacionElectronica() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof gestionApi.guardarConfiguracionFacturacionElectronica>[0]) =>
      gestionApi.guardarConfiguracionFacturacionElectronica(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['configuracion-facturacion-electronica'] }),
  });
}
