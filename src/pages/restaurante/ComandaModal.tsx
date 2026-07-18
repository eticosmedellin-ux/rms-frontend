import { useEffect, useState } from 'react';
import { Loader2, Plus, X, Receipt, Ban, ArrowRightLeft, Merge, UserCog } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import {
  useAbrirComanda,
  useComanda,
  useAgregarItemComanda,
  useCambiarEstadoItem,
  useCerrarComanda,
  useCancelarComanda,
  useMesas,
  useComandasActivas,
  useCambiarMesaComanda,
  useUnirComanda,
  useAsignarMesero,
} from '@/hooks/useRestaurante';
import { useProductos } from '@/hooks/useInventario';
import { useCombos } from '@/hooks/useCombos';
import { useCajaAbierta } from '@/hooks/usePos';
import { useUsuarios } from '@/hooks/useNucleo';
import { useTiposDescuento } from '@/hooks/useDescuentos';
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

interface LineaPago {
  metodoPago: MetodoPagoVenta;
  monto: string;
}

function formatoMoneda(v: number) {
  return v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

export function ComandaModal({ isOpen, onClose, mesa }: { isOpen: boolean; onClose: () => void; mesa: Mesa | null }) {
  const abrir = useAbrirComanda();
  const { data: comanda, isLoading } = useComanda(mesa?.comandaActivaId ?? null);
  const { data: productos } = useProductos();
  const { data: combos } = useCombos();
  const { data: cajaAbierta } = useCajaAbierta(mesa?.sucursalId ?? null);
  const { data: mesas } = useMesas();
  const { data: comandasActivas } = useComandasActivas();
  const { data: usuarios } = useUsuarios();
  const { data: tiposDescuento } = useTiposDescuento();
  const agregarItem = useAgregarItemComanda();
  const cambiarEstado = useCambiarEstadoItem();
  const cerrar = useCerrarComanda();
  const cancelar = useCancelarComanda();
  const cambiarMesa = useCambiarMesaComanda();
  const unir = useUnirComanda();
  const asignarMesero = useAsignarMesero();

  const [itemSeleccionado, setItemSeleccionado] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [notasItem, setNotasItem] = useState('');
  const [vista, setVista] = useState<'comanda' | 'cierre' | 'cambiarMesa' | 'unir'>('comanda');
  const [pagos, setPagos] = useState<LineaPago[]>([{ metodoPago: 'EFECTIVO', monto: '' }]);
  const [propina, setPropina] = useState('');
  const [tipoDescuentoFacturaId, setTipoDescuentoFacturaId] = useState('');
  const [mesaDestinoId, setMesaDestinoId] = useState('');
  const [comandaAUnirId, setComandaAUnirId] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setVista('comanda');
      setError(null);
      setPropina('');
      setTipoDescuentoFacturaId('');
      setMesaDestinoId('');
      setComandaAUnirId('');
    }
  }, [isOpen, mesa]);

  useEffect(() => {
    if (vista === 'cierre' && comanda) {
      const descuento = tiposDescuento?.find((t) => String(t.id) === tipoDescuentoFacturaId);
      const monto = descuento
        ? descuento.tipo === 'PORCENTAJE'
          ? (comanda.total * descuento.valor) / 100
          : descuento.valor
        : 0;
      setPagos([{ metodoPago: 'EFECTIVO', monto: String(Math.max(0, comanda.total - monto)) }]);
    }
  }, [vista, comanda, tipoDescuentoFacturaId]);

  if (!mesa) return null;

  const totalPagos = pagos.reduce((acc, p) => acc + (Number(p.monto) || 0), 0);
  const descuentoSeleccionado = tiposDescuento?.find((t) => String(t.id) === tipoDescuentoFacturaId);
  const montoDescuento =
    comanda && descuentoSeleccionado
      ? descuentoSeleccionado.tipo === 'PORCENTAJE'
        ? (comanda.total * descuentoSeleccionado.valor) / 100
        : descuentoSeleccionado.valor
      : 0;
  const totalConDescuento = comanda ? Math.max(0, comanda.total - montoDescuento) : 0;
  const diferenciaPago = comanda ? Math.round((totalPagos - totalConDescuento) * 100) / 100 : 0;

  function actualizarLineaPago(i: number, campo: keyof LineaPago, valor: string) {
    setPagos((prev) => prev.map((p, idx) => (idx === i ? { ...p, [campo]: valor } : p)));
  }

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
    if (!comanda || !itemSeleccionado) return;
    const [tipo, idTexto] = itemSeleccionado.split('-');
    try {
      await agregarItem.mutateAsync({
        comandaId: comanda.id,
        data: {
          productoId: tipo === 'p' ? Number(idTexto) : undefined,
          comboId: tipo === 'c' ? Number(idTexto) : undefined,
          cantidad: Number(cantidad) || 1,
          notas: notasItem || undefined,
        },
      });
      setItemSeleccionado('');
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
    if (Math.abs(diferenciaPago) > 0.5) {
      setError(`Los pagos suman ${formatoMoneda(totalPagos)}, pero el total es ${formatoMoneda(totalConDescuento)} — ajusta los montos.`);
      return;
    }
    try {
      await cerrar.mutateAsync({
        comandaId: comanda.id,
        data: {
          cajaSesionId: cajaAbierta.id,
          pagos: pagos.map((p) => ({ metodoPago: p.metodoPago, monto: Number(p.monto) || 0 })),
          propina: propina ? Number(propina) : undefined,
          tipoDescuentoFacturaId: tipoDescuentoFacturaId ? Number(tipoDescuentoFacturaId) : undefined,
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

  async function handleCambiarMesa() {
    setError(null);
    if (!comanda || !mesaDestinoId) return;
    try {
      await cambiarMesa.mutateAsync({ comandaId: comanda.id, nuevaMesaId: Number(mesaDestinoId) });
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo cambiar de mesa'));
    }
  }

  async function handleUnir() {
    setError(null);
    if (!comanda || !comandaAUnirId) return;
    try {
      await unir.mutateAsync({ comandaId: comanda.id, otraComandaId: Number(comandaAUnirId) });
      setVista('comanda');
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudieron unir las mesas'));
    }
  }

  const mesasLibres = mesas?.filter((m) => m.estado === 'LIBRE') ?? [];
  const otrasComandasAbiertas = comandasActivas?.filter((c) => c.id !== comanda?.id) ?? [];

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
        ) : vista === 'cierre' ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-ink-50 p-3 text-sm">
              <div className="flex justify-between text-ink-500">
                <span>Subtotal</span>
                <span>{formatoMoneda(comanda.total)}</span>
              </div>
              {montoDescuento > 0 && (
                <div className="flex justify-between text-success-600">
                  <span>Descuento</span>
                  <span>- {formatoMoneda(montoDescuento)}</span>
                </div>
              )}
              <div className="mt-1 flex justify-between border-t border-ink-200 pt-1 font-semibold text-ink-800">
                <span>Total a cobrar</span>
                <span>{formatoMoneda(totalConDescuento)}</span>
              </div>
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink-600">Descuento (opcional)</span>
              <select className="input" value={tipoDescuentoFacturaId} onChange={(e) => setTipoDescuentoFacturaId(e.target.value)}>
                <option value="">Sin descuento</option>
                {tiposDescuento
                  ?.filter((t) => t.vigente && (t.aplicaA === 'FACTURA' || t.aplicaA === 'AMBOS'))
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre} ({t.tipo === 'PORCENTAJE' ? `${t.valor}%` : formatoMoneda(t.valor)})
                    </option>
                  ))}
              </select>
            </label>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-medium text-ink-600">Métodos de pago (divide la cuenta si hace falta)</span>
                <button
                  onClick={() => setPagos((prev) => [...prev, { metodoPago: 'EFECTIVO', monto: '' }])}
                  className="flex items-center gap-1 text-xs font-medium text-ink-600 hover:text-ink-800"
                >
                  <Plus size={12} />
                  Agregar pago
                </button>
              </div>
              <div className="space-y-2">
                {pagos.map((p, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                    <select
                      className="input text-sm"
                      value={p.metodoPago}
                      onChange={(e) => actualizarLineaPago(i, 'metodoPago', e.target.value)}
                    >
                      {METODOS_PAGO.map((m) => (
                        <option key={m.valor} value={m.valor}>
                          {m.etiqueta}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      className="input text-sm"
                      value={p.monto}
                      onChange={(e) => actualizarLineaPago(i, 'monto', e.target.value)}
                      placeholder="Monto"
                    />
                    {pagos.length > 1 && (
                      <button
                        onClick={() => setPagos((prev) => prev.filter((_, idx) => idx !== i))}
                        className="rounded p-1.5 text-ink-300 hover:text-danger-500"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {Math.abs(diferenciaPago) > 0.5 && (
                <p className={`mt-1.5 text-xs ${diferenciaPago > 0 ? 'text-amber-600' : 'text-danger-500'}`}>
                  {diferenciaPago > 0
                    ? `Los pagos suman ${formatoMoneda(diferenciaPago)} de más`
                    : `Faltan ${formatoMoneda(Math.abs(diferenciaPago))} por cubrir`}
                </p>
              )}
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink-600">Propina (opcional)</span>
              <input type="number" className="input" value={propina} onChange={(e) => setPropina(e.target.value)} placeholder="0" />
            </label>

            {!cajaAbierta && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                No hay una caja abierta en esta sucursal. Ábrela desde el POS antes de cerrar la cuenta.
              </p>
            )}
            {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setVista('comanda')}
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
        ) : vista === 'cambiarMesa' ? (
          <div className="space-y-4">
            <p className="text-sm text-ink-600">Elige la mesa libre a la que quieres mover esta comanda.</p>
            <select className="input" value={mesaDestinoId} onChange={(e) => setMesaDestinoId(e.target.value)}>
              <option value="">Elegir mesa...</option>
              {mesasLibres.map((m) => (
                <option key={m.id} value={m.id}>
                  Mesa {m.numero} {m.zona ? `— ${m.zona}` : ''}
                </option>
              ))}
            </select>
            {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}
            <div className="flex justify-end gap-3">
              <button onClick={() => setVista('comanda')} className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50">
                Cancelar
              </button>
              <button
                onClick={handleCambiarMesa}
                disabled={!mesaDestinoId || cambiarMesa.isPending}
                className="flex items-center gap-2 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
              >
                {cambiarMesa.isPending && <Loader2 size={16} className="animate-spin" />}
                Mover comanda
              </button>
            </div>
          </div>
        ) : vista === 'unir' ? (
          <div className="space-y-4">
            <p className="text-sm text-ink-600">Elige la otra mesa que quieres unir a esta cuenta — sus productos se sumarán aquí.</p>
            <select className="input" value={comandaAUnirId} onChange={(e) => setComandaAUnirId(e.target.value)}>
              <option value="">Elegir mesa...</option>
              {otrasComandasAbiertas.map((c) => (
                <option key={c.id} value={c.id}>
                  Mesa {c.mesaNumero} — {formatoMoneda(c.total)}
                </option>
              ))}
            </select>
            {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}
            <div className="flex justify-end gap-3">
              <button onClick={() => setVista('comanda')} className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50">
                Cancelar
              </button>
              <button
                onClick={handleUnir}
                disabled={!comandaAUnirId || unir.isPending}
                className="flex items-center gap-2 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
              >
                {unir.isPending && <Loader2 size={16} className="animate-spin" />}
                Unir mesas
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-ink-50 px-3 py-2 text-xs">
              <div className="flex items-center gap-1.5">
                <UserCog size={13} className="text-ink-400" />
                <span className="text-ink-500">Mesero:</span>
                <select
                  className="rounded border border-ink-200 bg-white px-1.5 py-0.5 text-xs"
                  value={comanda.meseroId}
                  onChange={(e) => asignarMesero.mutate({ comandaId: comanda.id, meseroUsuarioId: Number(e.target.value) })}
                >
                  {usuarios?.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre} {u.apellido ?? ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setVista('cambiarMesa')} className="flex items-center gap-1 text-ink-500 hover:text-ink-800">
                  <ArrowRightLeft size={12} />
                  Cambiar mesa
                </button>
                <button onClick={() => setVista('unir')} className="flex items-center gap-1 text-ink-500 hover:text-ink-800">
                  <Merge size={12} />
                  Unir mesa
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-ink-100 bg-ink-50 p-3">
              <div className="grid grid-cols-[1fr_auto_1fr_auto] items-end gap-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-medium text-ink-500">Producto o plato del menú</span>
                  <select className="input text-sm" value={itemSeleccionado} onChange={(e) => setItemSeleccionado(e.target.value)}>
                    <option value="">Elegir...</option>
                    {combos && combos.length > 0 && (
                      <optgroup label="Platos del menú (recetas)">
                        {combos.filter((c) => c.estado).map((c) => (
                          <option key={`c-${c.id}`} value={`c-${c.id}`}>
                            {c.nombre} — {formatoMoneda(c.precioVenta)}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="Productos individuales">
                      {productos?.filter((p) => p.estado).map((p) => (
                        <option key={`p-${p.id}`} value={`p-${p.id}`}>
                          {p.nombre} — {formatoMoneda(p.precioVenta)}
                        </option>
                      ))}
                    </optgroup>
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
                  disabled={!itemSeleccionado || agregarItem.isPending}
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
                      {item.cantidad}× {item.comboNombre ?? item.productoNombre}
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
                  onClick={() => setVista('cierre')}
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
