import { useState } from 'react';
import { Briefcase, ArrowLeft } from 'lucide-react';
import {
  useMisClientesContables,
  useEstadoDeResultadosCliente,
  useBalanceGeneralCliente,
} from '@/hooks/useAccesoContable';
import { LoadingState, EmptyState } from '@/components/ui/States';

function primerDiaDelMes(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}
function money(v: number) {
  return v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

/** Panel del contador — empresas clientes a las que le dieron acceso a su contabilidad,
 *  con Estado de Resultados y Balance General de solo lectura para cada una. */
export default function MisClientesContablesPage() {
  const { data: clientes, isLoading } = useMisClientesContables();
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<{ id: number; nombre: string } | null>(null);

  if (empresaSeleccionada) {
    return (
      <DetalleClienteContable
        empresaId={empresaSeleccionada.id}
        empresaNombre={empresaSeleccionada.nombre}
        onVolver={() => setEmpresaSeleccionada(null)}
      />
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-800">Mis clientes contables</h1>
      <p className="mt-1 text-sm text-ink-400">Empresas que te dieron acceso a su contabilidad.</p>

      <div className="mt-6">
        {isLoading ? (
          <LoadingState />
        ) : clientes && clientes.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {clientes.map((c) => (
              <button
                key={c.id}
                onClick={() => setEmpresaSeleccionada({ id: c.empresaClienteId, nombre: c.empresaClienteNombre })}
                className="rounded-xl border border-ink-100 bg-white p-4 text-left shadow-card hover:border-ink-300"
              >
                <div className="flex items-center gap-2">
                  <Briefcase size={18} className="text-ink-400" />
                  <p className="font-display font-semibold text-ink-800">{c.empresaClienteNombre}</p>
                </div>
                <p className="mt-1 text-xs text-ink-400">{c.nivel === 'GESTION' ? 'Acceso de gestión' : 'Solo lectura'}</p>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sin empresas todavía"
            description="Cuando un cliente te dé acceso a su contabilidad (desde Contabilidad → Contadores externos, con tu usuario), aparecerá aquí."
          />
        )}
      </div>
    </div>
  );
}

function DetalleClienteContable({
  empresaId,
  empresaNombre,
  onVolver,
}: {
  empresaId: number;
  empresaNombre: string;
  onVolver: () => void;
}) {
  const [desde, setDesde] = useState(primerDiaDelMes());
  const [hasta, setHasta] = useState(hoy());
  const { data: resultados, isLoading: cargandoResultados } = useEstadoDeResultadosCliente(empresaId, desde, hasta, true);
  const { data: balance, isLoading: cargandoBalance } = useBalanceGeneralCliente(empresaId, hasta, true);

  return (
    <div>
      <button onClick={onVolver} className="flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-800">
        <ArrowLeft size={15} />
        Volver a mis clientes
      </button>

      <h1 className="mt-2 font-display text-2xl font-semibold text-ink-800">{empresaNombre}</h1>
      <p className="text-sm text-ink-400">Vista de solo consulta — igual a lo que ve el administrador de esta empresa.</p>

      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-ink-100 bg-white p-4 shadow-card">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-600">Desde</span>
          <input type="date" className="input" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-600">Hasta</span>
          <input type="date" className="input" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </label>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
          <p className="mb-3 font-display text-base font-semibold text-ink-800">Estado de Resultados</p>
          {cargandoResultados || !resultados ? (
            <LoadingState />
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-ink-500">Ingresos</span><span className="font-medium">{money(resultados.ingresos)}</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Costos</span><span className="font-medium">{money(resultados.costos)}</span></div>
              <div className="flex justify-between border-t border-ink-100 pt-2"><span className="text-ink-600">Utilidad bruta</span><span className="font-semibold">{money(resultados.utilidadBruta)}</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Gastos</span><span className="font-medium">{money(resultados.gastos)}</span></div>
              <div className={`flex justify-between border-t border-ink-100 pt-2 font-bold ${resultados.utilidadNeta >= 0 ? 'text-success-600' : 'text-danger-500'}`}>
                <span>Utilidad neta</span><span>{money(resultados.utilidadNeta)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
          <p className="mb-3 font-display text-base font-semibold text-ink-800">Balance General</p>
          {cargandoBalance || !balance ? (
            <LoadingState />
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-ink-500">Total activos</span><span className="font-medium">{money(balance.totalActivos)}</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Total pasivos</span><span className="font-medium">{money(balance.totalPasivos)}</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Total patrimonio</span><span className="font-medium">{money(balance.totalPatrimonio)}</span></div>
              <div className="flex justify-between border-t border-ink-100 pt-2 font-semibold"><span>Utilidad del ejercicio</span><span>{money(balance.utilidadDelEjercicio)}</span></div>
              <p className={`mt-2 text-xs font-medium ${balance.cuadra ? 'text-success-600' : 'text-danger-500'}`}>
                {balance.cuadra ? '✓ El balance cuadra' : '⚠ El balance no cuadra'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
