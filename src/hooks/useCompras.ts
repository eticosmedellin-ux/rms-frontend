import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as comprasApi from '@/api/compras';
import type {
  AbonoProveedorRequest,
  FacturaCompraRequest,
  OrdenCompraRequest,
  ProveedorRequest,
  RecepcionCompraRequest,
} from '@/types/compras';

export function useProveedores() {
  return useQuery({ queryKey: ['proveedores'], queryFn: comprasApi.listarProveedores });
}

export function useCrearProveedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProveedorRequest) => comprasApi.crearProveedor(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proveedores'] }),
  });
}

export function useOrdenesCompra() {
  return useQuery({ queryKey: ['ordenes-compra'], queryFn: comprasApi.listarOrdenesCompra });
}

export function useCrearOrdenCompra() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: OrdenCompraRequest) => comprasApi.crearOrdenCompra(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ordenes-compra'] }),
  });
}

export function useEnviarOrdenCompra() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => comprasApi.enviarOrdenCompra(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ordenes-compra'] }),
  });
}

export function useCancelarOrdenCompra() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => comprasApi.cancelarOrdenCompra(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ordenes-compra'] }),
  });
}

export function useRegistrarRecepcion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RecepcionCompraRequest) => comprasApi.registrarRecepcion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
    },
  });
}

export function useRegistrarFactura() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FacturaCompraRequest) => comprasApi.registrarFactura(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['facturas-compra', variables.proveedorId] });
      queryClient.invalidateQueries({ queryKey: ['cuentas-por-pagar', variables.proveedorId] });
    },
  });
}

export function useFacturasPorProveedor(proveedorId: number | null) {
  return useQuery({
    queryKey: ['facturas-compra', proveedorId],
    queryFn: () => comprasApi.listarFacturasPorProveedor(proveedorId as number),
    enabled: proveedorId !== null,
  });
}

export function useCuentasPorPagar(proveedorId: number | null) {
  return useQuery({
    queryKey: ['cuentas-por-pagar', proveedorId],
    queryFn: () => comprasApi.listarCuentasPorPagar(proveedorId as number),
    enabled: proveedorId !== null,
  });
}

export function useAbonarCuentaPorPagar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cuentaId, data }: { cuentaId: number; data: AbonoProveedorRequest }) =>
      comprasApi.abonarCuentaPorPagar(cuentaId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cuentas-por-pagar'] });
    },
  });
}
