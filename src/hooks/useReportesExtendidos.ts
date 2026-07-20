import { useQuery } from '@tanstack/react-query';
import * as api from '@/api/reportesExtendidos';

export function useReporteKardex(desde: string, hasta: string, habilitado: boolean) {
  return useQuery({
    queryKey: ['reporte-kardex', desde, hasta],
    queryFn: () => api.reporteKardex(desde, hasta),
    enabled: habilitado,
  });
}

export function useReporteComprasDetalle(desde: string, hasta: string, habilitado: boolean) {
  return useQuery({
    queryKey: ['reporte-compras-detalle', desde, hasta],
    queryFn: () => api.reporteCompras(desde, hasta),
    enabled: habilitado,
  });
}

export function useReporteGastosDetalle(desde: string, hasta: string, habilitado: boolean) {
  return useQuery({
    queryKey: ['reporte-gastos-detalle', desde, hasta],
    queryFn: () => api.reporteGastos(desde, hasta),
    enabled: habilitado,
  });
}

export function useReporteClientesDetalle() {
  return useQuery({ queryKey: ['reporte-clientes-detalle'], queryFn: api.reporteClientes });
}

export function useReporteProveedoresDetalle() {
  return useQuery({ queryKey: ['reporte-proveedores-detalle'], queryFn: api.reporteProveedores });
}

export function useReporteArqueos(desde: string, hasta: string, habilitado: boolean) {
  return useQuery({
    queryKey: ['reporte-arqueos', desde, hasta],
    queryFn: () => api.reporteArqueos(desde, hasta),
    enabled: habilitado,
  });
}

export function useAnalisisArqueos(desde: string, hasta: string, habilitado: boolean) {
  return useQuery({
    queryKey: ['analisis-arqueos', desde, hasta],
    queryFn: () => api.reporteAnalisisArqueos(desde, hasta),
    enabled: habilitado,
  });
}

export function useReporteCuentasPorPagarDetalle() {
  return useQuery({ queryKey: ['reporte-cuentas-por-pagar-detalle'], queryFn: api.reporteCuentasPorPagar });
}
