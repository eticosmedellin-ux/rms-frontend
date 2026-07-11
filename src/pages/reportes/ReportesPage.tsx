import { useState, type ReactNode } from 'react';
import { Download } from 'lucide-react';
import { useReporteVentas, useReporteUtilidad, useReporteValorInventario } from '@/hooks/useGestion';
import {
  useReporteKardex, useReporteComprasDetalle, useReporteGastosDetalle,
  useReporteClientesDetalle, useReporteProveedoresDetalle, useReporteArqueos, useReporteCuentasPorPagarDetalle,
} from '@/hooks/useReportesExtendidos';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { descargarArchivo } from '@/lib/descargarArchivo';

function primerDiaDelMes(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}
function money(v: number) {
  return `$${v.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`;
}

const TABS = [
  { id: 'resumen', label: 'Resumen (ventas, utilidad, inventario)', usaFechas: true },
  { id: 'kardex', label: 'Kardex', usaFechas: true },
  { id: 'compras', label: 'Compras', usaFechas: true },
  { id: 'gastos', label: 'Gastos', usaFechas: true },
  { id: 'clientes', label: 'Clientes', usaFechas: false },
  { id: 'proveedores', label: 'Proveedores', usaFechas: false },
  { id: 'arqueos', label: 'Arqueos de caja', usaFechas: true },
  { id: 'cxp', label: 'Cuentas por pagar', usaFechas: false },
] as const;

export default function ReportesPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('resumen');
  const [desde, setDesde] = useState(primerDiaDelMes());
  const [hasta, setHasta] = useState(hoy());
  const [consultar, setConsultar] = useState(false);

  const tabActual = TABS.find((t) => t.id === tab)!;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-800">Centro de reportes</h1>
      <p className="mt-1 text-sm text-ink-400">Consulta, filtra, exporta a Excel e imprime cualquier reporte del sistema.</p>

      <div className="mt-4 flex gap-1 overflow-x-auto rounded-lg bg-ink-50 p-1 text-sm font-medium">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap rounded-md px-3 py-2 transition-colors ${
              tab === t.id ? 'bg-white text-ink-800 shadow-sm' : 'text-ink-400 hover:text-ink-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tabActual.usaFechas && (
        <div className="mt-4 flex items-end gap-3 rounded-xl border border-ink-100 bg-white p-4 shadow-card">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-600">Desde</span>
            <input type="date" className="input" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-600">Hasta</span>
            <input type="date" className="input" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </label>
          <button
            onClick={() => setConsultar(true)}
            className="rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700"
          >
            Consultar
          </button>
        </div>
      )}

      <div className="mt-6">
        {tab === 'resumen' && <ResumenTab desde={desde} hasta={hasta} consultar={consultar} />}
        {tab === 'kardex' && <KardexTab desde={desde} hasta={hasta} consultar={consultar} />}
        {tab === 'compras' && <ComprasTab desde={desde} hasta={hasta} consultar={consultar} />}
        {tab === 'gastos' && <GastosTab desde={desde} hasta={hasta} consultar={consultar} />}
        {tab === 'clientes' && <ClientesReporteTab />}
        {tab === 'proveedores' && <ProveedoresReporteTab />}
        {tab === 'arqueos' && <ArqueosTab desde={desde} hasta={hasta} consultar={consultar} />}
        {tab === 'cxp' && <CuentasPorPagarTab />}
      </div>
    </div>
  );
}

function BotonExportar({ url, params, nombre }: { url: string; params?: Record<string, string>; nombre: string }) {
  return (
    <button
      onClick={() => descargarArchivo(url, nombre, params)}
      className="flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-50"
    >
      <Download size={13} />
      Exportar a Excel
    </button>
  );
}

function Encabezado({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-ink-700">{titulo}</h2>
      {children}
    </div>
  );
}

function KpiCard({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
      <p className="text-xs font-medium text-ink-400">{label}</p>
      <p className={`mt-1 font-display text-xl font-semibold ${tone ?? 'text-ink-800'}`}>{value}</p>
    </div>
  );
}

