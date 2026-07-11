import { useState } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { useAuthStore } from '@/stores/authStore';
import { useSucursales } from '@/hooks/useSucursales';
import { useDashboard } from '@/hooks/useDashboard';
import { useAlertas } from '@/hooks/useGestion';
import {
  TrendingUp, TrendingDown, Package, AlertTriangle, Wallet, Users, ShoppingCart, Percent,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { LoadingState } from '@/components/ui/States';

const COLORES = ['#0f172a', '#f59e0b', '#0ea5e9', '#10b981', '#8b5cf6', '#f43f5e'];

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

export default function DashboardPage() {
  const nombreCompleto = useAuthStore((state) => state.nombreCompleto);
  const { data: sucursales } = useSucursales();
  const [desde, setDesde] = useState(primerDiaDelMes());
  const [hasta, setHasta] = useState(hoy());
  const [sucursalId, setSucursalId] = useState<number | null>(null);

  const { data, isLoading } = useDashboard(desde, hasta, sucursalId);
  const { data: alertas } = useAlertas();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-800">
            Hola, {nombreCompleto?.split(' ')[0]}
          </h1>
          <p className="mt-1 text-sm text-ink-400">Este es el estado de tu negocio.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input type="date" className="input w-auto" value={desde} onChange={(e) => setDesde(e.target.value)} />
          <span className="text-sm text-ink-400">a</span>
          <input type="date" className="input w-auto" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          <select
            className="input w-auto"
            value={sucursalId ?? ''}
            onChange={(e) => setSucursalId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Todas las sucursales</option>
            {sucursales?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {(alertas?.length ?? 0) > 0 && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">
            Tienes {alertas!.length} alerta{alertas!.length === 1 ? '' : 's'} activa{alertas!.length === 1 ? '' : 's'}.{' '}
            <Link to="/alertas" className="underline">
              Revisarlas
            </Link>
          </p>
        </div>
      )}

      {isLoading || !data ? (
        <div className="mt-8">
          <LoadingState />
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {/* Ventas */}
          <Seccion titulo="Ventas">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <Kpi label="Hoy" value={money(data.ventas.hoy)} icon={TrendingUp} tone="text-success-500" />
              <Kpi label="Este mes" value={money(data.ventas.mes)} icon={TrendingUp} tone="text-ink-600" />
              <Kpi label="Este año" value={money(data.ventas.anio)} icon={TrendingUp} tone="text-ink-600" />
              <Kpi
                label="Vs. período anterior"
                value={data.ventas.comparativoPeriodoAnterior !== null ? `${data.ventas.comparativoPeriodoAnterior}%` : '—'}
                icon={data.ventas.comparativoPeriodoAnterior !== null && data.ventas.comparativoPeriodoAnterior < 0 ? TrendingDown : TrendingUp}
                tone={
                  data.ventas.comparativoPeriodoAnterior === null
                    ? 'text-ink-400'
                    : data.ventas.comparativoPeriodoAnterior >= 0
                      ? 'text-success-500'
                      : 'text-danger-500'
                }
              />
              <Kpi label="Ventas en el período" value={money(data.ventas.totalPeriodo)} icon={ShoppingCart} tone="text-ink-600" />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <GraficoBarras titulo="Productos más vendidos" datos={data.ventas.productosMasVendidos} />
              <GraficoBarras titulo="Categorías más vendidas ($)" datos={data.ventas.categoriasMasVendidas} formatoMoneda />
              <GraficoBarras titulo="Ventas por hora" datos={data.ventas.ventasPorHora} formatoMoneda />
            </div>
          </Seccion>

          {/* Inventario */}
          <Seccion titulo="Inventario">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Kpi label="Valor del inventario" value={money(data.inventario.valorTotal)} icon={Package} tone="text-ink-600" />
              <Kpi
                label="Stock bajo"
                value={String(data.inventario.productosStockBajo)}
                icon={AlertTriangle}
                tone={data.inventario.productosStockBajo > 0 ? 'text-amber-500' : 'text-ink-400'}
              />
              <Kpi
                label="Agotados"
                value={String(data.inventario.productosAgotados)}
                icon={AlertTriangle}
                tone={data.inventario.productosAgotados > 0 ? 'text-danger-500' : 'text-ink-400'}
              />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <GraficoBarras titulo="Mayor rotación" datos={data.inventario.mayorRotacion} />
              <GraficoBarras titulo="Menor rotación" datos={data.inventario.menorRotacion} />
            </div>
          </Seccion>

          {/* Caja */}
          <Seccion titulo="Caja">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Kpi label="Saldo actual" value={money(data.caja.saldoActual)} icon={Wallet} tone="text-success-500" />
              <Kpi label="Entradas" value={money(data.caja.ingresos)} icon={TrendingUp} tone="text-success-500" />
              <Kpi label="Salidas" value={money(data.caja.salidas)} icon={TrendingDown} tone="text-danger-500" />
            </div>
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2">
              <GraficoTorta
                titulo="Ingresos por método de pago"
                datos={[
                  { nombre: 'Efectivo', valor: data.caja.efectivo },
                  { nombre: 'Tarjeta', valor: data.caja.tarjeta },
                  { nombre: 'Transferencia', valor: data.caja.transferencia },
                  { nombre: 'Otros', valor: data.caja.otros },
                ].filter((d) => d.valor > 0)}
              />
            </div>
          </Seccion>

          {/* Clientes */}
          <Seccion titulo="Clientes">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Kpi label="Nuevos" value={String(data.clientes.nuevos)} icon={Users} tone="text-ink-600" />
              <Kpi label="Frecuentes" value={String(data.clientes.frecuentes)} icon={Users} tone="text-ink-600" />
              <Kpi label="Con cartera" value={String(data.clientes.conCartera)} icon={Users} tone="text-amber-500" />
              <Kpi label="Cuentas por cobrar" value={money(data.clientes.totalCuentasPorCobrar)} icon={Wallet} tone="text-amber-500" />
            </div>
          </Seccion>

          {/* Compras */}
          <Seccion titulo="Compras y gastos">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Kpi label="Compras del período" value={money(data.compras.totalCompras)} icon={ShoppingCart} tone="text-ink-600" />
              <Kpi label="Gastos del período" value={money(data.compras.totalGastos)} icon={TrendingDown} tone="text-danger-500" />
            </div>
            {data.compras.proveedoresPrincipales.length > 0 && (
              <div className="mt-4">
                <GraficoBarras titulo="Proveedores principales" datos={data.compras.proveedoresPrincipales} formatoMoneda />
              </div>
            )}
          </Seccion>

          {/* Indicadores */}
          <Seccion titulo="Indicadores">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <Kpi label="Utilidad estimada" value={money(data.indicadores.utilidadEstimada)} icon={TrendingUp} tone="text-success-500" />
              <Kpi label="Margen" value={`${data.indicadores.margenPorcentaje}%`} icon={Percent} tone="text-ink-600" />
              <Kpi label="Ticket promedio" value={money(data.indicadores.ticketPromedio)} icon={ShoppingCart} tone="text-ink-600" />
              <Kpi label="Número de ventas" value={String(data.indicadores.numeroVentas)} icon={ShoppingCart} tone="text-ink-600" />
              <Kpi label="Productos vendidos" value={String(data.indicadores.cantidadProductosVendidos)} icon={Package} tone="text-ink-600" />
            </div>
          </Seccion>
        </div>
      )}
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 font-display text-base font-semibold text-ink-800">{titulo}</h2>
      {children}
    </section>
  );
}

function Kpi({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof TrendingUp;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ink-400">{label}</span>
        <Icon size={16} className={tone} />
      </div>
      <p className="mt-2 font-display text-lg font-semibold text-ink-800">{value}</p>
    </div>
  );
}

function GraficoBarras({
  titulo,
  datos,
  formatoMoneda,
}: {
  titulo: string;
  datos: { nombre: string; valor: number }[];
  formatoMoneda?: boolean;
}) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
      <p className="mb-2 text-xs font-medium text-ink-500">{titulo}</p>
      {datos.length === 0 ? (
        <p className="py-8 text-center text-xs text-ink-300">Sin datos en este período</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={datos} layout="vertical" margin={{ left: 8, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="nombre" width={100} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => (formatoMoneda ? money(v) : v)} />
            <Bar dataKey="valor" fill="#0f172a" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function GraficoTorta({ titulo, datos }: { titulo: string; datos: { nombre: string; valor: number }[] }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
      <p className="mb-2 text-xs font-medium text-ink-500">{titulo}</p>
      {datos.length === 0 ? (
        <p className="py-8 text-center text-xs text-ink-300">Sin datos en este período</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={datos} dataKey="valor" nameKey="nombre" outerRadius={80} label={(d) => d.nombre}>
              {datos.map((_, i) => (
                <Cell key={i} fill={COLORES[i % COLORES.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => money(v)} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
