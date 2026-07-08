import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as posApi from '@/api/pos';
import type {
  AbonoClienteRequest,
  ClienteRequest,
  ConvertirCotizacionRequest,
  CotizacionRequest,
  DevolucionVentaRequest,
  VentaRequest,
} from '@/types/pos';

// --- Clientes ---
export function useClientes() {
  return useQuery({ queryKey: ['clientes'], queryFn: posApi.listarClientes });
}

export function useCrearCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ClienteRequest) => posApi.crearCliente(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clientes'] }),
  });
}

// --- Caja ---
export function useCajaAbierta(sucursalId: number | null) {
  return useQuery({
    queryKey: ['caja-abierta', sucursalId],
    queryFn: () => posApi.obtenerCajaAbierta(sucursalId as number),
    enabled: sucursalId !== null,
  });
}

export function useAbrirCaja() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { sucursalId: number; montoApertura: number }) => posApi.abrirCaja(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['caja-abierta', variables.sucursalId] });
    },
  });
}

export function useCerrarCaja() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, montoCierreReal }: { id: number; montoCierreReal: number }) =>
      posApi.cerrarCaja(id, montoCierreReal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caja-abierta'] });
    },
  });
}

export function useMovimientosCaja(cajaSesionId: number | null) {
  return useQuery({
    queryKey: ['caja-movimientos', cajaSesionId],
    queryFn: () => posApi.listarMovimientosCaja(cajaSesionId as number),
    enabled: cajaSesionId !== null,
  });
}

export function useRegistrarMovimientoCaja() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { tipo: 'INGRESO' | 'EGRESO'; concepto: string; monto: number } }) =>
      posApi.registrarMovimientoCaja(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['caja-movimientos', variables.id] });
    },
  });
}

// --- Ventas ---
export function useVentas() {
  return useQuery({ queryKey: ['ventas'], queryFn: posApi.listarVentas });
}

export function useRegistrarVenta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: VentaRequest) => posApi.registrarVenta(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ventas'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['caja-movimientos', variables.cajaSesionId] });
      queryClient.invalidateQueries({ queryKey: ['cuentas-por-cobrar'] });
    },
  });
}

export function useRegistrarDevolucion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ventaId, data }: { ventaId: number; data: DevolucionVentaRequest }) =>
      posApi.registrarDevolucion(ventaId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
    },
  });
}

// --- Cuentas por cobrar ---
export function useCuentasPorCobrar(clienteId: number | null) {
  return useQuery({
    queryKey: ['cuentas-por-cobrar', clienteId],
    queryFn: () => posApi.listarCuentasPorCobrar(clienteId as number),
    enabled: clienteId !== null,
  });
}

export function useAbonarCuentaPorCobrar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cuentaId, data }: { cuentaId: number; data: AbonoClienteRequest }) =>
      posApi.abonarCuentaPorCobrar(cuentaId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cuentas-por-cobrar'] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}

// --- Cotizaciones ---
export function useCotizaciones() {
  return useQuery({ queryKey: ['cotizaciones'], queryFn: posApi.listarCotizaciones });
}

export function useCrearCotizacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CotizacionRequest) => posApi.crearCotizacion(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cotizaciones'] }),
  });
}

export function useConvertirCotizacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ConvertirCotizacionRequest }) =>
      posApi.convertirCotizacion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotizaciones'] });
      queryClient.invalidateQueries({ queryKey: ['ventas'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
    },
  });
}