function ResumenTab({ desde, hasta, consultar }: { desde: string; hasta: string; consultar: boolean }) {
  const { data: ventas, isLoading: cargandoVentas } = useReporteVentas(desde, hasta, consultar);
  const { data: utilidad, isLoading: cargandoUtilidad } = useReporteUtilidad(desde, hasta, consultar);
  const { data: valorInventario, isLoading: cargandoInventario } = useReporteValorInventario();

  if (!consultar) return <p className="text-sm text-ink-400">Elige un rango de fechas y dale clic a "Consultar".</p>;

  return (
    <div className="space-y-6">
      <section>
        <Encabezado titulo="Ventas">
          <BotonExportar url="/reportes/ventas/exportar" params={{ desde, hasta }} nombre="ventas.xlsx" />
        </Encabezado>
        {cargandoVentas ? (
          <LoadingState />
        ) : ventas ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <KpiCard label="N.º de ventas" value={ventas.totalVentas.toString()} />
            <KpiCard label="Ingresos totales" value={money(ventas.totalIngresos)} />
            <KpiCard label="Descuentos totales" value={money(ventas.totalDescuentos)} />
            <KpiCard label="Venta promedio" value={money(ventas.promedioVenta)} />
          </div>
        ) : null}
      </section>

      <section>
        <Encabezado titulo="Utilidad">
          {utilidad && <BotonExportar url="/reportes/utilidad/exportar" params={{ desde, hasta }} nombre="utilidad.xlsx" />}
        </Encabezado>
        {cargandoUtilidad ? (
          <LoadingState />
        ) : utilidad ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <KpiCard label="Ingresos" value={money(utilidad.ingresos)} />
            <KpiCard label="Costo de ventas" value={money(utilidad.costoVentas)} />
            <KpiCard label="Gastos" value={money(utilidad.gastos)} />
            <KpiCard label="Utilidad bruta" value={money(utilidad.utilidadBruta)} />
            <KpiCard label="Utilidad neta" value={money(utilidad.utilidadNeta)} tone={utilidad.utilidadNeta >= 0 ? 'text-success-600' : 'text-danger-500'} />
          </div>
        ) : null}
      </section>

      <section>
        <Encabezado titulo="Valor de inventario por sucursal">
          {valorInventario && valorInventario.length > 0 && (
            <BotonExportar url="/reportes/inventario-valor/exportar" nombre="valor_inventario.xlsx" />
          )}
        </Encabezado>
        {cargandoInventario ? (
          <LoadingState />
        ) : valorInventario && valorInventario.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {valorInventario.map((v) => (
              <KpiCard key={v.sucursalId} label={v.sucursalNombre} value={money(v.valorInventario)} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-400">Sin datos de inventario todavía.</p>
        )}
      </section>
    </div>
  );
}

function KardexTab({ desde, hasta, consultar }: { desde: string; hasta: string; consultar: boolean }) {
  const { data, isLoading } = useReporteKardex(desde, hasta, consultar);
  if (!consultar) return <p className="text-sm text-ink-400">Elige un rango de fechas y dale clic a "Consultar".</p>;
  if (isLoading) return <LoadingState />;
  if (!data || data.length === 0) return <EmptyState title="Sin movimientos en este período" />;

  return (
    <div>
      <Encabezado titulo={`${data.length} movimiento(s)`}>
        <BotonExportar url="/reportes/kardex/exportar" params={{ desde, hasta }} nombre="kardex.xlsx" />
      </Encabezado>
      <Tabla
        columnas={['Fecha', 'Producto', 'Sucursal', 'Tipo', 'Cantidad', 'Costo unitario', 'Saldo', 'Origen']}
        filas={data.map((k) => [
          new Date(k.fecha).toLocaleString('es-CO'), k.producto, k.sucursal, k.tipoMovimiento,
          k.cantidad, money(k.costoUnitario), k.saldoResultante, k.referenciaTipo ?? '—',
        ])}
      />
    </div>
  );
}

function ComprasTab({ desde, hasta, consultar }: { desde: string; hasta: string; consultar: boolean }) {
  const { data, isLoading } = useReporteComprasDetalle(desde, hasta, consultar);
  if (!consultar) return <p className="text-sm text-ink-400">Elige un rango de fechas y dale clic a "Consultar".</p>;
  if (isLoading) return <LoadingState />;
  if (!data || data.length === 0) return <EmptyState title="Sin compras en este período" />;

  return (
    <div>
      <Encabezado titulo={`${data.length} factura(s) de compra`}>
        <BotonExportar url="/reportes/compras/exportar" params={{ desde, hasta }} nombre="compras.xlsx" />
      </Encabezado>
      <Tabla
        columnas={['Factura', 'Proveedor', 'Fecha', 'Total', 'Estado']}
        filas={data.map((c) => [
          c.numeroFacturaProveedor, c.proveedor, new Date(c.fechaEmision).toLocaleDateString('es-CO'),
          money(c.total), c.estado,
        ])}
      />
    </div>
  );
}

