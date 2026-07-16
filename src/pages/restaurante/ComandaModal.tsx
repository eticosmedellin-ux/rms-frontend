import { useEffect, useState } from 'react';
import { Loader2, Plus, X, Receipt, Ban } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import {
  useAbrirComanda,
  useComanda,
  useAgregarItemComanda,
  useCambiarEstadoItem,
  useCerrarComanda,
  useCancelarComanda,
} from '@/hooks/useRestaurante';
import { useProductos } from '@/hooks/useInventario';
import { useCajaAbierta } from '@/hooks/usePos';
import { getApiErrorMessage } from '@/api/errors';
import { LoadingState } from '@/components/ui/States';
import type { Mesa, EstadoItemComanda } from '@/api/restaurante';
import type { MetodoPagoVenta } from '@/types/pos';

const METODOS_PAGO: { valor: MetodoPagoVenta; etiqueta: string }[] = [
  { valor: 'EFECTIVO', etiqueta: 'Efectivo' },
  { valor: 'TARJETA', etiqueta: 'Tarjeta' },
  { valor: 'TRANSFERENCIA', etiqueta: 'Transferencia' },
  { valor: 'CREDITO', etiqueta: 'Crédito' },
];

const ESTADO_ITEM_LABELS: Record<EstadoItemComanda, string> = {
  PENDIENTE: 'Pendiente',
  PREPARANDO: 'Preparando',
  LISTO: 'Listo',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

const SIGUIENTE_ESTADO: Partial<Record<EstadoItemComanda, EstadoItemComanda>> = {
  PENDIENTE: 'PREPARANDO',
  PREPARANDO: 'LISTO',
  LISTO: 'ENTREGADO',
};

function formatoMoneda(v: number) {
  return v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

export function ComandaModal({ isOpen, onClose, mesa }: { isOpen: boolean; onClose: () => void; mesa: Mesa | null }) {
  const abrir = useAbrirComanda();
  const { data: comanda, isLoading } = useComanda(mesa?.comandaActivaId ?? null);
  const { data: productos } = useProductos();
  const { data: cajaAbierta } = useCajaAbierta(mesa?.sucursalId ?? null);
  const agregarItem = useAgregarItemComanda();
  const cambiarEstado = useCambiarEstadoItem();
  const cerrar = useCerrarComanda();
  const cancelar = useCancelarComanda();

  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [notasItem, setNotasItem] = useState('');
  const [mostrarCierre, setMostrarCierre] = useState(false);
  const [metodoPago, setMetodoPago] = useState<MetodoPagoVenta>('EFECTIVO');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMostrarCierre(false);
      setError(null);
      setMetodoPago('EFECTIVO');
    }
  }, [isOpen, mesa]);

  if (!mesa) return null;

  async function handleAbrir() {
    setError(null);
    try {
      await abrir.mutateAsync({ mesaId: mesa!.id, data: {} });
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo abrir la comanda'));
    }
  }

  async function handleAgregarItem() {
    setError(null);
    if (!comanda || !productoId) return;
    try {
      await agregarItem.mutateAsync({
        comandaId: comanda.id,
        data: { productoId: Number(productoId), cantidad: Number(cantidad) || 1, notas: notasItem || undefined },
      });
      setProductoId('');
      setCantidad('1');
      setNotasItem('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo agregar el producto'));
    }
  }

  async function handleCerrarCuenta() {
    setError(null);
    if (!comanda) return;
    if (!cajaAbierta) {
      setError('No hay una caja abierta en esta sucursal — ábrela primero desde el POS');
      return;
    }
    if (!metodoPago) {
      setError('Elige un método de pago');
      return;
    }
    try {
      await cerrar.mutateAsync({
        comandaId: comanda.id,
        data: {
          cajaSesionId: cajaAbierta.id,
          pagos: [{ metodoPago, monto: comanda.total }],
        },
      });
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo cerrar la cuenta'));
    }
  }

  async function handleCancelar() {
    if (!comanda) return;
    setError(null);
    try {
      await cancelar.mutateAsync(comanda.id);
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo cancelar la comanda'));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Mesa ${mesa.numero}`} size="lg">
      <div className="space-y-4">
        {mesa.estado === 'LIBRE' && !mesa.comandaActivaId ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <p className="text-sm text-ink-500">Esta mesa está libre.</p>
            <button
              onClick={handleAbrir}
              disabled={abrir.isPending}
              className="flex items-center gap-2 rounded-lg bg-ink-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
            >
              {abrir.isPending && <Loader2 size={16} className="animate-spin" />}
              Abrir comanda
            </button>
          </div>
        ) : isLoading || !comanda ? (
          <LoadingState />
        ) : mostrarCierre ? (
          <div className="space-y-4">
            <p className="text-sm text-ink-600">
              Total a cobrar: <span className="font-semibold text-ink-800">{formatoMoneda(comanda.total)}</span>
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
                No hay una caja abierta en esta sucursal. Ábrela desde el POS antes de cerrar la cuenta.
              </p>
            )}
            {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setMostrarCierre(false)}
                className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50"
              >
                Volver
              </button>
              <button
                onClick={handleCerrarCuenta}
                disabled={cerrar.isPending}
                className="flex items-center gap-2 rounded-lg bg-success-600 px-4 py-2 text-sm font-semibold text-white hover:bg-success-700 disabled:opacity-60"
              >
                {cerrar.isPending && <Loader2 size={16} className="animate-spin" />}
                Confirmar y facturar
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-ink-100 bg-ink-50 p-3">
              <div className="grid grid-cols-[1fr_auto_1fr_auto] items-end gap-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-medium text-ink-500">Producto</span>
                  <select className="input text-sm" value={productoId} onChange={(e) => setProductoId(e.target.value)}>
                    <option value="">Elegir...</option>
                    {productos?.filter((p) => p.estado).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} — {formatoMoneda(p.precioVenta)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block w-20">
                  <span className="mb-1 block text-[11px] font-medium text-ink-500">Cant.</span>
                  <input type="number" min={1} className="input text-sm" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-medium text-ink-500">Notas (opcional)</span>
                  <input className="input text-sm" value={notasItem} onChange={(e) => setNotasItem(e.target.value)} placeholder="sin cebolla..." />
                </label>
                <button
                  onClick={handleAgregarItem}
                  disabled={!productoId || agregarItem.isPending}
                  className="flex items-center gap-1 rounded-lg bg-ink-800 px-3 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-50"
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>

            <div className="max-h-72 space-y-1.5 overflow-y-auto">
              {comanda.items.length === 0 && <p className="py-4 text-center text-sm text-ink-400">Sin ítems todavía.</p>}
              {comanda.items.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between rounded-lg border border-ink-100 px-3 py-2 ${
                    item.estado === 'CANCELADO' ? 'opacity-50' : ''
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-ink-800">
                      {item.cantidad}× {item.productoNombre}
                    </p>
                    {item.notas && <p className="text-xs text-ink-400">{item.notas}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-ink-600">{formatoMoneda(item.precioUnitario * item.cantidad)}</span>
                    {item.estado !== 'CANCELADO' && item.estado !== 'ENTREGADO' && (
                      <button
                        onClick={() =>
                          cambiarEstado.mutate({ comandaId: comanda.id, itemId: item.id, estado: SIGUIENTE_ESTADO[item.estado]! })
                        }
                        className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-600 hover:bg-ink-200"
                      >
                        {ESTADO_ITEM_LABELS[item.estado]}
                      </button>
                    )}
                    {item.estado === 'ENTREGADO' && (
                      <span className="rounded-full bg-success-50 px-2.5 py-1 text-xs font-medium text-success-600">Entregado</span>
                    )}
                    {item.estado !== 'CANCELADO' && (
                      <button
                        onClick={() => cambiarEstado.mutate({ comandaId: comanda.id, itemId: item.id, estado: 'CANCELADO' })}
                        className="rounded p-1 text-ink-300 hover:text-danger-500"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-ink-100 pt-3">
              <p className="text-sm font-semibold text-ink-700">Total: {formatoMoneda(comanda.total)}</p>
              <div className="flex gap-2">
                <button
                  onClick={handleCancelar}
                  disabled={cancelar.isPending}
                  className="flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-2 text-xs font-medium text-ink-500 hover:bg-ink-50"
                >
                  <Ban size={14} />
                  Cancelar comanda
                </button>
                <button
                  onClick={() => setMostrarCierre(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-success-600 px-4 py-2 text-sm font-semibold text-white hover:bg-success-700"
                >
                  <Receipt size={15} />
                  Cerrar cuenta
                </button>
              </div>
            </div>
            {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}
          </>
        )}
      </div>
    </Modal>
  );
}
