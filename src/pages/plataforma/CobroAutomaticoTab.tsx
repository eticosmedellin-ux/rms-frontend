import { useEffect, useState } from 'react';
import { ExternalLink, Loader2, CreditCard } from 'lucide-react';
import {
  useSuscripciones, useActivarSuscripcion, useCancelarSuscripcion, useMarcarPagoManual,
  useConfiguracionPagoRecurrente, useActualizarConfiguracionPago,
} from '@/hooks/useSuscripcion';
import { LoadingState } from '@/components/ui/States';
import { getApiErrorMessage } from '@/api/errors';

const ESTADO_TONO: Record<string, string> = {
  SIN_CONFIGURAR: 'bg-ink-100 text-ink-400',
  PENDIENTE: 'bg-amber-50 text-amber-700',
  ACTIVA: 'bg-success-50 text-success-600',
  VENCIDA: 'bg-danger-50 text-danger-600',
  CANCELADA: 'bg-ink-100 text-ink-500',
};

const ESTADO_LABEL: Record<string, string> = {
  SIN_CONFIGURAR: 'Sin configurar',
  PENDIENTE: 'Pendiente de activar',
  ACTIVA: 'Activa',
  VENCIDA: 'Vencida',
  CANCELADA: 'Cancelada',
};

export function CobroAutomaticoTab() {
  const { data: config, isLoading: cargandoConfig } = useConfiguracionPagoRecurrente();
  const actualizarConfig = useActualizarConfiguracionPago();
  const { data: suscripciones, isLoading } = useSuscripciones();
  const activar = useActivarSuscripcion();
  const cancelar = useCancelarSuscripcion();
  const marcarManual = useMarcarPagoManual();

  const [activo, setActivo] = useState(false);
  const [ambiente, setAmbiente] = useState('PRUEBAS');
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  const [valoresMensuales, setValoresMensuales] = useState<Record<number, string>>({});

  useEffect(() => {
    if (config) {
      setActivo(config.activo);
      setAmbiente(config.ambiente);
      setPublicKey(config.publicKey ?? '');
    }
  }, [config]);

  async function handleGuardarConfig() {
    setError(null);
    setGuardado(false);
    try {
      await actualizarConfig.mutateAsync({
        proveedor: 'EPAYCO',
        activo,
        ambiente,
        publicKey: publicKey || undefined,
        privateKey: privateKey || undefined,
      });
      setPrivateKey('');
      setGuardado(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo guardar la configuración'));
    }
  }

  async function handleActivar(empresaId: number) {
    setError(null);
    const valor = Number(valoresMensuales[empresaId]);
    if (!valor || valor <= 0) {
      setError('Indica un valor mensual mayor a cero para esta empresa');
      return;
    }
    try {
      const resultado = await activar.mutateAsync({ empresaId, valorMensual: valor });
      if (resultado.urlPago) {
        window.open(resultado.urlPago, '_blank');
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo activar la suscripción'));
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-card">
        <div className="flex items-center gap-2">
          <CreditCard size={18} className="text-ink-400" />
          <h3 className="font-display text-base font-semibold text-ink-800">Configuración de ePayco</h3>
        </div>
        <p className="mt-1 text-sm text-ink-400">
          Estas son TUS llaves de ePayco (las que usas para cobrarle a tus clientes que arriendan el sistema) — no
          confundir con la facturación electrónica de cada empresa, que es un tema aparte.
        </p>

        {cargandoConfig ? (
          <LoadingState />
        ) : (
          <>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink-700">Public key</span>
                <input className="input" value={publicKey} onChange={(e) => setPublicKey(e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink-700">
                  Private key {config?.privateKeyConfigurada && <span className="text-xs text-success-600">(ya configurada)</span>}
                </span>
                <input
                  type="password"
                  className="input"
                  placeholder={config?.privateKeyConfigurada ? '•••••••• (déjalo vacío para no cambiarla)' : ''}
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink-700">Ambiente</span>
                <select className="input" value={ambiente} onChange={(e) => setAmbiente(e.target.value)}>
                  <option value="PRUEBAS">Pruebas</option>
                  <option value="PRODUCCION">Producción</option>
                </select>
              </label>
            </div>

            <label className="mt-4 flex items-center gap-2">
              <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="h-4 w-4" />
              <span className="text-sm text-ink-700">Activar el cobro automático</span>
            </label>

            <div className="mt-3 rounded-lg bg-sky-50 px-3 py-2.5 text-xs text-sky-800">
              Registra esta URL en tu panel de ePayco como "URL de confirmación" (webhook):{' '}
              <code className="font-mono">https://tu-backend/api/webhooks/pago-recurrente</code>
            </div>

            {error && <div className="mt-3 rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}
            {guardado && !error && (
              <div className="mt-3 rounded-lg bg-success-50 px-3 py-2.5 text-sm text-success-600">Guardado correctamente.</div>
            )}

            <button
              onClick={handleGuardarConfig}
              disabled={actualizarConfig.isPending}
              className="mt-4 flex items-center gap-2 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
            >
              {actualizarConfig.isPending && <Loader2 size={16} className="animate-spin" />}
              Guardar configuración
            </button>
          </>
        )}
      </div>

      <div>
        <h3 className="mb-3 font-display text-base font-semibold text-ink-800">Suscripción por empresa</h3>
        {isLoading ? (
          <LoadingState />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white shadow-card">
            <table className="w-full text-sm">
              <thead className="border-b border-ink-100 bg-ink-50 text-xs text-ink-500">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Empresa</th>
                  <th className="px-4 py-3 text-left font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Valor mensual</th>
                  <th className="px-4 py-3 text-left font-medium">Próximo cobro</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {suscripciones?.map((s) => (
                  <tr key={s.empresaId} className="hover:bg-ink-50/60">
                    <td className="px-4 py-3 font-medium text-ink-800">{s.empresaNombre}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_TONO[s.estado]}`}>
                        {ESTADO_LABEL[s.estado]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-ink-700">
                      {s.valorMensual > 0 ? `$${s.valorMensual.toLocaleString('es-CO')}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-ink-500">{s.proximoCobro ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {(s.estado === 'SIN_CONFIGURAR' || s.estado === 'CANCELADA') && (
                          <>
                            <input
                              type="number"
                              placeholder="Valor mensual"
                              className="w-28 rounded-lg border border-ink-200 px-2 py-1 text-xs"
                              value={valoresMensuales[s.empresaId] ?? ''}
                              onChange={(e) =>
                                setValoresMensuales((prev) => ({ ...prev, [s.empresaId]: e.target.value }))
                              }
                            />
                            <button
                              onClick={() => handleActivar(s.empresaId)}
                              disabled={activar.isPending}
                              className="rounded-lg bg-ink-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink-700"
                            >
                              Activar
                            </button>
                          </>
                        )}
                        {s.urlPago && (
                          <a
                            href={s.urlPago}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-xs text-ink-500 hover:text-ink-800"
                          >
                            <ExternalLink size={12} />
                            Enlace de pago
                          </a>
                        )}
                        {(s.estado === 'PENDIENTE' || s.estado === 'VENCIDA') && (
                          <button
                            onClick={() => marcarManual.mutate(s.empresaId)}
                            title="Marcar como pagado manualmente (mientras se confirma la integración automática)"
                            className="text-xs font-medium text-ink-500 hover:text-ink-800"
                          >
                            Marcar pago manual
                          </button>
                        )}
                        {(s.estado === 'ACTIVA' || s.estado === 'PENDIENTE' || s.estado === 'VENCIDA') && (
                          <button
                            onClick={() => cancelar.mutate(s.empresaId)}
                            className="text-xs font-medium text-ink-400 hover:text-danger-500"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