function GastosTab({ desde, hasta, consultar }: { desde: string; hasta: string; consultar: boolean }) {
  const { data, isLoading } = useReporteGastosDetalle(desde, hasta, consultar);
  if (!consultar) return <p className="text-sm text-ink-400">Elige un rango de fechas y dale clic a "Consultar".</p>;
  if (isLoading) return <LoadingState />;
  if (!data || data.length === 0) return <EmptyState title="Sin gastos en este período" />;

  return (
    <div>
      <Encabezado titulo={`${data.length} gasto(s)`}>
        <BotonExportar url="/reportes/gastos/exportar" params={{ desde, hasta }} nombre="gastos.xlsx" />
      </Encabezado>
      <Tabla
        columnas={['Fecha', 'Categoría', 'Concepto', 'Monto', 'Sucursal', 'Método de pago']}
        filas={data.map((g) => [
          new Date(g.fecha).toLocaleString('es-CO'), g.categoria, g.concepto, money(g.monto), g.sucursal, g.metodoPago,
        ])}
      />
    </div>
  );
}

function ClientesReporteTab() {
  const { data, isLoading } = useReporteClientesDetalle();
  if (isLoading) return <LoadingState />;
  if (!data || data.length === 0) return <EmptyState title="Sin clientes registrados" />;

  return (
    <div>
      <Encabezado titulo={`${data.length} cliente(s)`}>
        <BotonExportar url="/reportes/clientes/exportar" nombre="clientes.xlsx" />
      </Encabezado>
      <Tabla
        columnas={['Cliente', 'Total comprado', 'Saldo pendiente', 'Límite de crédito']}
        filas={data.map((c) => [c.nombre, money(c.totalComprado), money(c.saldoPendiente), money(c.limiteCredito)])}
      />
    </div>
  );
}

function ProveedoresReporteTab() {
  const { data, isLoading } = useReporteProveedoresDetalle();
  if (isLoading) return <LoadingState />;
  if (!data || data.length === 0) return <EmptyState title="Sin proveedores registrados" />;

  return (
    <div>
      <Encabezado titulo={`${data.length} proveedor(es)`}>
        <BotonExportar url="/reportes/proveedores/exportar" nombre="proveedores.xlsx" />
      </Encabezado>
      <Tabla
        columnas={['Proveedor', 'Total comprado', 'Facturas pendientes', 'Saldo pendiente']}
        filas={data.map((p) => [p.nombre, money(p.totalComprado), p.facturasPendientes, money(p.saldoPendiente)])}
      />
    </div>
  );
}

function ArqueosTab({ desde, hasta, consultar }: { desde: string; hasta: string; consultar: boolean }) {
  const { data, isLoading } = useReporteArqueos(desde, hasta, consultar);
  if (!consultar) return <p className="text-sm text-ink-400">Elige un rango de fechas y dale clic a "Consultar".</p>;
  if (isLoading) return <LoadingState />;
  if (!data || data.length === 0) return <EmptyState title="Sin cierres de caja en este período" />;

  return (
    <div>
      <Encabezado titulo={`${data.length} arqueo(s)`}>
        <BotonExportar url="/reportes/arqueos/exportar" params={{ desde, hasta }} nombre="arqueos.xlsx" />
      </Encabezado>
      <Tabla
        columnas={['Sucursal', 'Usuario', 'Apertura', 'Cierre', 'Sistema', 'Real', 'Diferencia']}
        filas={data.map((a) => [
          a.sucursal, a.usuario, new Date(a.fechaApertura).toLocaleString('es-CO'),
          new Date(a.fechaCierre).toLocaleString('es-CO'), money(a.montoCierreSistema), money(a.montoCierreReal),
          money(a.diferencia),
        ])}
      />
    </div>
  );
}

function CuentasPorPagarTab() {
  const { data, isLoading } = useReporteCuentasPorPagarDetalle();
  if (isLoading) return <LoadingState />;
  if (!data || data.length === 0) return <EmptyState title="Sin cuentas por pagar pendientes" />;

  return (
    <div>
      <Encabezado titulo={`${data.length} cuenta(s) pendiente(s)`}>
        <BotonExportar url="/reportes/cuentas-por-pagar/exportar" nombre="cuentas_por_pagar.xlsx" />
      </Encabezado>
      <Tabla
        columnas={['Proveedor', 'Factura', 'Saldo pendiente', 'Vencimiento', 'Estado']}
        filas={data.map((c) => [
          c.proveedor, c.numeroFactura, money(c.saldoPendiente),
          c.fechaVencimiento ? new Date(c.fechaVencimiento).toLocaleDateString('es-CO') : '—', c.estado,
        ])}
      />
    </div>
  );
}

function Tabla({ columnas, filas }: { columnas: string[]; filas: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white shadow-card">
      <table className="w-full text-sm">
        <thead className="border-b border-ink-100 bg-ink-50 text-xs text-ink-500">
          <tr>
            {columnas.map((c) => (
              <th key={c} className="px-4 py-3 text-left font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-50">
          {filas.map((fila, i) => (
            <tr key={i} className="hover:bg-ink-50/60">
              {fila.map((valor, j) => (
                <td key={j} className="px-4 py-3 text-ink-700">
                  {valor}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
