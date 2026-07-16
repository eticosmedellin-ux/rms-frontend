import { useState, type ChangeEvent } from 'react';
import { Loader2, Camera, CheckCircle2, Pencil, AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { usePrestamo, usePagarCuota, useActualizarPagoCuota } from '@/hooks/usePrestamos';
import { comprimirImagen } from '@/api/imagen';
import { getApiErrorMessage } from '@/api/errors';
import { LoadingState } from '@/components/ui/States';
import type { CuotaPrestamo, MetodoPagoCuota } from '@/api/prestamos';

function formatoMoneda(v: number) {
  return v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

function formatoFecha(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function PrestamoDetalleModal({
  isOpen,
  onClose,
  prestamoId,
}: {
  isOpen: boolean;
  onClose: () => void;
  prestamoId: number | null;
}) {
  const { data: prestamo, isLoading } = usePrestamo(prestamoId);
  const [cuotaEnEdicion, setCuotaEnEdicion] = useState<CuotaPrestamo | null>(null);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={prestamo ? `Préstamo — ${prestamo.clienteNombre}` : 'Préstamo'} size="lg">
      {isLoading || !prestamo ? (
        <LoadingState />
      ) : cuotaEnEdicion ? (
        <FormularioPago
          prestamoId={prestamo.id}
          cuota={cuotaEnEdicion}
          onCancelar={() => setCuotaEnEdicion(null)}
          onListo={() => setCuotaEnEdicion(null)}
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 rounded-lg bg-ink-50 p-3 text-sm">
            <div>
              <p className="text-xs text-ink-400">Monto</p>
              <p className="font-medium text-ink-800">{formatoMoneda(prestamo.montoPrincipal)}</p>
            </div>
            <div>
              <p className="text-xs text-ink-400">Pendiente</p>
              <p className="font-medium text-ink-800">{formatoMoneda(prestamo.saldoPendiente)}</p>
            </div>
            <div>
              <p className="text-xs text-ink-400">Frecuencia</p>
              <p className="font-medium text-ink-800">{prestamo.frecuenciaPago}</p>
            </div>
          </div>

          <div className="space-y-2">
            {prestamo.cuotas.map((c) => (
              <div
                key={c.id}
                className={`flex items-center justify-between rounded-lg border px-3 py-2.5 ${
                  c.vencida ? 'border-danger-200 bg-danger-50/40' : 'border-ink-100 bg-white'
                }`}
              >
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-medium text-ink-800">
                    Cuota {c.numeroCuota} — {formatoMoneda(c.montoCuota)}
                    {c.vencida && <AlertTriangle size={13} className="text-danger-500" />}
                  </p>
                  <p className="text-xs text-ink-400">
                    Vence {formatoFecha(c.fechaVencimiento)}
                    {c.estado === 'PAGADA' && c.fechaPago
                      ? ` · Pagada el ${new Date(c.fechaPago).toLocaleDateString('es-CO')} (${c.metodoPago === 'TRANSFERENCIA' ? 'Transferencia' : 'Efectivo'})`
                      : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {c.comprobante && (
                    <img src={c.comprobante} alt="Comprobante" className="h-9 w-9 rounded object-cover" />
                  )}
                  {c.estado === 'PENDIENTE' ? (
                    <button
                      onClick={() => setCuotaEnEdicion(c)}
                      className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink-700"
                    >
                      <CheckCircle2 size={14} />
                      Registrar pago
                    </button>
                  ) : (
                    <button
                      onClick={() => setCuotaEnEdicion(c)}
                      className="flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-50"
                    >
                      <Pencil size={13} />
                      Corregir pago
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

function FormularioPago({
  prestamoId,
  cuota,
  onCancelar,
  onListo,
}: {
  prestamoId: number;
  cuota: CuotaPrestamo;
  onCancelar: () => void;
  onListo: () => void;
}) {
  const pagar = usePagarCuota();
  const actualizar = useActualizarPagoCuota();
  const esCorreccion = cuota.estado === 'PAGADA';

  const [montoPagado, setMontoPagado] = useState(String(cuota.montoPagado ?? cuota.montoCuota));
  const [metodoPago, setMetodoPago] = useState<MetodoPagoCuota>(cuota.metodoPago ?? 'EFECTIVO');
  const [comprobante, setComprobante] = useState<string | null>(cuota.comprobante ?? null);
  const [observaciones, setObservaciones] = useState(cuota.observaciones ?? '');
  const [error, setError] = useState<string | null>(null);

  async function handleFoto(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    try {
      setComprobante(await comprimirImagen(archivo, 640, 0.8));
    } catch {
      setError('No se pudo procesar la foto del comprobante');
    }
  }

  async function handleGuardar() {
    setError(null);
    if (!montoPagado) {
      setError('El monto pagado es obligatorio');
      return;
    }
    if (metodoPago === 'TRANSFERENCIA' && !comprobante) {
      setError('El pago por transferencia requiere una foto del comprobante');
      return;
    }
    const data = {
      montoPagado: Number(montoPagado),
      metodoPago,
      comprobante: metodoPago === 'TRANSFERENCIA' ? comprobante ?? undefined : undefined,
      observaciones: observaciones || undefined,
    };
    try {
      if (esCorreccion) {
        await actualizar.mutateAsync({ prestamoId, cuotaId: cuota.id, data });
      } else {
        await pagar.mutateAsync({ prestamoId, cuotaId: cuota.id, data });
      }
      onListo();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo guardar el pago'));
    }
  }

  const guardando = pagar.isPending || actualizar.isPending;

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-600">
        {esCorreccion ? 'Corrigiendo' : 'Registrando'} el pago de la <span className="font-semibold">cuota {cuota.numeroCuota}</span> —
        vence {formatoFecha(cuota.fechaVencimiento)}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-600">Monto pagado</span>
          <input type="number" className="input" value={montoPagado} onChange={(e) => setMontoPagado(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-600">Método de pago</span>
          <select
            className="input"
            value={metodoPago}
            onChange={(e) => {
              setMetodoPago(e.target.value as MetodoPagoCuota);
              if (e.target.value === 'EFECTIVO') setComprobante(null);
            }}
          >
            <option value="EFECTIVO">Efectivo</option>
            <option value="TRANSFERENCIA">Transferencia</option>
          </select>
        </label>
      </div>

      {metodoPago === 'TRANSFERENCIA' && (
        <div>
          <span className="mb-1 block text-xs font-medium text-ink-600">Comprobante (foto desde el celular)</span>
          <div className="flex items-center gap-3">
            {comprobante ? (
              <img src={comprobante} alt="Comprobante" className="h-20 w-20 rounded-lg border border-ink-200 object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-ink-200 text-ink-300">
                <Camera size={22} />
              </div>
            )}
            <label className="cursor-pointer rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-50">
              {comprobante ? 'Cambiar foto' : 'Tomar/subir foto'}
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFoto} />
            </label>
          </div>
        </div>
      )}

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink-600">Observaciones (opcional)</span>
        <input className="input" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
      </label>

      {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}

      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onCancelar} className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50">
          Cancelar
        </button>
        <button
          onClick={handleGuardar}
          disabled={guardando}
          className="flex items-center gap-2 rounded-lg bg-success-600 px-4 py-2 text-sm font-semibold text-white hover:bg-success-700 disabled:opacity-60"
        >
          {guardando && <Loader2 size={16} className="animate-spin" />}
          {esCorreccion ? 'Guardar corrección' : 'Confirmar pago'}
        </button>
      </div>
    </div>
  );
}
