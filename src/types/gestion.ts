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
  | 'CXC_POR_VENCER'
  | 'EFECTIVO_MAXIMO_CAJA'
  | 'CAJA_DIFERENCIA_CIERRE'
  | 'NOMINA_PAGO_PROXIMO'
  | 'PRESTAMO_CUOTA_PROXIMA'
  | 'DOMICILIO_NUEVO'
  | 'MESA_OCUPADA_MUCHO_TIEMPO'
  | 'CITA_PROXIMA'
  | 'RESERVA_PROXIMA'
  | 'CLIENTE_CUMPLEANOS';

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

export interface RutaPlan {
  ruta: string;
  categoria: string;
  etiqueta: string;
}

export type EstadoLicencia = 'ACTIVA' | 'SUSPENDIDA' | 'VENCIDA';

export interface PlanEmpresa {
  empresaId: number;
  nombrePlan: string;
  estadoLicencia: EstadoLicencia;
  maxSucursales: number | null;
  maxUsuarios: number | null;
  sucursalesActuales: number;
  usuariosActuales: number;
  rutasHabilitadas: string[];
}

export interface PlanEmpresaRequest {
  nombrePlan: string;
  estadoLicencia: EstadoLicencia;
  maxSucursales: number | null;
  maxUsuarios: number | null;
  rutasHabilitadas: string[];
}
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
  tamanoImpresion: string;
  anchoPersonalizadoMm: number | null;
  altoPersonalizadoMm: number | null;
  mensajeAgradecimiento: string | null;
  infoAdicionalDocumentos: string | null;
  ciudad: string | null;
  sitioWeb: string | null;
  idioma: string;
  tema: 'CLARO' | 'OSCURO';
  permitirStockNegativo: boolean;
  confirmarAntesDeVenta: boolean;
  stockMinimoDefault: number;
  facebook: string | null;
  instagram: string | null;
  whatsapp: string | null;
  bancoNombre: string | null;
  bancoTipoCuenta: string | null;
  bancoNumeroCuenta: string | null;
  bancoTitular: string | null;
  tiposNegocio: { id: number; nombre: string }[];
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
  tamanoImpresion?: string;
  anchoPersonalizadoMm?: number | null;
  altoPersonalizadoMm?: number | null;
  mensajeAgradecimiento?: string;
  infoAdicionalDocumentos?: string;
  ciudad?: string;
  sitioWeb?: string;
  idioma?: string;
  tema?: string;
  permitirStockNegativo?: boolean;
  confirmarAntesDeVenta?: boolean;
  stockMinimoDefault?: number;
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
  bancoNombre?: string;
  bancoTipoCuenta?: string;
  bancoNumeroCuenta?: string;
  bancoTitular?: string;
  tiposNegocioIds?: number[];
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
  clienteIdProveedor: string | null;
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
  clienteIdProveedor?: string;
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
