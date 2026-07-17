export interface SuscripcionEmpresa {
  empresaId: number;
  empresaNombre: string;
  valorMensual: number;
  frecuencia: 'MENSUAL' | 'ANUAL';
  estado: 'SIN_CONFIGURAR' | 'PENDIENTE' | 'ACTIVA' | 'VENCIDA' | 'CANCELADA';
  proximoCobro: string | null;
  ultimoPagoFecha: string | null;
  ultimoPagoEstado: string | null;
  urlPago: string | null;
}

export interface PagoSuscripcion {
  id: number;
  monto: number;
  estado: string;
  referenciaProveedor: string | null;
  mensaje: string | null;
  fecha: string;
  comprobante: string | null;
}

export interface ConfiguracionPagoRecurrente {
  proveedor: string;
  activo: boolean;
  ambiente: 'PRUEBAS' | 'PRODUCCION';
  publicKey: string | null;
  privateKeyConfigurada: boolean;
}

export interface ConfiguracionPagoRecurrenteRequest {
  proveedor?: string;
  activo?: boolean;
  ambiente?: string;
  publicKey?: string;
  privateKey?: string;
}
