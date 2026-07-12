import { useEffect, useState, type ReactNode } from 'react';
import { Plus, ShieldCheck, ShieldAlert, Lock, Unlock, XCircle } from 'lucide-react';
import {
  useContabilidadActiva, useActivarContabilidad, useCuentasContables, useLibroDiario, useCrearAsientoManual,
  useAnularAsiento, useLibroMayor, useBalanceDePrueba, useEstadoDeResultados, useBalanceGeneral,
  usePeriodosContables, useCerrarPeriodoContable, useReabrirPeriodoContable, useMapeoContable, useActualizarMapeoContable,
} from '@/hooks/useContabilidad';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { Modal } from '@/components/ui/Modal';
import { getApiErrorMessage } from '@/api/errors';

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
function nombreMes(mes: number) {
  return ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][mes - 1];
}

const TABS = [
  { id: 'diario', label: 'Libro Diario' },
  { id: 'cuentas', label: 'Plan de Cuentas' },
  { id: 'mayor', label: 'Libro Mayor' },
  { id: 'balance-prueba', label: 'Balance de Prueba' },
  { id: 'resultados', label: 'Estado de Resultados' },
  { id: 'balance-general', label: 'Balance General' },
  { id: 'periodos', label: 'Períodos' },
  { id: 'mapeo', label: 'Mapeo contable' },
] as const;

export default function ContabilidadPage() {
  const { data: activa, isLoading: cargandoActiva } = useContabilidadActiva();
  const activar = useActivarContabilidad();
  const [errorActivar, setErrorActivar] = useState<string | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('diario');
  const [desde, setDesde] = useState(primerDiaDelMes());
  const [hasta, setHasta] = useState(hoy());

  async function handleActivar() {
    setErrorActivar(null);
    try {
      await activar.mutateAsync();
    } catch (err) {
      setErrorActivar(getApiErrorMessage(err, 'No se pudo activar la contabilidad'));
    }
  }

  if (cargandoActiva) return <LoadingState />;

  if (!activa) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-ink-100 bg-white p-8 text-center shadow-card">
        <ShieldAlert size={36} className="mx-auto mb-3 text-amber-500" />
        <h1 className="font-display text-lg font-semibold text-ink-800">Contabilidad no activada</h1>
        <p className="mt-2 text-sm text-ink-500">
          Esto crea el Plan Único de Cuentas (PUC) estándar colombiano para tu empresa, con el mapeo contable
          predeterminado ya configurado. Podrás ajustarlo después.
        </p>
        <p className="mt-2 text-xs text-amber-700">
          ⚠️ Antes de usarlo para declarar impuestos oficialmente, un contador público debe revisar que el plan y el
          mapeo sean correctos para tu negocio.
        </p>
        {errorActivar && (
          <div className="mt-3 rounded-lg bg-danger-50 px-3 py-2.5 text-left text-sm text-danger-600">{errorActivar}</div>
        )}
        <button
          onClick={handleActivar}
          disabled={activar.isPending}
          className="mt-5 rounded-lg bg-ink-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
        >
          Activar Contabilidad
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-800">Contabilidad</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-400">
            <ShieldCheck size={14} className="text-success-500" />
            Módulo activo — partida doble con PUC colombiano
          </p>
        </div>
      </div>

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

      {['diario', 'resultados'].includes(tab) && (
        <div className="mt-4 flex items-end gap-3 rounded-xl border border-ink-100 bg-white p-4 shadow-card">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-600">Desde</span>
            <input type="date" className="input" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-600">Hasta</span>
            <input type="date" className="input" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </label>
        </div>
      )}

      <div className="mt-6">
        {tab === 'diario' && <LibroDiarioTab desde={desde} hasta={hasta} />}
        {tab === 'cuentas' && <PlanDeCuentasTab />}
        {tab === 'mayor' && <LibroMayorTab />}
        {tab === 'balance-prueba' && <BalanceDePruebaTab />}
        {tab === 'resultados' && <EstadoResultadosTab desde={desde} hasta={hasta} />}
        {tab === 'balance-general' && <BalanceGeneralTab />}
        {tab === 'periodos' && <PeriodosTab />}
        {tab === 'mapeo' && <MapeoContableTab />}
      </div>
    </div>
  );
}

