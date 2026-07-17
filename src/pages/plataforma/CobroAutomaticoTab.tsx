import { useEffect, useState, type ChangeEvent } from 'react';
import { ExternalLink, Loader2, CreditCard, History, Camera } from 'lucide-react';
import {
  useSuscripciones, useActivarSuscripcion, useCancelarSuscripcion, useMarcarPagoManual, useHistorialSuscripcion,
  useConfiguracionPagoRecurrente, useActualizarConfiguracionPago,
} from '@/hooks/useSuscripcion';
import { Modal } from '@/components/ui/Modal';
import { comprimirImagen } from '@/api/imagen';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { getApiErrorMessage } from '@/api/errors';
import type { SuscripcionEmpresa } from '@/types/suscripcion';

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

  const [activo, setActivo] = useState(false);
  const [ambiente, setAmbiente] = useState('PRUEBAS');
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  const [valoresMensuales, setValoresMensuales] = useState<Record<number, string>>({});
  const [frecuencias, setFrecuencias] = useState<Record<number, 'MENSUAL' | 'ANUAL'>>({});
  const [pagoManualPara, setPagoManualPara] = useState<SuscripcionEmpresa | null>(null);
  const [historialPara, setHistorialPara] = useState<SuscripcionEmpresa | null>(null);

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
      const resultado = await activar.mutateAsync({ empresaId, valorMensual: valor, frecuencia: frecuencias[empresaId] ?? 'MENSUAL' });
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
                  <th className="px-4 py-3 text-right font-medium">Valor</th>
                  <th className="px-4 py-3 text-left font-medium">Frecuencia</th>
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
                    <td className="px-4 py-3 text-ink-500">
                      {s.estado === 'SIN_CONFIGURAR' || s.estado === 'CANCELADA' ? (
                        <select
                          className="rounded-lg border border-ink-200 px-2 py-1 text-xs"
                          value={frecuencias[s.empresaId] ?? 'MENSUAL'}
                          onChange={(e) => setFrecuencias((prev) => ({ ...prev, [s.empresaId]: e.target.value as 'MENSUAL' | 'ANUAL' }))}
                        >
                          <option value="MENSUAL">Mensual</option>
                          <option value="ANUAL">Anual</option>
                        </select>
                      ) : s.frecuencia === 'ANUAL' ? 'Anual' : 'Mensual'}
                    </td>
                    <td className="px-4 py-3 text-ink-500">{s.proximoCobro ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {(s.estado === 'SIN_CONFIGURAR' || s.estado === 'CANCELADA') && (
                          <>
                            <input
                              type="number"
                              placeholder="Valor"
                              className="w-24 rounded-lg border border-ink-200 px-2 py-1 text-xs"
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
                        {s.estado !== 'SIN_CONFIGURAR' && (
                          <button
                            onClick={() => setHistorialPara(s)}
                            title="Historial de pagos de esta empresa"
                            className="flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-800"
                          >
                            <History size={13} />
                            Historial
                          </button>
                        )}
                        {(s.estado === 'PENDIENTE' || s.estado === 'VENCIDA' || s.estado === 'ACTIVA') && (
                          <button
                            onClick={() => setPagoManualPara(s)}
                            title="Registrar un pago (reactiva la empresa de inmediato)"
                            className="text-xs font-medium text-ink-500 hover:text-ink-800"
                          >
                            Registrar pago
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

      <PagoManualModal suscripcion={pagoManualPara} onClose={() => setPagoManualPara(null)} />
      <HistorialModal suscripcion={historialPara} onClose={() => setHistorialPara(null)} />
    </div>
  );
}

function PagoManualModal({ suscripcion, onClose }: { suscripcion: SuscripcionEmpresa | null; onClose: () => void }) {
  const marcarManual = useMarcarPagoManual();
  const [monto, setMonto] = useState('');
  const [comprobante, setComprobante] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (suscripcion) {
      setMonto(String(suscripcion.valorMensual));
      setComprobante(null);
      setError(null);
    }
  }, [suscripcion]);

  if (!suscripcion) return null;

  async function handleFoto(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    try {
      setComprobante(await comprimirImagen(archivo, 640, 0.8));
    } catch {
      setError('No se pudo procesar la foto del comprobante');
    }
  }

  async function handleConfirmar() {
    setError(null);
    try {
      await marcarManual.mutateAsync({
        empresaId: suscripcion!.empresaId,
        data: { monto: monto ? Number(monto) : undefined, comprobante: comprobante ?? undefined },
      });
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo registrar el pago'));
    }
  }

  return (
    <Modal isOpen={suscripcion !== null} onClose={onClose} title={`Registrar pago — ${suscripcion.empresaNombre}`} size="sm">
      <div className="space-y-4">
        <p className="text-xs text-ink-400">
          Esto reactiva la empresa de inmediato y extiende el próximo cobro {suscripcion.frecuencia === 'ANUAL' ? '12 meses' : '1 mes'}.
        </p>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-600">Monto pagado</span>
          <input type="number" className="input" value={monto} onChange={(e) => setMonto(e.target.value)} />
        </label>
        <div>
          <span className="mb-1 block text-xs font-medium text-ink-600">Comprobante (opcional, foto desde el celular)</span>
          <div className="flex items-center gap-3">
            {comprobante ? (
              <img src={comprobante} alt="Comprobante" className="h-16 w-16 rounded-lg border border-ink-200 object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-ink-200 text-ink-300">
                <Camera size={20} />
              </div>
            )}
            <label className="cursor-pointer rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-50">
              {comprobante ? 'Cambiar foto' : 'Tomar/subir foto'}
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFoto} />
            </label>
          </div>
        </div>
        {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50">
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={marcarManual.isPending}
            className="flex items-center gap-2 rounded-lg bg-success-600 px-4 py-2 text-sm font-semibold text-white hover:bg-success-700 disabled:opacity-60"
          >
            {marcarManual.isPending && <Loader2 size={16} className="animate-spin" />}
            Confirmar pago
          </button>
        </div>
      </div>
    </Modal>
  );
}

function HistorialModal({ suscripcion, onClose }: { suscripcion: SuscripcionEmpresa | null; onClose: () => void }) {
  const { data: pagos, isLoading } = useHistorialSuscripcion(suscripcion?.empresaId ?? null);

  return (
    <Modal isOpen={suscripcion !== null} onClose={onClose} title={suscripcion ? `Historial de pagos — ${suscripcion.empresaNombre}` : 'Historial'} size="md">
      {isLoading ? (
        <LoadingState />
      ) : pagos && pagos.length > 0 ? (
        <div className="space-y-2">
          {pagos.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-ink-100 px-3 py-2.5">
              <div className="flex items-center gap-3">
                {p.comprobante && <img src={p.comprobante} alt="Comprobante" className="h-10 w-10 rounded object-cover" />}
                <div>
                  <p className="text-sm font-medium text-ink-800">${p.monto.toLocaleString('es-CO')}</p>
                  <p className="text-xs text-ink-400">
                    {new Date(p.fecha).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}
                    {p.mensaje ? ` · ${p.mensaje}` : ''}
                  </p>
                </div>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  p.estado === 'EXITOSO' ? 'bg-success-50 text-success-600' : 'bg-danger-50 text-danger-500'
                }`}
              >
                {p.estado}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="Sin pagos registrados todavía" />
      )}
    </Modal>
  );
}
