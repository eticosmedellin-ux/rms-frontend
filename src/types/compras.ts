export interface Proveedor {
  id: number;
  nombre: string;
  nit: string | null;
  contactoNombre: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  diasCredito: number;
  estado: boolean;
}

export interface ProveedorRequest {
  nombre: string;
  nit?: string;
  contactoNombre?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  diasCredito?: number;
}

export type EstadoOrdenCompra =
  | 'BORRADOR'
  | 'ENVIADA'
  | 'PARCIALMENTE_RECIBIDA'
  | 'RECIBIDA'
  | 'CERRADA'
  | 'CANCELADA';

export interface DetalleOrdenCompraResponse {
  productoId: number;
  producto: string;
  cantidadPedida: number;
  cantidadRecibida: number;
  costoUnitarioEstimado: number;
}

export interface OrdenCompra {
  id: number;
  numero: string;
  proveedor: string;
  sucursalId: number;
  sucursal: string;
  estado: EstadoOrdenCompra;
  fecha: string;
  fechaEsperada: string | null;
  observaciones: string | null;
  detalles: DetalleOrdenCompraResponse[];
}

export interface OrdenCompraRequest {
  sucursalId: number;
  proveedorId: number;
  fechaEsperada?: string | null;
  observaciones?: string | null;
  detalles: { productoId: number; cantidadPedida: number; costoUnitarioEstimado?: number }[];
}

export interface RecepcionCompraRequest {
  ordenId?: number | null;
  sucursalId: number;
  observaciones?: string | null;
  detalles: { productoId: number; cantidadRecibida: number; costoUnitario: number }[];
}

export interface FacturaCompra {
  id: number;
  proveedor: string;
  numeroFacturaProveedor: string | null;
  fechaEmision: string;
  fechaVencimiento: string | null;
  esCredito: boolean;
  subtotal: number;
  impuestos: number;
  total: number;
  estado: string;
}

export interface FacturaCompraRequest {
  proveedorId: number;
  ordenId?: number | null;
  numeroFacturaProveedor?: string | null;
  fechaEmision: string;
  fechaVencimiento?: string | null;
  esCredito: boolean;
  impuestos?: number;
  detalles: { productoId: number; cantidad: number; costoUnitario: number }[];
}

export interface CuentaPorPagar {
  id: number;
  facturaId: number;
  proveedor: string;
  montoOriginal: number;
  saldoPendiente: number;
  fechaVencimiento: string | null;
  estado: string;
}

export interface AbonoProveedorRequest {
  monto: number;
  metodoPago: string;
  cajaSesionId?: number | null;
}
