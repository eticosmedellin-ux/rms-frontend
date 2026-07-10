// --- Gastos ---
export interface CategoriaGasto {
  id: number;
  nombre: string;
  tipo: 'OPERATIVO' | 'ADMINISTRATIVO';
  estado: boolean;
}

export interface Gasto {
  id: number;
  sucursal: string;
  categoriaGasto: string;
  concepto: string;
  monto: number;
  metodoPago: string;
  fecha: string;
}

export interface GastoRequest {
  sucursalId: number;
  categoriaGastoId: number;
  concepto: string;
  monto: number;
  metodoPago: string;
  cajaSesionId?: number | null;
}

// --- Alertas ---
export type TipoAlerta =
  | 'STOCK_BAJO'
  | 'PRODUCTO_AGOTADO'
  | 'SIN_MOVIMIENTO'
  | 'COMPRA_PENDIENTE'
  | 'CAJA_SIN_CERRAR'
  | 'CXP_POR_VENCER'
  | 'EFECTIVO_MAXIMO_CAJA';

export interface Alerta {
  id: number;
  tipo: TipoAlerta;
  entidadTipo: string;
  entidadId: number;
  mensaje: string;
  estado: 'ACTIVA' | 'RESUELTA' | 'DESCARTADA';
  fechaGenerada: string;
}

export interface ConfiguracionAlerta {
  id: number;
  tipoAlerta: string;
  activa: boolean;
  umbralDias: number | null;
}

// --- Reportes ---
export interface ReporteVentas {
  desde: string;
  hasta: string;
  totalVentas: number;
  totalIngresos: number;
  totalDescuentos: number;
  promedioVenta: number;
}

export interface ReporteUtilidad {
  desde: string;
  hasta: string;
  ingresos: number;
  costoVentas: number;
  gastos: number;
  utilidadBruta: number;
  utilidadNeta: number;
}

export interface ReporteValorInventario {
  sucursalId: number;
  sucursalNombre: string;
  valorInventario: number;
}

// --- Configuración ---
export interface MetodoPago {
  id: number;
  nombre: string;
  estado: boolean;
}

export interface Impuesto {
  id: number;
  nombre: string;
  porcentaje: number;
  esDefault: boolean;
  estado: boolean;
}

// --- Empresa ---
export interface Empresa {
  id: number;
  nombre: string;
  nombreComercial: string | null;
  nit: string | null;
  logoUrl: string | null;
  moneda: string;
  zonaHoraria: string;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
}

export interface EmpresaRequest {
  nombre: string;
  nombreComercial?: string;
  nit?: string;
  logoUrl?: string;
  moneda?: string;
  zonaHoraria?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
}

// --- Auditoría ---
export interface RegistroAuditoria {
  id: number;
  usuario: string;
  modulo: string;
  accion: string;
  entidad: string;
  entidadId: number | null;
  detalle: Record<string, unknown> | null;
  fecha: string;
}

// --- Historial de accesos ---
export interface RegistroAcceso {
  id: number;
  usuario: string;
  ip: string | null;
  dispositivo: string | null;
  exitoso: boolean;
  fecha: string;
}

// --- Facturación electrónica (arquitectura lista para conectar un proveedor) ---
export interface ConfiguracionFacturacionElectronica {
  proveedor: string | null;
  apiUrl: string | null;
  apiKeyConfigurada: boolean;
  resolucionNumero: string | null;
  resolucionPrefijo: string | null;
  resolucionRangoDesde: number | null;
  resolucionRangoHasta: number | null;
  resolucionFechaVencimiento: string | null;
  activa: boolean;
}

export interface ConfiguracionFacturacionElectronicaRequest {
  proveedor?: string;
  apiUrl?: string;
  apiKey?: string;
  resolucionNumero?: string;
  resolucionPrefijo?: string;
  resolucionRangoDesde?: number;
  resolucionRangoHasta?: number;
  resolucionFechaVencimiento?: string;
  activa: boolean;
}

export type EstadoFacturaElectronica = 'PENDIENTE' | 'ENVIADA' | 'ACEPTADA' | 'RECHAZADA' | 'SIN_PROVEEDOR' | 'NO_APLICA';

export interface FacturaElectronicaEstado {
  ventaId: number;
  estado: EstadoFacturaElectronica;
  cufe: string | null;
  xmlUrl: string | null;
  pdfUrl: string | null;
  mensaje: string | null;
  intentos: number;
  ultimoIntentoEn: string | null;
}
