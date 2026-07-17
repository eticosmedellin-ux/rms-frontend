import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { AlertTriangle, Building2, Users, TrendingUp, UserPlus } from 'lucide-react';
import { useDashboardEjecutivo } from '@/hooks/usePlataforma';
import { LoadingState, EmptyState } from '@/components/ui/States';

function formatoMoneda(v: number) {
  return v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

function KpiCard({ icono: Icono, etiqueta, valor, tono }: { icono: typeof Building2; etiqueta: string; valor: string; tono: string }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
      <div className="flex items-center gap-2">
        <span className={`rounded-lg p-1.5 ${tono}`}>
          <Icono size={16} />
        </span>
        <p className="text-xs font-medium text-ink-400">{etiqueta}</p>
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-ink-800">{valor}</p>
    </div>
  );
}

export function DashboardEjecutivoTab() {
  const { data, isLoading } = useDashboardEjecutivo();

  if (isLoading || !data) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard icono={Building2} etiqueta="Empresas totales" valor={String(data.totalEmpresas)} tono="bg-blue-100 text-blue-700" />
        <KpiCard icono={Building2} etiqueta="Activas" valor={String(data.empresasActivas)} tono="bg-success-50 text-success-600" />
        <KpiCard icono={Building2} etiqueta="Suspendidas" valor={String(data.empresasSuspendidas)} tono="bg-danger-50 text-danger-500" />
        <KpiCard icono={UserPlus} etiqueta="Nuevas este mes" valor={String(data.empresasNuevasEsteMes)} tono="bg-amber-100 text-amber-700" />
        <KpiCard icono={TrendingUp} etiqueta="MRR" valor={formatoMoneda(data.mrr)} tono="bg-success-50 text-success-600" />
        <KpiCard icono={Users} etiqueta="Usuarios totales" valor={String(data.totalUsuarios)} tono="bg-ink-100 text-ink-600" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
          <p className="mb-3 text-sm font-semibold text-ink-700">Ingresos por mes (últimos 6 meses)</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.ingresosPorMes} margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => formatoMoneda(v)} />
              <Bar dataKey="monto" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
          <p className="mb-3 text-sm font-semibold text-ink-700">Empresas por tipo de negocio</p>
          {data.empresasPorTipoNegocio.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.empresasPorTipoNegocio} layout="vertical" margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="etiqueta" tick={{ fontSize: 11 }} width={140} />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#1e293b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="Sin datos todavía" />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
          <p className="mb-3 text-sm font-semibold text-ink-700">Módulos más usados</p>
          {data.modulosMasUsados.length > 0 ? (
            <div className="space-y-2">
              {data.modulosMasUsados.map((m) => (
                <div key={m.etiqueta} className="flex items-center justify-between text-sm">
                  <span className="text-ink-600">{m.etiqueta}</span>
                  <span className="font-medium text-ink-800">{m.cantidad} empresas</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Sin datos todavía" />
          )}
        </div>

        <div className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
          <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-ink-700">
            <AlertTriangle size={15} className="text-danger-500" />
            Empresas en riesgo (pago vencido o fallido)
          </p>
          {data.empresasEnRiesgo.length > 0 ? (
            <div className="space-y-2">
              {data.empresasEnRiesgo.map((e) => (
                <div key={e.empresaId} className="rounded-lg bg-danger-50/60 px-3 py-2 text-sm">
                  <p className="font-medium text-ink-800">{e.nombreEmpresa}</p>
                  <p className="text-xs text-ink-500">
                    {e.estadoSuscripcion}
                    {e.ultimoPagoMensaje ? ` — ${e.ultimoPagoMensaje}` : ''}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Ninguna empresa en riesgo ahora mismo" />
          )}
        </div>
      </div>
    </div>
  );
}
