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

export interface ResumenCierreCajaMovimiento {
  fecha: string;
  tipo: 'INGRESO' | 'EGRESO';
  concepto: string | null;
  monto: number;
  origen: string | null;
}

export interface ResumenCierreCaja {
  sesionId: number;
  sucursal: string;
  usuario: string;
  fechaApertura: string;
  fechaCierre: string | null;
  montoApertura: number;
  ventasTotal: number;
  numeroVentas: number;
  ventasEfectivo: number;
  ventasTarjeta: number;
  ventasTransferencia: number;
  ventasCredito: number;
  ventasOtros: number;
  ingresosManuales: number;
  egresosManuales: number;
  movimientos: ResumenCierreCajaMovimiento[];
  montoCierreSistema: number | null;
  montoCierreReal: number | null;
  diferencia: number | null;
  observaciones: string | null;
  estado: 'ABIERTA' | 'CERRADA';
  /** false si el usuario no tiene el permiso CAJA_VER_RESUMEN — en ese caso los campos
   *  financieros de arriba vienen en null/cero y no deben mostrarse. */
  resumenCompleto: boolean;
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

export interface DocumentoCaja {
  id: number;
  tipo: 'RECIBO' | 'COMPROBANTE' | 'NOTA_CREDITO' | 'NOTA_DEBITO';
  numero: string;
  concepto: string;
  detalle: string | null;
  personaRelacionada: string | null;
  metodoPago: string;
  monto: number;
  referenciaTipo: string | null;
  referenciaId: number | null;
  sucursal: string | null;
  usuario: string;
  fecha: string;
  vecesImpreso: number;
}

export interface DocumentoCajaRequest {
  tipo: 'RECIBO' | 'COMPROBANTE';
  cajaSesionId: number;
  concepto: string;
  detalle?: string;
  personaRelacionada?: string;
  metodoPago: string;
  monto: number;
}

export interface VentaDetalleResponse {
  productoId: number | null;
  comboId: number | null;
  producto: string;
  esCombo: boolean;
  cantidad: number;
  precioUnitario: number;
  descuentoLinea: number;
  tipoDescuentoNombre: string | null;
  subtotalLinea: number;
}

export interface PaginaResponse<T> {
  contenido: T[];
  pagina: number;
  tamanoPagina: number;
  totalElementos: number;
  totalPaginas: number;
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
  tipoDescuentoNombre: string | null;
  impuestos: number;
  total: number;
  cambio: number;
  facturar: boolean;
  numeroFactura: string | null;
  fecha: string;
  detalles: VentaDetalleResponse[];
}

export type TipoValorDescuento = 'MONTO' | 'PORCENTAJE';
export type AplicaDescuento = 'LINEA' | 'FACTURA' | 'AMBOS';

export interface TipoDescuento {
  id: number;
  nombre: string;
  tipo: TipoValorDescuento;
  valor: number;
  aplicaA: AplicaDescuento;
  fechaVencimiento: string | null;
  estado: boolean;
  vigente: boolean;
}

export interface TipoDescuentoRequest {
  nombre: string;
  tipo: TipoValorDescuento;
  valor: number;
  aplicaA: AplicaDescuento;
  fechaVencimiento?: string | null;
}

export interface VentaRequest {
  sucursalId: number;
  cajaSesionId: number;
  clienteId?: number | null;
  detalles: { productoId?: number; comboId?: number; cantidad: number; precioUnitario: number; tipoDescuentoId?: number | null }[];
  pagos: { metodoPago: MetodoPagoVenta; monto: number }[];
  tipoDescuentoFacturaId?: number | null;
  facturar?: boolean;
}

export interface DevolucionVentaRequest {
  motivo: string;
  detalles: { productoId?: number; comboId?: number; cantidad: number }[];
  cajaSesionId?: number | null;
}

export interface DevolucionVentaResponse {
  id: number;
  ventaId: number;
  motivo: string;
  usuario: string;
  montoReintegrado: number;
  aplicadoACuentaPorCobrar: number;
  reintegradoEnEfectivo: number;
  notaCreditoNumero: string;
  fecha: string;
}

export interface CuentaPorCobrar {
  id: number;
  ventaId: number | null;
  numeroVenta: string;
  cliente: string;
  montoOriginal: number;
  saldoPendiente: number;
  fechaVencimiento: string | null;
  estado: string;
}

export interface MovimientoCuenta {
  fecha: string;
  tipo: 'CARGO' | 'ABONO';
  documento: string;
  concepto: string;
  cargo: number | null;
  abono: number | null;
  saldoAcumulado: number;
}

export interface EstadoCuentaCliente {
  clienteId: number;
  clienteNombre: string;
  limiteCredito: number;
  saldoActual: number;
  movimientos: MovimientoCuenta[];
}

export interface NotaDebitoRequest {
  clienteId: number;
  ventaId?: number | null;
  concepto: string;
  detalle?: string;
  monto: number;
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
