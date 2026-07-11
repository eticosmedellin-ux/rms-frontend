export interface NombreValor {
  nombre: string;
  valor: number;
}

export interface DashboardResponse {
  ventas: {
    hoy: number;
    mes: number;
    anio: number;
    totalPeriodo: number;
    comparativoPeriodoAnterior: number | null;
    productosMasVendidos: NombreValor[];
    categoriasMasVendidas: NombreValor[];
    ventasPorHora: NombreValor[];
  };
  inventario: {
    valorTotal: number;
    productosStockBajo: number;
    productosAgotados: number;
    mayorRotacion: NombreValor[];
    menorRotacion: NombreValor[];
  };
  caja: {
    saldoActual: number;
    ingresos: number;
    salidas: number;
    efectivo: number;
    tarjeta: number;
    transferencia: number;
    otros: number;
  };
  clientes: {
    nuevos: number;
    frecuentes: number;
    conCartera: number;
    totalCuentasPorCobrar: number;
  };
  compras: {
    totalCompras: number;
    totalGastos: number;
    proveedoresPrincipales: NombreValor[];
  };
  indicadores: {
    utilidadEstimada: number;
    margenPorcentaje: number;
    ticketPromedio: number;
    numeroVentas: number;
    cantidadProductosVendidos: number;
  };
}
