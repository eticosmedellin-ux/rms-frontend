export interface KardexLinea {
  fecha: string;
  producto: string;
  sucursal: string;
  tipoMovimiento: string;
  cantidad: number;
  costoUnitario: number;
  saldoResultante: number;
  referenciaTipo: string | null;
}

export interface CompraLinea {
  numeroFacturaProveedor: string;
  proveedor: string;
  fechaEmision: string;
  total: number;
  estado: string;
}

export interface GastoLinea {
  fecha: string;
  categoria: string;
  concepto: string;
  monto: number;
  sucursal: string;
  metodoPago: string;
}

export interface ClienteReporte {
  nombre: string;
  totalComprado: number;
  saldoPendiente: number;
  limiteCredito: number;
}

export interface ProveedorReporte {
  nombre: string;
  totalComprado: number;
  facturasPendientes: number;
  saldoPendiente: number;
}

export interface ArqueoReporte {
  sucursal: string;
  usuario: string;
  fechaApertura: string;
  fechaCierre: string;
  montoApertura: number;
  montoCierreSistema: number;
  montoCierreReal: number;
  diferencia: number;
}

export interface CuentaPorPagarReporte {
  proveedor: string;
  numeroFactura: string;
  saldoPendiente: number;
  fechaVencimiento: string | null;
  estado: string;
}
