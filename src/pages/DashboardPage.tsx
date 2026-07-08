import { useAuthStore } from '@/stores/authStore';
import { usePosStore } from '@/stores/posStore';
import { useCajaAbierta } from '@/hooks/usePos';
import { useReporteVentas, useReporteValorInventario, useAlertas } from '@/hooks/useGestion';
import { TrendingUp, Package, AlertTriangle, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';

function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const nombreCompleto = useAuthStore((state) => state.nombreCompleto);
  const { sucursalId } = usePosStore();

  const { data: ventasHoy, isLoading: cargandoVentas } = useReporteVentas(hoy(), hoy(), true);
  const { data: valorInventario, isLoading: cargandoInventario } = useReporteValorInventario();
  const { data: alertas, isLoading: cargandoAlertas } = useAlertas();
  const { data: caja, isLoading: cargandoCaja } = useCajaAbierta(sucursalId);

  const valorInventarioTotal = valorInventario?.reduce((acc, v) => acc + v.valorInventario, 0) ?? 0;

  const kpis = [
    {
      label: 'Ventas de hoy',
      value: cargandoVentas ? '…' : `$${(ventasHoy?.totalIngresos ?? 0).toLocaleString('es-CO')}`,
      icon: TrendingUp,
      tone: 'text-success-500',
    },
    {
      label: 'Alertas activas',
      value: cargandoAlertas ? '…' : String(alertas?.length ?? 0),
      icon: AlertTriangle,
      tone: (alertas?.length ?? 0) > 0 ? 'text-amber-500' : 'text-ink-400',
    },
    {
      label: 'Valor de inventario',
      value: cargandoInventario ? '…' : `$${valorInventarioTotal.toLocaleString('es-CO')}`,
      icon: Package,
      tone: 'text-ink-500',
    },
    {
      label: 'Caja actual',
      value: cargandoCaja ? '…' : caja ? `$${caja.montoApertura.toLocaleString('es-CO')} (abierta)` : 'Cerrada',
      icon: Wallet,
      tone: caja ? 'text-success-500' : 'text-ink-400',
    },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-800">
        Hola, {nombreCompleto?.split(' ')[0]}
      </h1>
      <p className="mt-1 text-sm text-ink-400">Este es el resumen de tu negocio hoy.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-xl border border-ink-100 bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink-400">{label}</span>
              <Icon size={18} className={tone} />
            </div>
            <p className="mt-3 font-display text-2xl font-semibold text-ink-800">{value}</p>
          </div>
        ))}
      </div>

      {(alertas?.length ?? 0) > 0 && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">
            Tienes {alertas!.length} alerta{alertas!.length === 1 ? '' : 's'} activa{alertas!.length === 1 ? '' : 's'}.{' '}
            <Link to="/alertas" className="underline">
              Revisarlas
            </Link>
          </p>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AccesoRapido to="/pos" label="Ir a vender" />
        <AccesoRapido to="/inventario" label="Ver inventario" />
        <AccesoRapido to="/compras" label="Registrar compra" />
        <AccesoRapido to="/reportes" label="Ver reportes" />
      </div>
    </div>
  );
}

function AccesoRapido({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="rounded-xl border border-ink-100 bg-white p-4 text-center text-sm font-medium text-ink-700 shadow-card transition-colors hover:border-ink-300 hover:bg-ink-50"
    >
      {label}
    </Link>
  );
}
