import { useEffect, useState } from 'react';
import { Download, Loader2, ShieldAlert, Trash2 } from 'lucide-react';
import {
  useBackups, useCrearBackup, useEliminarBackup, useConfiguracionBackup, useActualizarConfiguracionBackup,
} from '@/hooks/useBackup';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { descargarArchivo } from '@/lib/descargarArchivo';
import { getApiErrorMessage } from '@/api/errors';
import type { FrecuenciaBackup } from '@/types/backup';

function formatearTamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function BackupsTab() {
  const { data: backups, isLoading } = useBackups();
  const crear = useCrearBackup();
  const eliminar = useEliminarBackup();
  const { data: config } = useConfiguracionBackup();
  const actualizarConfig = useActualizarConfiguracionBackup();

  const [frecuencia, setFrecuencia] = useState<FrecuenciaBackup>('MANUAL');
  const [horaEjecucion, setHoraEjecucion] = useState('3');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (config) {
      setFrecuencia(config.frecuencia);
      setHoraEjecucion(String(config.horaEjecucion));
    }
  }, [config]);

  const ultimoBackup = backups?.[0];
  const diasDesdeUltimo = ultimoBackup
    ? Math.floor((Date.now() - new Date(ultimoBackup.fechaCreacion).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  async function handleCrear() {
    setError(null);
    try {
      await crear.mutateAsync();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo generar la copia de seguridad'));
    }
  }

  async function handleGuardarConfig() {
    setError(null);
    try {
      await actualizarConfig.mutateAsync({ frecuencia, horaEjecucion: Number(horaEjecucion) });
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo guardar la configuración'));
    }
  }

  return (
    <div className="space-y-6">
      {diasDesdeUltimo !== null && diasDesdeUltimo >= 7 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <ShieldAlert size={18} className="shrink-0" />
          Hace {diasDesdeUltimo} días que no se genera una copia de seguridad. Considera hacer una ahora.
        </div>
      )}

      <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-card">
        <h3 className="font-display text-base font-semibold text-ink-800">Copias automáticas</h3>
        <p className="mt-1 text-sm text-ink-400">
          Respalda TODA la base de datos (todas las empresas) — así funciona un respaldo real: protege el motor
          completo, no una empresa a la vez.
        </p>

        <div className="mt-4 flex items-end gap-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-ink-600">Frecuencia</span>
            <select className="input" value={frecuencia} onChange={(e) => setFrecuencia(e.target.value as FrecuenciaBackup)}>
              <option value="MANUAL">Solo manual</option>
              <option value="DIARIA">Diaria</option>
              <option value="SEMANAL">Semanal (lunes)</option>
              <option value="MENSUAL">Mensual (día 1)</option>
            </select>
          </label>
          {frecuencia !== 'MANUAL' && (
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-ink-600">Hora (0-23)</span>
              <input
                type="number"
                min={0}
                max={23}
                className="input w-24"
                value={horaEjecucion}
                onChange={(e) => setHoraEjecucion(e.target.value)}
              />
            </label>
          )}
          <button
            onClick={handleGuardarConfig}
            disabled={actualizarConfig.isPending}
            className="rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
          >
            Guardar
          </button>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-base font-semibold text-ink-800">Historial</h3>
          <button
            onClick={handleCrear}
            disabled={crear.isPending}
            className="flex items-center gap-2 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
          >
            {crear.isPending && <Loader2 size={16} className="animate-spin" />}
            Crear copia ahora
          </button>
        </div>

        {error && <div className="mb-3 rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}

        {isLoading ? (
          <LoadingState />
        ) : backups && backups.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white shadow-card">
            <table className="w-full text-sm">
              <thead className="border-b border-ink-100 bg-ink-50 text-xs text-ink-500">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Archivo</th>
                  <th className="px-4 py-3 text-left font-medium">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Tamaño</th>
                  <th className="px-4 py-3 text-left font-medium">Fecha</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {backups.map((b) => (
                  <tr key={b.id} className="hover:bg-ink-50/60">
                    <td className="px-4 py-3 font-mono text-xs text-ink-600">{b.nombreArchivo}</td>
                    <td className="px-4 py-3 text-ink-500">{b.tipo === 'MANUAL' ? 'Manual' : 'Automático'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          b.estado === 'COMPLETADO' ? 'bg-success-50 text-success-600' : 'bg-danger-50 text-danger-600'
                        }`}
                      >
                        {b.estado === 'COMPLETADO' ? 'Completado' : 'Error'}
                      </span>
                      {b.mensaje && <span className="ml-2 text-xs text-ink-400">{b.mensaje}</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-ink-700">{formatearTamano(b.tamanoBytes)}</td>
                    <td className="px-4 py-3 text-ink-500">{new Date(b.fechaCreacion).toLocaleString('es-CO')}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {b.estado === 'COMPLETADO' && (
                          <button
                            onClick={() => descargarArchivo(`/plataforma/backups/${b.id}/descargar`, b.nombreArchivo)}
                            title="Descargar"
                            className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                          >
                            <Download size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => eliminar.mutate(b.id)}
                          title="Eliminar del historial"
                          className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-danger-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="Sin copias de seguridad todavía" description="Crea la primera con el botón de arriba." />
        )}
      </div>
    </div>
  );
}
