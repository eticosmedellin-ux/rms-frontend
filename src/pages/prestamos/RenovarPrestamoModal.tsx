import { useEffect, useState } from 'react';
import { Loader2, RefreshCcw, ArrowRight } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useInfoRenovacion, useRenovarPrestamo } from '@/hooks/usePrestamos';
import { getApiErrorMessage } from '@/api/errors';
import { LoadingState } from '@/components/ui/States';
import type { FrecuenciaPrestamo, TipoRenovacion } from '@/api/prestamos';

const TIPO_LABELS: Record<TipoRenovacion, string> = {
  RENOVACION: 'Renovar (cancela el préstamo anterior con uno nuevo)',
  REFINANCIACION: 'Refinanciar (solo el saldo pendiente)',
  AMPLIACION: 'Ampliar (suma dinero adicional)',
  COMPRA_CARTERA: 'Comprar cartera (asume una deuda externa)',
};

const CALIFICACION_LABELS: Record<string, { texto: string; tono: string }> = {
  BUENA: { texto: 'Buena — siempre paga a tiempo', tono: 'bg-success-50 text-success-600' },
  REGULAR: { texto: 'Regular — ha pagado tarde antes', tono: 'bg-amber-100 text-amber-700' },
  MALA: { texto: 'Mala — tiene cuotas vencidas ahora', tono: 'bg-danger-50 text-danger-600' },
  SIN_HISTORIAL: { texto: 'Sin historial de pagos todavía', tono: 'bg-ink-100 text-ink-500' },
};

