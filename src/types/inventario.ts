export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
  estado: boolean;
}

export interface Marca {
  id: number;
  nombre: string;
  descripcion: string | null;
  estado: boolean;
}

export interface Producto {
  id: number;
  codigoInterno: string;
  codigoBarras: string | null;
  nombre: string;
  descripcion: string | null;
  unidadMedida: string;
  categoria: string | null;
  marca: string | null;
  precioCompra: number;
  precioVenta: number;
  costoPromedio: number;
  manejaInventario: boolean;
  estado: boolean;
  imagen: string | null;
}

export interface Combo {
  id: number;
  codigo: string;
  nombre: string;
  precioVenta: number;
  estado: boolean;
  items: { productoId: number; productoNombre: string; cantidad: number }[];
}

export interface ComboRequest {
  codigo: string;
  nombre: string;
  precioVenta: number;
  items: { productoId: number; cantidad: number }[];
}

export interface ProductoRequest {
  categoriaId: number | null;
  marcaId: number | null;
  codigoInterno: string;
  codigoBarras: string | null;
  nombre: string;
  descripcion: string | null;
  unidadMedida: string;
  precioCompra: number;
  precioVenta: number;
  manejaInventario: boolean;
}

export interface StockPorSucursal {
  productoId: number;
  productoNombre: string;
  sucursalId: number;
  sucursalNombre: string;
  stockActual: number;
  stockMinimo: number;
  stockMaximo: number | null;
  stockBajo: boolean;
}

export type TipoMovimiento =
  | 'ENTRADA'
  | 'SALIDA'
  | 'AJUSTE_POSITIVO'
  | 'AJUSTE_NEGATIVO'
  | 'TRANSFERENCIA_SALIDA'
  | 'TRANSFERENCIA_ENTRADA';

export interface MovimientoInventario {
  id: number;
  productoNombre: string;
  sucursalNombre: string;
  tipoMovimiento: TipoMovimiento;
  cantidad: number;
  costoUnitario: number;
  saldoResultante: number;
  referenciaTipo: string | null;
  referenciaId: number | null;
  usuario: string | null;
  fecha: string;
}

export interface EntradaInventarioRequest {
  productoId: number;
  sucursalId: number;
  cantidad: number;
  costoUnitario: number;
}

// --- Importación de productos ---
export interface FilaImportacionProducto {
  codigoInterno: string;
  codigoBarras?: string;
  nombre: string;
  categoria?: string;
  marca?: string;
  unidadMedida?: string;
  precioCompra?: number;
  precioVenta?: number;
}

export interface ImportarProductosRequest {
  archivoNombre: string;
  filas: FilaImportacionProducto[];
}

export interface ImportacionResultado {
  id: number;
  tipo: string;
  archivoNombre: string;
  estado: 'PROCESANDO' | 'COMPLETADA' | 'CON_ERRORES';
  totalFilas: number;
  filasExitosas: number;
  filasFallidas: number;
  errores: { fila: number; columna: string | null; mensajeError: string }[];
}

// --- Ajustes de inventario ---
export interface DetalleAjuste {
  productoId: number;
  producto: string;
  tipo: 'POSITIVO' | 'NEGATIVO';
  cantidad: number;
}

export interface AjusteInventario {
  id: number;
  sucursal: string;
  motivo: string;
  origen: string;
  usuario: string;
  fecha: string;
  detalles: DetalleAjuste[];
}

export interface AjusteInventarioRequest {
  sucursalId: number;
  motivo: string;
  detalles: { productoId: number; tipo: 'POSITIVO' | 'NEGATIVO'; cantidad: number }[];
}

// --- Transferencias entre sucursales ---
export type EstadoTransferencia = 'PENDIENTE' | 'EN_TRANSITO' | 'RECIBIDA' | 'CANCELADA';

export interface DetalleTransferencia {
  productoId: number;
  producto: string;
  cantidad: number;
}

export interface TransferenciaInventario {
  id: number;
  sucursalOrigenId: number;
  sucursalOrigen: string;
  sucursalDestinoId: number;
  sucursalDestino: string;
  estado: EstadoTransferencia;
  usuario: string;
  fecha: string;
  detalles: DetalleTransferencia[];
}

export interface TransferenciaInventarioRequest {
  sucursalOrigenId: number;
  sucursalDestinoId: number;
  detalles: { productoId: number; cantidad: number }[];
}

// --- Conteos físicos ---
export type EstadoConteo = 'EN_PROCESO' | 'CERRADO';

export interface DetalleConteo {
  productoId: number;
  producto: string;
  cantidadSistema: number;
  cantidadContada: number;
  diferencia: number;
}

export interface ConteoFisico {
  id: number;
  sucursal: string;
  estado: EstadoConteo;
  usuario: string;
  fechaInicio: string;
  fechaCierre: string | null;
  detalles: DetalleConteo[];
}

export interface IniciarConteoRequest {
  sucursalId: number;
  productoIds: number[];
}

export interface CerrarConteoRequest {
  conteos: { productoId: number; cantidadContada: number }[];
}
