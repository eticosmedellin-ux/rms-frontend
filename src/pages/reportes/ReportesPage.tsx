import { useState } from 'react';
import { Download } from 'lucide-react';
import { useReporteVentas, useReporteUtilidad, useReporteValorInventario } from '@/hooks/useGestion';
import { LoadingState } from '@/components/ui/States';
import { descargarArchivo } from '@/lib/descargarArchivo';

function primerDiaDelMes(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ReportesPage() {
  const [desde, setDesde] = useState(primerDiaDelMes());
  const [hasta, setHasta] = useState(hoy());
  const [consultar, setConsultar] = useState(false);

  const { data: ventas, isLoading: cargandoVentas } = useReporteVentas(desde, hasta, consultar);
  const { data: utilidad, isLoading: cargandoUtilidad } = useReporteUtilidad(desde, hasta, consultar);
  const { data: valorInventario, isLoading: cargandoInventario } = useReporteValorInventario();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-800">Reportes</h1>
      <p className="mt-1 text-sm text-ink-400">Ventas, utilidad y valor de inventario.</p>

      <div className="mt-5 flex items-end gap-3 rounded-xl border border-ink-100 bg-white p-4 shadow-card">
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

      {/* Reporte de ventas */}
      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-ink-700">Ventas</h2>
        {!consultar ? (
          <p className="text-sm text-ink-400">Elige un rango de fechas y dale clic a "Consultar".</p>
        ) : cargandoVentas ? (
          <LoadingState />
        ) : ventas ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <KpiCard label="N.º de ventas" value={ventas.totalVentas.toString()} />
            <KpiCard label="Ingresos totales" value={`$${ventas.totalIngresos.toLocaleString('es-CO')}`} />
            <KpiCard label="Descuentos totales" value={`$${ventas.totalDescuentos.toLocaleString('es-CO')}`} />
            <KpiCard label="Venta promedio" value={`$${ventas.promedioVenta.toLocaleString('es-CO')}`} />
          </div>
        ) : null}
      </section>

      {/* Reporte de utilidad */}
      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-700">Utilidad</h2>
          {consultar && utilidad && (
            <button
              onClick={() => descargarArchivo('/reportes/utilidad/exportar', 'utilidad.xlsx', { desde, hasta })}
              className="flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1 text-xs font-medium text-ink-600 hover:bg-ink-50"
            >
              <Download size={13} />
              Exportar a Excel
            </button>
          )}
        </div>
        {!consultar ? (
          <p className="text-sm text-ink-400">—</p>
        ) : cargandoUtilidad ? (
          <LoadingState />
        ) : utilidad ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <KpiCard label="Ingresos" value={`$${utilidad.ingresos.toLocaleString('es-CO')}`} />
            <KpiCard label="Costo de ventas" value={`$${utilidad.costoVentas.toLocaleString('es-CO')}`} />
            <KpiCard label="Gastos" value={`$${utilidad.gastos.toLocaleString('es-CO')}`} />
            <KpiCard label="Utilidad bruta" value={`$${utilidad.utilidadBruta.toLocaleString('es-CO')}`} />
            <KpiCard
              label="Utilidad neta"
              value={`$${utilidad.utilidadNeta.toLocaleString('es-CO')}`}
              tone={utilidad.utilidadNeta >= 0 ? 'text-success-600' : 'text-danger-500'}
            />
          </div>
        ) : null}
      </section>

      {/* Valor de inventario */}
      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-700">Valor de inventario por sucursal</h2>
          {valorInventario && valorInventario.length > 0 && (
            <button
              onClick={() => descargarArchivo('/reportes/inventario-valor/exportar', 'valor_inventario.xlsx')}
              className="flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1 text-xs font-medium text-ink-600 hover:bg-ink-50"
            >
              <Download size={13} />
              Exportar a Excel
            </button>
          )}
        </div>
        {cargandoInventario ? (
          <LoadingState />
        ) : valorInventario && valorInventario.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {valorInventario.map((v) => (
              <KpiCard key={v.sucursalId} label={v.sucursalNombre} value={`$${v.valorInventario.toLocaleString('es-CO')}`} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-400">Sin datos de inventario todavía.</p>
        )}
      </section>
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