function formatoMoneda(v: number) {
  return v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

export function RenovarPrestamoModal({
  isOpen,
  onClose,
  prestamoId,
}: {
  isOpen: boolean;
  onClose: () => void;
  prestamoId: number | null;
}) {
  const { data: info, isLoading } = useInfoRenovacion(isOpen ? prestamoId : null);
  const renovar = useRenovarPrestamo();

  const [tipoRenovacion, setTipoRenovacion] = useState<TipoRenovacion>('RENOVACION');
  const [montoNuevo, setMontoNuevo] = useState('');
  const [tasaInteres, setTasaInteres] = useState('');
  const [numeroCuotas, setNumeroCuotas] = useState('12');
  const [frecuenciaPago, setFrecuenciaPago] = useState<FrecuenciaPrestamo>('MENSUAL');
  const [fechaInicio, setFechaInicio] = useState(() => new Date().toISOString().slice(0, 10));
  const [notas, setNotas] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ dineroEntregado: number; prestamoNuevoId: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTipoRenovacion('RENOVACION');
      setMontoNuevo('');
      setTasaInteres('');
      setNumeroCuotas('12');
      setFrecuenciaPago('MENSUAL');
      setFechaInicio(new Date().toISOString().slice(0, 10));
      setNotas('');
      setError(null);
      setResultado(null);
    }
  }, [isOpen, prestamoId]);

  const esRefinanciacion = tipoRenovacion === 'REFINANCIACION';
  const montoEfectivo = esRefinanciacion ? info?.saldoPendienteTotal ?? 0 : Number(montoNuevo) || 0;
  const dineroEntregadoPreview = info ? montoEfectivo - info.saldoPendienteTotal : 0;

  async function handleConfirmar() {
    setError(null);
    if (!prestamoId) return;
    if (!esRefinanciacion && (!montoNuevo || Number(montoNuevo) <= 0)) {
      setError('El monto del préstamo nuevo es obligatorio');
      return;
    }
    try {
      const res = await renovar.mutateAsync({
        prestamoId,
        data: {
          tipoRenovacion,
          montoNuevo: esRefinanciacion ? undefined : Number(montoNuevo),
          tasaInteres: tasaInteres ? Number(tasaInteres) : undefined,
          numeroCuotas: Number(numeroCuotas),
          frecuenciaPago,
          fechaInicio,
          notas: notas || undefined,
        },
      });
      setResultado({ dineroEntregado: res.dineroEntregadoAlCliente, prestamoNuevoId: res.prestamoNuevo.id });
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo procesar la renovación'));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Renovar préstamo" size="lg">
      {isLoading || !info ? (
        <LoadingState />
      ) : resultado ? (
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-50 text-success-600">
            <RefreshCcw size={22} />
          </div>
          <p className="font-display text-lg font-semibold text-ink-800">Renovación completada</p>
          <p className="text-sm text-ink-500">
            El préstamo anterior quedó {esRefinanciacion ? 'refinanciado' : 'renovado'} y se creó el préstamo #{resultado.prestamoNuevoId}.
          </p>
          <div className="rounded-lg bg-ink-50 p-4">
            <p className="text-sm text-ink-600">
              Dinero {resultado.dineroEntregado >= 0 ? 'entregado al cliente' : 'que el cliente todavía debe cubrir'}:
            </p>
            <p className="mt-1 font-display text-xl font-bold text-ink-800">{formatoMoneda(Math.abs(resultado.dineroEntregado))}</p>
          </div>
          <button onClick={onClose} className="rounded-lg bg-ink-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink-700">
            Cerrar
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Información actual */}
          <div className="rounded-xl border border-ink-100 bg-ink-50 p-4">
            <div className="flex items-center justify-between">
              <p className="font-display text-base font-semibold text-ink-800">{info.clienteNombre}</p>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${CALIFICACION_LABELS[info.calificacionCliente].tono}`}>
                {CALIFICACION_LABELS[info.calificacionCliente].texto}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <p className="text-xs text-ink-400">Capital pendiente</p>
                <p className="text-sm font-semibold text-ink-800">{formatoMoneda(info.capitalPendiente)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-400">Interés pendiente</p>
                <p className="text-sm font-semibold text-ink-800">{formatoMoneda(info.interesPendiente)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-400">Cuotas pagadas</p>
                <p className="text-sm font-semibold text-ink-800">{info.cuotasPagadas}</p>
              </div>
              <div>
                <p className="text-xs text-ink-400">Cuotas faltantes</p>
                <p className="text-sm font-semibold text-ink-800">{info.cuotasFaltantes}</p>
              </div>
            </div>
            <p className="mt-3 border-t border-ink-100 pt-3 text-sm text-ink-600">
              Saldo total a cancelar con la renovación: <span className="font-semibold text-ink-800">{formatoMoneda(info.saldoPendienteTotal)}</span>
            </p>
          </div>

          {/* Nuevo préstamo */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Nuevo préstamo</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="col-span-2 block">
                <span className="mb-1 block text-xs font-medium text-ink-600">Tipo de renovación</span>
                <select className="input" value={tipoRenovacion} onChange={(e) => setTipoRenovacion(e.target.value as TipoRenovacion)}>
                  {(Object.keys(TIPO_LABELS) as TipoRenovacion[]).map((t) => (
                    <option key={t} value={t}>
                      {TIPO_LABELS[t]}
                    </option>
                  ))}
                </select>
              </label>
              {!esRefinanciacion && (
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-ink-600">Monto del préstamo nuevo</span>
                  <input type="number" className="input" value={montoNuevo} onChange={(e) => setMontoNuevo(e.target.value)} />
                </label>
              )}
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-600">Tasa de interés % (opcional)</span>
                <input type="number" className="input" value={tasaInteres} onChange={(e) => setTasaInteres(e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-600">Número de cuotas</span>
                <input type="number" min={1} className="input" value={numeroCuotas} onChange={(e) => setNumeroCuotas(e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-600">Frecuencia de pago</span>
                <select className="input" value={frecuenciaPago} onChange={(e) => setFrecuenciaPago(e.target.value as FrecuenciaPrestamo)}>
                  <option value="MENSUAL">Mensual</option>
                  <option value="QUINCENAL">Quincenal</option>
                  <option value="SEMANAL">Semanal</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-600">Fecha primer pago</span>
                <input type="date" className="input" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
              </label>
            </div>
          </div>

          {/* Cálculo automático */}
          {(esRefinanciacion || montoNuevo) && (
            <div className="rounded-lg border border-sicom-green/30 bg-success-50/50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-600">Nuevo préstamo</span>
                <span className="font-semibold text-ink-800">{formatoMoneda(montoEfectivo)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-ink-600">Menos saldo pendiente</span>
                <span className="font-semibold text-ink-800">- {formatoMoneda(info.saldoPendienteTotal)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-success-200 pt-2 text-sm font-semibold">
                <span className="flex items-center gap-1 text-ink-800">
                  <ArrowRight size={14} />
                  {dineroEntregadoPreview >= 0 ? 'Dinero entregado al cliente' : 'Falta cubrir'}
                </span>
                <span className={dineroEntregadoPreview >= 0 ? 'text-success-600' : 'text-danger-500'}>
                  {formatoMoneda(Math.abs(dineroEntregadoPreview))}
                </span>
              </div>
            </div>
          )}

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-600">Notas (opcional)</span>
            <input className="input" value={notas} onChange={(e) => setNotas(e.target.value)} />
          </label>

          {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50">
              Cancelar
            </button>
            <button
              onClick={handleConfirmar}
              disabled={renovar.isPending}
              className="flex items-center gap-2 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
            >
              {renovar.isPending && <Loader2 size={16} className="animate-spin" />}
              Confirmar renovación
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