function Tabla({ columnas, filas }: { columnas: string[]; filas: (string | number | ReactNode)[][] }) {
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

function LibroDiarioTab({ desde, hasta }: { desde: string; hasta: string }) {
  const { data: asientos, isLoading } = useLibroDiario(`${desde}T00:00:00`, `${hasta}T23:59:59`, true);
  const anular = useAnularAsiento();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [expandido, setExpandido] = useState<number | null>(null);

  if (isLoading) return <LoadingState />;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-ink-400">{asientos?.length ?? 0} asiento(s) en el período</p>
        <button
          onClick={() => setModalAbierto(true)}
          className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700"
        >
          <Plus size={16} />
          Asiento manual
        </button>
      </div>

      {asientos && asientos.length > 0 ? (
        <div className="space-y-2">
          {asientos.map((a) => (
            <div key={a.id} className="rounded-xl border border-ink-100 bg-white shadow-card">
              <button
                onClick={() => setExpandido(expandido === a.id ? null : a.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <div>
                  <span className="font-mono text-xs text-ink-500">{a.numero}</span>
                  <span className="ml-3 text-sm text-ink-800">{a.concepto}</span>
                  {a.estado === 'ANULADO' && (
                    <span className="ml-2 rounded-full bg-danger-50 px-2 py-0.5 text-xs font-medium text-danger-600">
                      Anulado
                    </span>
                  )}
                </div>
                <span className="text-xs text-ink-400">{new Date(a.fecha).toLocaleString('es-CO')}</span>
              </button>
              {expandido === a.id && (
                <div className="border-t border-ink-100 px-4 py-3">
                  <table className="w-full text-xs">
                    <thead className="text-ink-400">
                      <tr>
                        <th className="pb-1 text-left">Cuenta</th>
                        <th className="pb-1 text-right">Débito</th>
                        <th className="pb-1 text-right">Crédito</th>
                        <th className="pb-1 text-left">Descripción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {a.movimientos.map((m) => (
                        <tr key={m.id} className="border-t border-ink-50">
                          <td className="py-1.5">
                            {m.cuentaCodigo} — {m.cuentaNombre}
                          </td>
                          <td className="py-1.5 text-right">{m.debito > 0 ? money(m.debito) : '—'}</td>
                          <td className="py-1.5 text-right">{m.credito > 0 ? money(m.credito) : '—'}</td>
                          <td className="py-1.5 text-ink-400">{m.descripcion}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {a.estado === 'CONTABILIZADO' && (
                    <button
                      onClick={() => anular.mutate(a.id)}
                      className="mt-3 flex items-center gap-1 text-xs font-medium text-danger-500 hover:text-danger-600"
                    >
                      <XCircle size={13} />
                      Anular este asiento
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="Sin asientos en este período" />
      )}

      <AsientoManualModal isOpen={modalAbierto} onClose={() => setModalAbierto(false)} />
    </div>
  );
}

function AsientoManualModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const crear = useCrearAsientoManual();
  const { data: cuentas } = useCuentasContables();
  const [concepto, setConcepto] = useState('');
  const [lineas, setLineas] = useState([{ cuentaContableId: '', debito: '', credito: '', descripcion: '' }]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setConcepto('');
      setLineas([{ cuentaContableId: '', debito: '', credito: '', descripcion: '' }]);
      setError(null);
    }
  }, [isOpen]);

  const totalDebito = lineas.reduce((acc, l) => acc + (Number(l.debito) || 0), 0);
  const totalCredito = lineas.reduce((acc, l) => acc + (Number(l.credito) || 0), 0);

  function agregarLinea() {
    setLineas((prev) => [...prev, { cuentaContableId: '', debito: '', credito: '', descripcion: '' }]);
  }
  function quitarLinea(i: number) {
    setLineas((prev) => prev.filter((_, idx) => idx !== i));
  }
  function actualizarLinea(i: number, cambios: Partial<(typeof lineas)[number]>) {
    setLineas((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...cambios } : l)));
  }

  async function handleGuardar() {
    setError(null);
    if (!concepto.trim()) {
      setError('El concepto es obligatorio');
      return;
    }
    if (totalDebito.toFixed(2) !== totalCredito.toFixed(2)) {
      setError(`El asiento no cuadra: débitos ${money(totalDebito)} vs créditos ${money(totalCredito)}`);
      return;
    }
    try {
      await crear.mutateAsync({
        concepto,
        lineas: lineas
          .filter((l) => l.cuentaContableId)
          .map((l) => ({
            cuentaContableId: Number(l.cuentaContableId),
            debito: Number(l.debito) || 0,
            credito: Number(l.credito) || 0,
            descripcion: l.descripcion || undefined,
          })),
      });
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo crear el asiento'));
    }
  }

  const cuentasQuePermiten = cuentas?.filter((c) => c.permiteMovimientos && c.estado) ?? [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo asiento manual" size="lg">
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Concepto</span>
          <input className="input" value={concepto} onChange={(e) => setConcepto(e.target.value)} />
        </label>

        <div className="space-y-2">
          {lineas.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                className="input flex-1"
                value={l.cuentaContableId}
                onChange={(e) => actualizarLinea(i, { cuentaContableId: e.target.value })}
              >
                <option value="">Cuenta…</option>
                {cuentasQuePermiten.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.codigo} — {c.nombre}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Débito"
                className="input w-24"
                value={l.debito}
                onChange={(e) => actualizarLinea(i, { debito: e.target.value, credito: '' })}
              />
              <input
                type="number"
                placeholder="Crédito"
                className="input w-24"
                value={l.credito}
                onChange={(e) => actualizarLinea(i, { credito: e.target.value, debito: '' })}
              />
              <input
                placeholder="Descripción"
                className="input flex-1"
                value={l.descripcion}
                onChange={(e) => actualizarLinea(i, { descripcion: e.target.value })}
              />
              {lineas.length > 2 && (
                <button onClick={() => quitarLinea(i)} className="text-ink-300 hover:text-danger-500">
                  <XCircle size={16} />
                </button>
              )}
            </div>
          ))}
        </div>

        <button onClick={agregarLinea} className="flex items-center gap-1 text-xs font-medium text-ink-600 hover:text-ink-900">
          <Plus size={14} />
          Agregar línea
        </button>

        <div className="flex justify-between rounded-lg bg-ink-50 px-3 py-2 text-sm">
          <span>Total débito: {money(totalDebito)}</span>
          <span>Total crédito: {money(totalCredito)}</span>
        </div>

        {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50">
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={crear.isPending}
            className="rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
          >
            Guardar asiento
          </button>
        </div>
      </div>
    </Modal>
  );
}

function PlanDeCuentasTab() {
  const { data: cuentas, isLoading } = useCuentasContables();
  if (isLoading) return <LoadingState />;
  if (!cuentas || cuentas.length === 0) return <EmptyState title="Sin plan de cuentas" />;

  return (
    <Tabla
      columnas={['Código', 'Nombre', 'Tipo', 'Naturaleza', 'Nivel', 'Admite movimientos']}
      filas={cuentas.map((c) => [
        c.codigo,
        <span key={c.id} style={{ paddingLeft: `${(c.nivel - 1) * 16}px` }}>
          {c.nombre}
        </span>,
        c.tipo,
        c.naturaleza,
        c.nivel,
        c.permiteMovimientos ? 'Sí' : 'No',
      ])}
    />
  );
}

function LibroMayorTab() {
  const { data: cuentas } = useCuentasContables();
  const [cuentaId, setCuentaId] = useState('');
  const [desde, setDesde] = useState(primerDiaDelMes());
  const [hasta, setHasta] = useState(hoy());
  const { data: mayor, isLoading } = useLibroMayor(
    cuentaId ? Number(cuentaId) : null, `${desde}T00:00:00`, `${hasta}T23:59:59`
  );

  const cuentasQuePermiten = cuentas?.filter((c) => c.permiteMovimientos) ?? [];

  return (
    <div>
      <div className="mb-4 flex items-end gap-3 rounded-xl border border-ink-100 bg-white p-4 shadow-card">
        <label className="block flex-1">
          <span className="mb-1 block text-xs font-medium text-ink-600">Cuenta</span>
          <select className="input" value={cuentaId} onChange={(e) => setCuentaId(e.target.value)}>
            <option value="">Selecciona una cuenta…</option>
            {cuentasQuePermiten.map((c) => (
              <option key={c.id} value={c.id}>
                {c.codigo} — {c.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-600">Desde</span>
          <input type="date" className="input" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-600">Hasta</span>
          <input type="date" className="input" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </label>
      </div>

      {!cuentaId ? (
        <p className="text-sm text-ink-400">Elige una cuenta para ver su movimiento.</p>
      ) : isLoading ? (
        <LoadingState />
      ) : mayor ? (
        <div>
          <div className="mb-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
              <p className="text-xs text-ink-400">Saldo inicial</p>
              <p className="font-display text-lg font-semibold text-ink-800">{money(mayor.saldoInicial)}</p>
            </div>
            <div className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
              <p className="text-xs text-ink-400">Saldo final</p>
              <p className="font-display text-lg font-semibold text-ink-800">{money(mayor.saldoFinal)}</p>
            </div>
          </div>
          <Tabla
            columnas={['Fecha', 'Asiento', 'Descripción', 'Débito', 'Crédito', 'Saldo']}
            filas={mayor.movimientos.map((m) => [
              new Date(m.fecha).toLocaleDateString('es-CO'),
              m.asientoNumero,
              m.descripcion ?? '—',
              m.debito > 0 ? money(m.debito) : '—',
              m.credito > 0 ? money(m.credito) : '—',
              money(m.saldoAcumulado),
            ])}
          />
        </div>
      ) : null}
    </div>
  );
}

function BalanceDePruebaTab() {
  const [hasta, setHasta] = useState(hoy());
  const { data: lineas, isLoading } = useBalanceDePrueba(`${hasta}T23:59:59`, true);

  const totalDebito = lineas?.reduce((acc, l) => acc + l.totalDebito, 0) ?? 0;
  const totalCredito = lineas?.reduce((acc, l) => acc + l.totalCredito, 0) ?? 0;

  return (
    <div>
      <div className="mb-4 flex items-end gap-3 rounded-xl border border-ink-100 bg-white p-4 shadow-card">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-600">Corte al</span>
          <input type="date" className="input" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </label>
      </div>
      {isLoading ? (
        <LoadingState />
      ) : lineas && lineas.length > 0 ? (
        <div>
          <Tabla
            columnas={['Código', 'Cuenta', 'Tipo', 'Total débito', 'Total crédito', 'Saldo']}
            filas={lineas.map((l) => [l.codigo, l.nombre, l.tipo, money(l.totalDebito), money(l.totalCredito), money(l.saldo)])}
          />
          <div className="mt-3 flex justify-end gap-6 text-sm font-semibold text-ink-800">
            <span>Total débitos: {money(totalDebito)}</span>
            <span>Total créditos: {money(totalCredito)}</span>
          </div>
        </div>
      ) : (
        <EmptyState title="Sin movimientos contabilizados hasta esta fecha" />
      )}
    </div>
  );
}

function EstadoResultadosTab({ desde, hasta }: { desde: string; hasta: string }) {
  const { data, isLoading } = useEstadoDeResultados(`${desde}T00:00:00`, `${hasta}T23:59:59`, true);
  if (isLoading) return <LoadingState />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <KpiCard label="Ingresos" value={money(data.ingresos)} />
        <KpiCard label="Costos" value={money(data.costos)} />
        <KpiCard label="Utilidad bruta" value={money(data.utilidadBruta)} />
        <KpiCard label="Gastos" value={money(data.gastos)} />
        <KpiCard
          label="Utilidad neta"
          value={money(data.utilidadNeta)}
          tone={data.utilidadNeta >= 0 ? 'text-success-600' : 'text-danger-500'}
        />
      </div>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-ink-700">Ingresos</h3>
        <Tabla columnas={['Código', 'Cuenta', 'Valor']} filas={data.detalleIngresos.map((l) => [l.codigo, l.nombre, money(l.saldo)])} />
      </section>
      <section>
        <h3 className="mb-2 text-sm font-semibold text-ink-700">Costos</h3>
        <Tabla columnas={['Código', 'Cuenta', 'Valor']} filas={data.detalleCostos.map((l) => [l.codigo, l.nombre, money(l.saldo)])} />
      </section>
      <section>
        <h3 className="mb-2 text-sm font-semibold text-ink-700">Gastos</h3>
        <Tabla columnas={['Código', 'Cuenta', 'Valor']} filas={data.detalleGastos.map((l) => [l.codigo, l.nombre, money(l.saldo)])} />
      </section>
    </div>
  );
}

function BalanceGeneralTab() {
  const [hasta, setHasta] = useState(hoy());
  const { data, isLoading } = useBalanceGeneral(`${hasta}T23:59:59`, true);

  return (
    <div>
      <div className="mb-4 flex items-end gap-3 rounded-xl border border-ink-100 bg-white p-4 shadow-card">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-600">Corte al</span>
          <input type="date" className="input" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </label>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : data ? (
        <div className="space-y-6">
          <div
            className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium ${
              data.cuadra ? 'bg-success-50 text-success-600' : 'bg-danger-50 text-danger-600'
            }`}
          >
            {data.cuadra ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
            {data.cuadra ? 'El balance cuadra correctamente.' : 'El balance NO cuadra — revisa el mapeo contable.'}
          </div>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-ink-700">Activos — Total: {money(data.totalActivos)}</h3>
            <Tabla columnas={['Código', 'Cuenta', 'Saldo']} filas={data.activos.map((l) => [l.codigo, l.nombre, money(l.saldo)])} />
          </section>
          <section>
            <h3 className="mb-2 text-sm font-semibold text-ink-700">Pasivos — Total: {money(data.totalPasivos)}</h3>
            <Tabla columnas={['Código', 'Cuenta', 'Saldo']} filas={data.pasivos.map((l) => [l.codigo, l.nombre, money(l.saldo)])} />
          </section>
          <section>
            <h3 className="mb-2 text-sm font-semibold text-ink-700">Patrimonio — Total: {money(data.totalPatrimonio)}</h3>
            <Tabla
              columnas={['Código', 'Cuenta', 'Saldo']}
              filas={[
                ...data.patrimonio.map((l) => [l.codigo, l.nombre, money(l.saldo)]),
                ['—', 'Utilidad del ejercicio (acumulada del año)', money(data.utilidadDelEjercicio)],
              ]}
            />
          </section>
        </div>
      ) : null}
    </div>
  );
}

function KpiCard({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
      <p className="text-xs font-medium text-ink-400">{label}</p>
      <p className={`mt-1 font-display text-lg font-semibold ${tone ?? 'text-ink-800'}`}>{value}</p>
    </div>
  );
}

function PeriodosTab() {
  const { data: periodos, isLoading } = usePeriodosContables();
  const cerrar = useCerrarPeriodoContable();
  const reabrir = useReabrirPeriodoContable();

  if (isLoading) return <LoadingState />;
  if (!periodos || periodos.length === 0) return <EmptyState title="Sin períodos todavía" />;

  return (
    <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white shadow-card">
      <table className="w-full text-sm">
        <thead className="border-b border-ink-100 bg-ink-50 text-xs text-ink-500">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Período</th>
            <th className="px-4 py-3 text-left font-medium">Estado</th>
            <th className="px-4 py-3 text-left font-medium">Fecha de cierre</th>
            <th className="px-4 py-3 text-right font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-50">
          {periodos.map((p) => (
            <tr key={p.id} className="hover:bg-ink-50/60">
              <td className="px-4 py-3 font-medium text-ink-800">
                {nombreMes(p.mes)} {p.anio}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    p.estado === 'ABIERTO' ? 'bg-success-50 text-success-600' : 'bg-ink-100 text-ink-500'
                  }`}
                >
                  {p.estado === 'ABIERTO' ? 'Abierto' : 'Cerrado'}
                </span>
              </td>
              <td className="px-4 py-3 text-ink-500">
                {p.fechaCierre ? new Date(p.fechaCierre).toLocaleString('es-CO') : '—'}
              </td>
              <td className="px-4 py-3 text-right">
                {p.estado === 'ABIERTO' ? (
                  <button
                    onClick={() => cerrar.mutate(p.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-800"
                  >
                    <Lock size={13} />
                    Cerrar período
                  </button>
                ) : (
                  <button
                    onClick={() => reabrir.mutate(p.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700"
                  >
                    <Unlock size={13} />
                    Reabrir
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const ETIQUETAS_CONCEPTO: Record<string, string> = {
  CAJA: 'Caja (ventas/pagos en efectivo)',
  BANCOS: 'Bancos',
  CLIENTES: 'Cuentas por cobrar a clientes',
  PROVEEDORES: 'Cuentas por pagar a proveedores',
  INVENTARIOS: 'Inventarios',
  VENTAS: 'Ingresos por ventas',
  COSTO_VENTAS: 'Costo de ventas',
  IVA_VENTAS: 'IVA generado en ventas',
  IVA_COMPRAS: 'IVA descontable en compras',
  COMPRAS: 'Compras de mercancía',
  GASTOS_GENERALES: 'Gastos generales',
  DESCUENTOS_VENTAS: 'Descuentos y devoluciones en ventas',
};

function MapeoContableTab() {
  const { data: mapeo, isLoading } = useMapeoContable();
  const { data: cuentas } = useCuentasContables();
  const actualizar = useActualizarMapeoContable();

  if (isLoading) return <LoadingState />;
  const cuentasQuePermiten = cuentas?.filter((c) => c.permiteMovimientos) ?? [];

  return (
    <div>
      <p className="mb-3 text-xs text-ink-400">
        Aquí decides qué cuenta contable usa el sistema para cada tipo de operación del día a día. Un contador
        público debería revisar este mapeo antes de usarlo para declarar impuestos.
      </p>
      <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-100 bg-ink-50 text-xs text-ink-500">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Concepto</th>
              <th className="px-4 py-3 text-left font-medium">Cuenta asignada</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-50">
            {mapeo?.map((m) => (
              <tr key={m.concepto} className="hover:bg-ink-50/60">
                <td className="px-4 py-3 text-ink-700">{ETIQUETAS_CONCEPTO[m.concepto] ?? m.concepto}</td>
                <td className="px-4 py-3">
                  <select
                    className="input"
                    value={m.cuentaContableId}
                    onChange={(e) => actualizar.mutate({ concepto: m.concepto, cuentaContableId: Number(e.target.value) })}
                  >
                    {cuentasQuePermiten.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.codigo} — {c.nombre}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
