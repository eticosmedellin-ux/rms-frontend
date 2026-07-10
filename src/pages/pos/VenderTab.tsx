import { useMemo, useState } from 'react';
import { Search, Trash2, ShoppingCart, Loader2, Plus, ImageOff, Tag } from 'lucide-react';
import { useProductos } from '@/hooks/useInventario';
import { useClientes } from '@/hooks/usePos';
import { useCajaAbierta, useRegistrarVenta } from '@/hooks/usePos';
import { useTiposDescuento } from '@/hooks/useDescuentos';
import { usePosStore } from '@/stores/posStore';
import { getApiErrorMessage } from '@/api/errors';
import { EmptyState } from '@/components/ui/States';
import type { MetodoPagoVenta, TipoDescuento } from '@/types/pos';

interface LineaCarrito {
  productoId: number;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  tipoDescuentoId: number | null;
}

interface LineaPago {
  metodoPago: MetodoPagoVenta;
  monto: string;
}

type ModoDescuento = 'NINGUNO' | 'LINEA' | 'FACTURA';

/** Solo para PREVISUALIZAR en pantalla — el backend siempre recalcula esto desde el
 *  catálogo real antes de guardar la venta, nunca confía en lo que se muestra aquí. */
function calcularDescuentoLinea(linea: LineaCarrito, catalogo: TipoDescuento[]): number {
  if (!linea.tipoDescuentoId) return 0;
  const td = catalogo.find((c) => c.id === linea.tipoDescuentoId);
  if (!td) return 0;
  const subtotalLinea = linea.cantidad * linea.precioUnitario;
  const monto = td.tipo === 'PORCENTAJE' ? (subtotalLinea * td.valor) / 100 : td.valor;
  return Math.min(monto, subtotalLinea);
}

