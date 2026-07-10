export interface Cliente {
  id: number;
  nombre: string;
  documento: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  limiteCredito: number;
  saldoPendiente: number;
  estado: boolean;
}

export interface ClienteRequest {
  nombre: string;
  documento?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  limiteCredito?: number;
}

export interface CajaSesion {
  id: number;
  sucursal: string;
  usuario: string;
  montoApertura: number;
  montoCierreSistema: number | null;
  montoCierreReal: number | null;
  diferencia: number | null;
  estado: 'ABIERTA' | 'CERRADA';
  fechaApertura: string;
  fechaCierre: string | null;
}

export interface CajaMovimiento {
  id: number;
  tipo: 'INGRESO' | 'EGRESO';
  concepto: string | null;
  monto: number;
  referenciaTipo: string | null;
  referenciaId: number | null;
  usuario: string | null;
  fecha: string;
}

export type MetodoPagoVenta = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'CREDITO';

export interface VentaDetalleResponse {
  productoId: number;
  producto: string;
  cantidad: number;
  precioUnitario: number;
  subtotalLinea: number;
}

export interface Venta {
  id: number;
  numero: string;
  cliente: string;
  tipoVenta: 'CONTADO' | 'CREDITO';
  estado: string;
  subtotal: number;
  descuento: number;
  descuentoTipo: 'LINEA' | 'FACTURA' | null;
  descuentoPorcentaje: number | null;
  impuestos: number;
  total: number;
  cambio: number;
  fecha: string;
  detalles: VentaDetalleResponse[];
}

export type TipoDescuento = 'MONTO' | 'PORCENTAJE';

export interface VentaRequest {
  sucursalId: number;
  cajaSesionId: number;
  clienteId?: number | null;
  detalles: { productoId: number; cantidad: number; precioUnitario: number; descuentoLinea?: number }[];
  pagos: { metodoPago: MetodoPagoVenta; monto: number }[];
  descuentoFactura?: { tipo: TipoDescuento; valor: number } | null;
}

export interface DevolucionVentaRequest {
  motivo: string;
  detalles: { productoId: number; cantidad: number }[];
}

export interface CuentaPorCobrar {
  id: number;
  ventaId: number;
  cliente: string;
  montoOriginal: number;
  saldoPendiente: number;
  fechaVencimiento: string | null;
  estado: string;
}

export interface AbonoClienteRequest {
  monto: number;
  metodoPago: string;
  cajaSesionId?: number | null;
}

// --- Cotizaciones ---
export type EstadoCotizacion = 'VIGENTE' | 'CONVERTIDA' | 'VENCIDA' | 'CANCELADA';

export interface DetalleCotizacion {
  productoId: number;
  producto: string;
  cantidad: number;
  precioUnitario: number;
}

export interface Cotizacion {
  id: number;
  cliente: string | null;
  estado: EstadoCotizacion;
  ventaId: number | null;
  validaHasta: string | null;
  fecha: string;
  detalles: DetalleCotizacion[];
}

export interface CotizacionRequest {
  sucursalId: number;
  clienteId?: number | null;
  validaHasta?: string | null;
  detalles: { productoId: number; cantidad: number; precioUnitario: number }[];
}

export interface ConvertirCotizacionRequest {
  cajaSesionId: number;
  pagos: { metodoPago: MetodoPagoVenta; monto: number }[];
}
