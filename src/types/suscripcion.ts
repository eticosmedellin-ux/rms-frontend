export interface SuscripcionEmpresa {
  empresaId: number;
  empresaNombre: string;
  valorMensual: number;
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
