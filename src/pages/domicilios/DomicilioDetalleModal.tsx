import { useEffect, useState } from 'react';
import { Loader2, Ban, Truck } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useDomicilio, useCambiarEstadoDomicilio, useConfirmarEntregaDomicilio, useCancelarDomicilio } from '@/hooks/useDomicilios';
import { useUsuarios } from '@/hooks/useNucleo';
import { useCajaAbierta } from '@/hooks/usePos';
import { getApiErrorMessage } from '@/api/errors';
import { LoadingState } from '@/components/ui/States';
import type { EstadoDomicilio } from '@/api/domicilios';
import type { MetodoPagoVenta } from '@/types/pos';

const METODOS_PAGO: { valor: MetodoPagoVenta; etiqueta: string }[] = [
  { valor: 'EFECTIVO', etiqueta: 'Efectivo' },
  { valor: 'TARJETA', etiqueta: 'Tarjeta' },
  { valor: 'TRANSFERENCIA', etiqueta: 'Transferencia' },
  { valor: 'CREDITO', etiqueta: 'Crédito' },
];

const SIGUIENTE: Partial<Record<EstadoDomicilio, EstadoDomicilio>> = {
  RECIBIDO: 'EN_PREPARACION',
  EN_PREPARACION: 'EN_CAMINO',
};

const ESTADO_LABELS: Record<EstadoDomicilio, string> = {
  RECIBIDO: 'Recibido',
  EN_PREPARACION: 'En preparación',
  EN_CAMINO: 'En camino',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

function formatoMoneda(v: number) {
  return v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

export function DomicilioDetalleModal({
  isOpen,
  onClose,
  domicilioId,
}: {
  isOpen: boolean;
  onClose: () => void;
  domicilioId: number | null;
}) {
  const { data: domicilio, isLoading } = useDomicilio(domicilioId);
  const { data: usuarios } = useUsuarios();
  const { data: cajaAbierta } = useCajaAbierta(domicilio?.sucursalId ?? null);
  const cambiarEstado = useCambiarEstadoDomicilio();
  const confirmarEntrega = useConfirmarEntregaDomicilio();
  const cancelar = useCancelarDomicilio();

  const [mostrarEntrega, setMostrarEntrega] = useState(false);
  const [metodoPago, setMetodoPago] = useState<MetodoPagoVenta>('EFECTIVO');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMostrarEntrega(false);
      setError(null);
      setMetodoPago('EFECTIVO');
    }
  }, [isOpen, domicilioId]);

  if (!isOpen) return null;

  async function handleConfirmarEntrega() {
    setError(null);
    if (!domicilio) return;
    if (!cajaAbierta) {
      setError('No hay una caja abierta en esta sucursal — ábrela primero desde el POS');
      return;
    }
    try {
      await confirmarEntrega.mutateAsync({
        id: domicilio.id,
        data: { cajaSesionId: cajaAbierta.id, pagos: [{ metodoPago, monto: domicilio.total }] },
      });
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo confirmar la entrega'));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={domicilio ? `Pedido — ${domicilio.clienteNombre ?? 'sin registrar'}` : 'Pedido'} size="md">
      {isLoading || !domicilio ? (
        <LoadingState />
      ) : mostrarEntrega ? (
        <div className="space-y-4">
          <p className="text-sm text-ink-600">
            Total a cobrar: <span className="font-semibold text-ink-800">{formatoMoneda(domicilio.total)}</span>
          </p>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-600">Método de pago</span>
            <select className="input" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value as MetodoPagoVenta)}>
              {METODOS_PAGO.map((m) => (
                <option key={m.valor} value={m.valor}>
                  {m.etiqueta}
                </option>
              ))}
            </select>
          </label>
          {!cajaAbierta && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              No hay una caja abierta en esta sucursal. Ábrela desde el POS antes de confirmar la entrega.
            </p>
          )}
          {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}
          <div className="flex justify-end gap-3">
            <button onClick={() => setMostrarEntrega(false)} className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50">
              Volver
            </button>
            <button
              onClick={handleConfirmarEntrega}
              disabled={confirmarEntrega.isPending}
              className="flex items-center gap-2 rounded-lg bg-success-600 px-4 py-2 text-sm font-semibold text-white hover:bg-success-700 disabled:opacity-60"
            >
              {confirmarEntrega.isPending && <Loader2 size={16} className="animate-spin" />}
              Confirmar entrega y facturar
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg bg-ink-50 p-3 text-sm">
            <p className="text-ink-700">{domicilio.direccionEntrega}</p>
            {domicilio.telefonoContacto && <p className="text-xs text-ink-400">{domicilio.telefonoContacto}</p>}
          </div>

          <div className="space-y-1.5">
            {domicilio.items.map((i) => (
              <div key={i.id} className="flex items-center justify-between text-sm">
                <span className="text-ink-700">
                  {i.cantidad}× {i.productoNombre}
                </span>
                <span className="text-ink-500">{formatoMoneda(i.precioUnitario * i.cantidad)}</span>
              </div>
            ))}
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-600">Repartidor</span>
            <select
              className="input"
              value={domicilio.repartidorId ?? ''}
              onChange={(e) =>
                cambiarEstado.mutate({
                  id: domicilio.id,
                  estado: domicilio.estado,
                  repartidorUsuarioId: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            >
              <option value="">Sin asignar</option>
              {usuarios?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre} {u.apellido ?? ''}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-center justify-between border-t border-ink-100 pt-3">
            <p className="text-sm font-semibold text-ink-700">Total: {formatoMoneda(domicilio.total)}</p>
            <div className="flex gap-2">
              <button
                onClick={() => cancelar.mutate(domicilio.id)}
                disabled={cancelar.isPending}
                className="flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-2 text-xs font-medium text-ink-500 hover:bg-ink-50"
              >
                <Ban size={14} />
                Cancelar
              </button>
              {SIGUIENTE[domicilio.estado] && (
                <button
                  onClick={() => cambiarEstado.mutate({ id: domicilio.id, estado: SIGUIENTE[domicilio.estado]! })}
                  className="rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700"
                >
                  Marcar {ESTADO_LABELS[SIGUIENTE[domicilio.estado]!]}
                </button>
              )}
              {domicilio.estado === 'EN_CAMINO' && (
                <button
                  onClick={() => setMostrarEntrega(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-success-600 px-4 py-2 text-sm font-semibold text-white hover:bg-success-700"
                >
                  <Truck size={15} />
                  Confirmar entrega
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
