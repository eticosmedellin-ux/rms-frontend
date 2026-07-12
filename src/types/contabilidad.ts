export interface CuentaContable {
  id: number;
  codigo: string;
  nombre: string;
  tipo: 'ACTIVO' | 'PASIVO' | 'PATRIMONIO' | 'INGRESO' | 'GASTO' | 'COSTO';
  naturaleza: 'DEBITO' | 'CREDITO';
  nivel: number;
  cuentaPadreId: number | null;
  permiteMovimientos: boolean;
  estado: boolean;
}

export interface MovimientoContable {
  id: number;
  cuentaCodigo: string;
  cuentaNombre: string;
  debito: number;
  credito: number;
  descripcion: string | null;
}

export interface AsientoContable {
  id: number;
  numero: string;
  fecha: string;
  concepto: string;
  origen: string;
  referenciaId: number | null;
  usuario: string;
  estado: 'CONTABILIZADO' | 'ANULADO';
  movimientos: MovimientoContable[];
}

export interface AsientoManualRequest {
  fecha?: string;
  concepto: string;
  lineas: { cuentaContableId: number; debito: number; credito: number; descripcion?: string }[];
}

export interface LibroMayorLinea {
  fecha: string;
  asientoNumero: string;
  descripcion: string | null;
  debito: number;
  credito: number;
  saldoAcumulado: number;
}

export interface LibroMayor {
  cuentaCodigo: string;
  cuentaNombre: string;
  saldoInicial: number;
  movimientos: LibroMayorLinea[];
  saldoFinal: number;
}

export interface BalanceDePruebaLinea {
  codigo: string;
  nombre: string;
  tipo: string;
  totalDebito: number;
  totalCredito: number;
  saldo: number;
}

export interface EstadoResultados {
  ingresos: number;
  costos: number;
  gastos: number;
  utilidadBruta: number;
  utilidadNeta: number;
  detalleIngresos: BalanceDePruebaLinea[];
  detalleCostos: BalanceDePruebaLinea[];
  detalleGastos: BalanceDePruebaLinea[];
}

export interface BalanceGeneral {
  activos: BalanceDePruebaLinea[];
  totalActivos: number;
  pasivos: BalanceDePruebaLinea[];
  totalPasivos: number;
  patrimonio: BalanceDePruebaLinea[];
  totalPatrimonio: number;
  utilidadDelEjercicio: number;
  totalPasivoMasPatrimonio: number;
  cuadra: boolean;
}

export interface PeriodoContable {
  id: number;
  anio: number;
  mes: number;
  estado: 'ABIERTO' | 'CERRADO';
  fechaCierre: string | null;
}

export interface MapeoContable {
  concepto: string;
  cuentaContableId: number;
  cuentaCodigo: string;
  cuentaNombre: string;
}
