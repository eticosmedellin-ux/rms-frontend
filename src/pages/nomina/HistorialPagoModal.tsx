import { useState, type ChangeEvent } from 'react';
import { Loader2, Camera, FileCheck } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { usePagosTrabajador, useConfirmarPagoNomina } from '@/hooks/useNomina';
import { comprimirImagen } from '@/api/imagen';
import { getApiErrorMessage } from '@/api/errors';
import { LoadingState, EmptyState } from '@/components/ui/States';
import type { Trabajador } from '@/api/nomina';

function formatoMoneda(valor: number) {
  return valor.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

export function HistorialPagoModal({
  isOpen,
  onClose,
  trabajador,
}: {
  isOpen: boolean;
  onClose: () => void;
  trabajador: Trabajador | null;
}) {
  const { data: pagos, isLoading } = usePagosTrabajador(trabajador?.id ?? null);
  const confirmar = useConfirmarPagoNomina();

  const [mostrarForm, setMostrarForm] = useState(false);
  const [fechaPeriodo, setFechaPeriodo] = useState('');
  const [monto, setMonto] = useState('');
  const [comprobante, setComprobante] = useState<string | null>(null);
  const [observaciones, setObservaciones] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!trabajador) return null;

  async function handleFoto(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    try {
      setComprobante(await comprimirImagen(archivo, 640, 0.8));
    } catch {
      setError('No se pudo procesar la imagen del comprobante');
    }
  }

  async function handleConfirmar() {
    setError(null);
    if (!fechaPeriodo || !monto) {
      setError('Fecha del período y monto son obligatorios');
      return;
    }
    try {
      await confirmar.mutateAsync({
        trabajadorId: trabajador!.id,
        data: { fechaPeriodo, monto: Number(monto), comprobante: comprobante ?? undefined, observaciones: observaciones || undefined },
      });
      setMostrarForm(false);
      setFechaPeriodo('');
      setMonto('');
      setComprobante(null);
      setObservaciones('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo confirmar el pago'));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Pagos de ${trabajador.nombre} ${trabajador.apellido ?? ''}`} size="md">
      <div className="space-y-4 px-6 py-5">
        {!mostrarForm ? (
          <button
            onClick={() => {
              setMostrarForm(true);
              setFechaPeriodo(trabajador.proximaFechaPago ?? '');
              setMonto(trabajador.salario?.toString() ?? '');
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink-800 py-2.5 text-sm font-semibold text-white hover:bg-ink-700"
          >
            <FileCheck size={16} />
            Confirmar nuevo pago
          </button>
        ) : (
          <div className="rounded-lg border border-ink-100 bg-ink-50 p-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-600">Fecha del período</span>
                <input type="date" className="input" value={fechaPeriodo} onChange={(e) => setFechaPeriodo(e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-600">Monto pagado</span>
                <input type="number" className="input" value={monto} onChange={(e) => setMonto(e.target.value)} />
              </label>
            </div>

            <label className="mt-3 block">
              <span className="mb-1 block text-xs font-medium text-ink-600">Observaciones (opcional)</span>
              <input className="input" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
            </label>

            <div className="mt-3 flex items-center gap-3">
              {comprobante ? (
                <img src={comprobante} alt="Comprobante" className="h-16 w-16 rounded-lg border border-ink-200 object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-ink-200 text-ink-300">
                  <Camera size={20} />
                </div>
              )}
              <label className="cursor-pointer rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-white">
                {comprobante ? 'Cambiar foto' : 'Adjuntar comprobante'}
                <input type="file" accept="image/*" className="hidden" onChange={handleFoto} />
              </label>
            </div>

            {error && <p className="mt-2 text-xs text-danger-500">{error}</p>}

            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => {
                  setMostrarForm(false);
                  setError(null);
                }}
                className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmar}
                disabled={confirmar.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
              >
                {confirmar.isPending && <Loader2 size={13} className="animate-spin" />}
                Confirmar pago
              </button>
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 text-sm font-semibold text-ink-700">Historial</p>
          {isLoading ? (
            <LoadingState />
          ) : pagos && pagos.length > 0 ? (
            <div className="space-y-2">
              {pagos.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-ink-100 px-3 py-2">
                  <div className="flex items-center gap-3">
                    {p.comprobante && (
                      <img src={p.comprobante} alt="Comprobante" className="h-10 w-10 rounded object-cover" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-ink-800">{formatoMoneda(p.monto)}</p>
                      <p className="text-xs text-ink-400">
                        Período: {p.fechaPeriodo} · Confirmado {new Date(p.fechaConfirmacion).toLocaleDateString('es-CO')}
                        {p.confirmadoPorNombre ? ` por ${p.confirmadoPorNombre}` : ''}
                      </p>
                      {p.observaciones && <p className="text-xs text-ink-400">{p.observaciones}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Sin pagos registrados todavía" />
          )}
        </div>
      </div>
    </Modal>
  );
}