export function VenderTab() {
  const { sucursalId } = usePosStore();
  const { data: caja } = useCajaAbierta(sucursalId);
  const { data: productos } = useProductos();
  const { data: clientes } = useClientes();
  const { data: tiposDescuento } = useTiposDescuento();
  const registrarVenta = useRegistrarVenta();

  const [busqueda, setBusqueda] = useState('');
  const [carrito, setCarrito] = useState<LineaCarrito[]>([]);
  const [pagos, setPagos] = useState<LineaPago[]>([{ metodoPago: 'EFECTIVO', monto: '' }]);
  const [clienteId, setClienteId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [ventaExitosa, setVentaExitosa] = useState<string | null>(null);

  const [modoDescuento, setModoDescuento] = useState<ModoDescuento>('NINGUNO');
  const [tipoDescuentoFacturaId, setTipoDescuentoFacturaId] = useState<number | null>(null);

  // Solo descuentos activos, no vencidos, y aplicables al modo elegido — el cajero
  // nunca ve la opción de escribir un valor, solo puede elegir de esta lista.
  const catalogo = tiposDescuento ?? [];
  const opcionesLinea = useMemo(
    () => catalogo.filter((t) => t.vigente && (t.aplicaA === 'LINEA' || t.aplicaA === 'AMBOS')),
    [catalogo]
  );
  const opcionesFactura = useMemo(
    () => catalogo.filter((t) => t.vigente && (t.aplicaA === 'FACTURA' || t.aplicaA === 'AMBOS')),
    [catalogo]
  );

  const productosVisibles = useMemo(() => {
    if (!productos) return [];
    if (!busqueda.trim()) return productos.filter((p) => p.estado);
    const term = busqueda.toLowerCase();
    return productos.filter(
      (p) => p.estado && (p.nombre.toLowerCase().includes(term) || p.codigoInterno.toLowerCase().includes(term))
    );
  }, [productos, busqueda]);

  const subtotal = carrito.reduce((acc, l) => acc + l.cantidad * l.precioUnitario, 0);

  const descuentoLineasTotal = useMemo(
    () => (modoDescuento === 'LINEA' ? carrito.reduce((acc, l) => acc + calcularDescuentoLinea(l, catalogo), 0) : 0),
    [carrito, modoDescuento, catalogo]
  );

  const descuentoFacturaMonto = useMemo(() => {
    if (modoDescuento !== 'FACTURA' || !tipoDescuentoFacturaId) return 0;
    const td = catalogo.find((c) => c.id === tipoDescuentoFacturaId);
    if (!td) return 0;
    const monto = td.tipo === 'PORCENTAJE' ? (subtotal * td.valor) / 100 : td.valor;
    return Math.min(monto, subtotal);
  }, [modoDescuento, tipoDescuentoFacturaId, catalogo, subtotal]);

  const descuentoTotal = modoDescuento === 'LINEA' ? descuentoLineasTotal : descuentoFacturaMonto;
  const total = subtotal - descuentoTotal;

  const totalPagos = pagos.reduce((acc, p) => acc + (Number(p.monto) || 0), 0);
  const totalNoEfectivo = pagos
    .filter((p) => p.metodoPago !== 'EFECTIVO')
    .reduce((acc, p) => acc + (Number(p.monto) || 0), 0);
  const cambio = Math.max(0, totalPagos - total);
  const requiereCredito = pagos.some((p) => p.metodoPago === 'CREDITO');

  function agregarProducto(productoId: number, nombre: string, precioVenta: number) {
    setCarrito((prev) => {
      const existente = prev.find((l) => l.productoId === productoId);
      if (existente) {
        return prev.map((l) => (l.productoId === productoId ? { ...l, cantidad: l.cantidad + 1 } : l));
      }
      return [...prev, { productoId, nombre, cantidad: 1, precioUnitario: precioVenta, tipoDescuentoId: null }];
    });
  }

  function actualizarCantidad(productoId: number, cantidad: number) {
    setCarrito((prev) => prev.map((l) => (l.productoId === productoId ? { ...l, cantidad } : l)));
  }

  function actualizarDescuentoLinea(productoId: number, tipoDescuentoId: number | null) {
    setCarrito((prev) => prev.map((l) => (l.productoId === productoId ? { ...l, tipoDescuentoId } : l)));
  }

  function quitarLinea(productoId: number) {
    setCarrito((prev) => prev.filter((l) => l.productoId !== productoId));
  }

  function actualizarPago(index: number, cambios: Partial<LineaPago>) {
    setPagos((prev) => prev.map((p, i) => (i === index ? { ...p, ...cambios } : p)));
  }

  function agregarLineaPago() {
    setPagos((prev) => [...prev, { metodoPago: 'EFECTIVO', monto: '' }]);
  }

  function quitarLineaPago(index: number) {
    setPagos((prev) => prev.filter((_, i) => i !== index));
  }

  function completarPagoRestante(index: number) {
    const restante = total - (totalPagos - (Number(pagos[index].monto) || 0));
    actualizarPago(index, { monto: restante > 0 ? String(restante) : '0' });
  }

  function cambiarModoDescuento(modo: ModoDescuento) {
    setModoDescuento(modo);
    if (modo !== 'LINEA') {
      setCarrito((prev) => prev.map((l) => ({ ...l, tipoDescuentoId: null })));
    }
    if (modo !== 'FACTURA') {
      setTipoDescuentoFacturaId(null);
    }
  }

  async function confirmarVenta() {
    setError(null);
    setVentaExitosa(null);
    if (!caja || carrito.length === 0 || !sucursalId) return;

    if (totalNoEfectivo > total + 0.001) {
      setError('El pago con tarjeta, transferencia o crédito no puede superar el total de la venta');
      return;
    }
    if (totalPagos + 0.001 < total) {
      setError(
        `Faltan $${(total - totalPagos).toLocaleString('es-CO')} por pagar del total ($${total.toLocaleString('es-CO')})`
      );
      return;
    }
    if (requiereCredito && !clienteId) {
      setError('Selecciona un cliente para ventas con abono a crédito');
      return;
    }

    try {
      const venta = await registrarVenta.mutateAsync({
        sucursalId,
        cajaSesionId: caja.id,
        clienteId: clienteId ? Number(clienteId) : undefined,
        detalles: carrito.map((l) => ({
          productoId: l.productoId,
          cantidad: l.cantidad,
          precioUnitario: l.precioUnitario,
          tipoDescuentoId: modoDescuento === 'LINEA' ? l.tipoDescuentoId : undefined,
        })),
        pagos: pagos.map((p) => ({ metodoPago: p.metodoPago, monto: Number(p.monto) || 0 })),
        tipoDescuentoFacturaId: modoDescuento === 'FACTURA' ? tipoDescuentoFacturaId : undefined,
      });
      const mensajeCambio = venta.cambio > 0 ? ` — vuelto: $${venta.cambio.toLocaleString('es-CO')}` : '';
      setVentaExitosa(`Venta ${venta.numero} registrada por $${venta.total.toLocaleString('es-CO')}${mensajeCambio}`);
      setCarrito([]);
      setClienteId('');
      setPagos([{ metodoPago: 'EFECTIVO', monto: '' }]);
      cambiarModoDescuento('NINGUNO');
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo registrar la venta'));
    }
  }

  if (!sucursalId) {
    return <EmptyState title="Selecciona una sucursal arriba para empezar" />;
  }

  if (!caja) {
    return (
      <EmptyState
        title="No hay una caja abierta en esta sucursal"
        description="Ábrela desde el botón de arriba antes de registrar ventas."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
      {/* Catálogo de productos: cuadrícula visual con imagen */}
      <div>
        <div className="relative mb-4">
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            className="input pl-10"
            placeholder="Busca un producto por nombre o código…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {productosVisibles.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {productosVisibles.map((p) => (
              <button
                key={p.id}
                onClick={() => agregarProducto(p.id, p.nombre, p.precioVenta)}
                className="group rounded-xl border border-ink-100 bg-white p-2 text-left shadow-card transition-all hover:border-ink-300 hover:shadow-md"
              >
                <div className="aspect-square w-full overflow-hidden rounded-lg bg-ink-50">
                  {p.imagen ? (
                    <img
                      src={p.imagen}
                      alt={p.nombre}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-ink-300">
                      <ImageOff size={28} />
                    </div>
                  )}
                </div>
                <p className="mt-2 truncate text-sm font-medium text-ink-800">{p.nombre}</p>
                <p className="text-sm font-semibold text-ink-600">${p.precioVenta.toLocaleString('es-CO')}</p>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState
            title={busqueda ? 'Sin resultados' : 'Sin productos'}
            description={busqueda ? 'Prueba con otro nombre o código.' : 'Crea productos en Inventario para verlos aquí.'}
          />
        )}
      </div>

      {/* Carrito */}
      <div className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
        <h3 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-ink-800">
          <ShoppingCart size={18} />
          Carrito
        </h3>

        <div className="max-h-64 space-y-3 overflow-y-auto">
          {carrito.map((l) => (
            <div key={l.productoId} className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm">
                <div className="flex-1">
                  <p className="font-medium text-ink-800">{l.nombre}</p>
                  <p className="text-xs text-ink-400">${l.precioUnitario.toLocaleString('es-CO')} c/u</p>
                </div>
                <input
                  type="number"
                  min={1}
                  value={l.cantidad}
                  onChange={(e) => actualizarCantidad(l.productoId, Number(e.target.value))}
                  className="w-16 rounded-lg border border-ink-200 px-2 py-1 text-center text-sm"
                />
                <span className="w-20 text-right font-medium text-ink-700">
                  ${(l.cantidad * l.precioUnitario - calcularDescuentoLinea(l, catalogo)).toLocaleString('es-CO')}
                </span>
                <button onClick={() => quitarLinea(l.productoId)} className="text-ink-300 hover:text-danger-500">
                  <Trash2 size={16} />
                </button>
              </div>

              {modoDescuento === 'LINEA' && (
                <div className="flex items-center gap-2 pl-1">
                  <Tag size={12} className="text-ink-300 shrink-0" />
                  <select
                    className="input flex-1 py-1 text-xs"
                    value={l.tipoDescuentoId ?? ''}
                    onChange={(e) =>
                      actualizarDescuentoLinea(l.productoId, e.target.value ? Number(e.target.value) : null)
                    }
                  >
                    <option value="">Sin descuento</option>
                    {opcionesLinea.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre} ({t.tipo === 'PORCENTAJE' ? `${t.valor}%` : `$${t.valor.toLocaleString('es-CO')}`})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Selector de modo de descuento — por producto o por factura, nunca ambos */}
        <div className="mt-4 border-t border-ink-100 pt-3">
          <div className="mb-2 flex gap-1 rounded-lg bg-ink-50 p-1 text-xs font-medium">
            {(['NINGUNO', 'LINEA', 'FACTURA'] as ModoDescuento[]).map((modo) => (
              <button
                key={modo}
                onClick={() => cambiarModoDescuento(modo)}
                className={`flex-1 rounded-md py-1.5 transition-colors ${
                  modoDescuento === modo ? 'bg-white text-ink-800 shadow-sm' : 'text-ink-400 hover:text-ink-600'
                }`}
              >
                {modo === 'NINGUNO' ? 'Sin descuento' : modo === 'LINEA' ? 'Por producto' : 'De factura'}
              </button>
            ))}
          </div>

          {modoDescuento === 'FACTURA' && (
            <div className="mb-3 flex items-center gap-2">
              <Tag size={14} className="text-ink-400 shrink-0" />
              <select
                className="input flex-1"
                value={tipoDescuentoFacturaId ?? ''}
                onChange={(e) => setTipoDescuentoFacturaId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Selecciona un descuento…</option>
                {opcionesFactura.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre} ({t.tipo === 'PORCENTAJE' ? `${t.valor}%` : `$${t.valor.toLocaleString('es-CO')}`})
                  </option>
                ))}
              </select>
            </div>
          )}

          {modoDescuento !== 'NINGUNO' &&
            ((modoDescuento === 'LINEA' && opcionesLinea.length === 0) ||
              (modoDescuento === 'FACTURA' && opcionesFactura.length === 0)) && (
              <p className="mb-3 text-xs text-amber-600">
                No hay descuentos configurados para este tipo. Pídele a un administrador que los cree en "Descuentos".
              </p>
            )}

          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between text-ink-500">
              <span>Subtotal</span>
              <span>${subtotal.toLocaleString('es-CO')}</span>
            </div>
            {descuentoTotal > 0 && (
              <div className="flex items-center justify-between text-success-600">
                <span>Descuento</span>
                <span>-${descuentoTotal.toLocaleString('es-CO')}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-base font-semibold text-ink-800">
              <span>Total</span>
              <span>${total.toLocaleString('es-CO')}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-600">Pagos</span>
            <button
              onClick={agregarLineaPago}
              className="flex items-center gap-1 text-xs font-medium text-ink-600 hover:text-ink-900"
            >
              <Plus size={14} />
              Dividir pago
            </button>
          </div>

          {pagos.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                className="input"
                value={p.metodoPago}
                onChange={(e) => actualizarPago(i, { metodoPago: e.target.value as MetodoPagoVenta })}
              >
                <option value="EFECTIVO">Efectivo</option>
                <option value="TARJETA">Tarjeta</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="CREDITO">Crédito</option>
              </select>
              <input
                type="number"
                className="input w-28"
                placeholder="Monto"
                value={p.monto}
                onChange={(e) => actualizarPago(i, { monto: e.target.value })}
              />
              <button
                onClick={() => completarPagoRestante(i)}
                title="Completar con el restante"
                className="whitespace-nowrap text-xs text-ink-400 hover:text-ink-700"
              >
                todo
              </button>
              {pagos.length > 1 && (
                <button onClick={() => quitarLineaPago(i)} className="text-ink-300 hover:text-danger-500">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}

          <p className="text-xs text-ink-400">
            Pagado: ${totalPagos.toLocaleString('es-CO')} de ${total.toLocaleString('es-CO')}
          </p>

          {cambio > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
              <span>Cambio a devolver</span>
              <span>${cambio.toLocaleString('es-CO')}</span>
            </div>
          )}

          {requiereCredito && (
            <label className="block pt-1">
              <span className="mb-1 block text-xs font-medium text-ink-600">Cliente (para el crédito)</span>
              <select className="input" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                <option value="">Selecciona…</option>
                {clientes?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} (saldo: ${c.saldoPendiente.toLocaleString('es-CO')} / límite: $
                    {c.limiteCredito.toLocaleString('es-CO')})
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {error && <div className="mt-3 rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}
        {ventaExitosa && (
          <div className="mt-3 rounded-lg bg-success-50 px-3 py-2.5 text-sm text-success-600">{ventaExitosa}</div>
        )}

        <button
          onClick={confirmarVenta}
          disabled={carrito.length === 0 || registrarVenta.isPending}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-ink-800 py-3 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
        >
          {registrarVenta.isPending && <Loader2 size={16} className="animate-spin" />}
          Confirmar venta
        </button>
      </div>
    </div>
  );
}
