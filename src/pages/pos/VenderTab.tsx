import {useCalculoVenta} from '@/features/sicom/useCalculoVenta';
import {useAuthStore} from '@/stores/authStore';
import {useSicom,permitido} from '@/features/sicom/api';
import {useCrearCliente} from '@/hooks/usePos';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Search, Trash2, ShoppingCart, Loader2, Plus, ImageOff, Tag, FileText, Wrench, Package2, XCircle } from 'lucide-react';
import { useProductos, useStockSucursal } from '@/hooks/useInventario';
import { useCombos } from '@/hooks/useCombos';
import { useClientes } from '@/hooks/usePos';
import { useCajaAbierta, useRegistrarVenta } from '@/hooks/usePos';
import { useTiposDescuento } from '@/hooks/useDescuentos';
import { useEmpresa } from '@/hooks/useGestion';
import { usePosStore } from '@/stores/posStore';
import { getApiErrorMessage } from '@/api/errors';
import { EmptyState } from '@/components/ui/States';
import { abrirFactura } from '@/lib/factura';
import type { MetodoPagoVenta, TipoDescuento, Venta } from '@/types/pos';

/** Un artículo que se puede vender: producto (con o sin inventario) o combo. */
interface ItemVendible {
  tipo: 'PRODUCTO' | 'COMBO';
  id: number;
  nombre: string;
  precioVenta: number;
  imagen: string | null;
  manejaInventario: boolean;
  codigoInterno: string;
  stock: number | null; // null = no aplica (servicio o combo)
  stockBajo: boolean;
}

interface LineaCarrito {
  tipo: 'PRODUCTO' | 'COMBO';
  itemId: number;
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

interface VentaEnProceso {
  carrito: LineaCarrito[];
  pagos: LineaPago[];
  clienteId: string;
  modoDescuento: ModoDescuento;
  tipoDescuentoFacturaId: number | null;
  facturarVenta: boolean;
}

function claveVentaEnProceso(sucursalId: number) {
  const s=useAuthStore.getState();
  return `pos-venta-en-proceso-${s.empresaId}-${s.usuarioId}-${sucursalId}`;
}

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
  const { data: combos } = useCombos();
  const { data: stockSucursal } = useStockSucursal(sucursalId);
  const { data: clientes } = useClientes();
  const { data: tiposDescuento } = useTiposDescuento();
  const { data: empresa } = useEmpresa();
  const registrarVenta = useRegistrarVenta();
  const {data:sicom}=useSicom();
  const crearCliente=useCrearCliente();
  const [registroRapido,setRegistroRapido]=useState(false);
  const [nombreRapido,setNombreRapido]=useState('');
  const [documentoRapido,setDocumentoRapido]=useState('');
  const [telefonoRapido,setTelefonoRapido]=useState('');
  const [puntosCanje,setPuntosCanje]=useState(0);
  async function registrarClienteRapido(){
    if(!nombreRapido.trim()||crearCliente.isPending)return;
    try{const c=await crearCliente.mutateAsync({nombre:nombreRapido.trim(),documento:documentoRapido.trim()||undefined,telefono:telefonoRapido.trim()||undefined});setClienteId(String(c.id));setRegistroRapido(false);setNombreRapido('');setDocumentoRapido('');setTelefonoRapido('');setError(null);}
    catch(e){setError(getApiErrorMessage(e,'No se pudo registrar el cliente'));}
  }

  const [busqueda, setBusqueda] = useState('');
  const busquedaInputRef = useRef<HTMLInputElement>(null);
  const [carrito, setCarrito] = useState<LineaCarrito[]>([]);
  const [pagos, setPagos] = useState<LineaPago[]>([{ metodoPago: 'EFECTIVO', monto: '' }]);
  const [clienteId, setClienteId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [ventaExitosa, setVentaExitosa] = useState<string | null>(null);
  const [ultimaVenta, setUltimaVenta] = useState<Venta | null>(null);

  const [modoDescuento, setModoDescuento] = useState<ModoDescuento>('NINGUNO');
  const [tipoDescuentoFacturaId, setTipoDescuentoFacturaId] = useState<number | null>(null);
  const [facturarVenta, setFacturarVenta] = useState(true);
  const [recuperada, setRecuperada] = useState(false);
  const restauradoRef = useRef(false);

  // Recuperación automática: si había una venta en proceso en esta sucursal (se cambió de
  // pantalla, se recargó la página, etc.), se restaura sola al volver al POS.
  useEffect(() => {
    if (!sucursalId || restauradoRef.current) return;
    restauradoRef.current = true;
    try {
      const guardado = window.localStorage.getItem(claveVentaEnProceso(sucursalId));
      if (guardado) {
        const datos: VentaEnProceso = JSON.parse(guardado);
        if (datos.carrito?.length > 0) {
          setCarrito(datos.carrito);
          setPagos(datos.pagos ?? [{ metodoPago: 'EFECTIVO', monto: '' }]);
          setClienteId(datos.clienteId ?? '');
          setModoDescuento(datos.modoDescuento ?? 'NINGUNO');
          setTipoDescuentoFacturaId(datos.tipoDescuentoFacturaId ?? null);
          setFacturarVenta(datos.facturarVenta ?? true);
          setRecuperada(true);
        }
      }
    } catch {
      // localStorage no disponible o dato corrupto — se ignora, simplemente no se restaura nada
    }
  }, [sucursalId]);

  // Persistencia automática: cada cambio en la venta en proceso se guarda de inmediato.
  useEffect(() => {
    if (!sucursalId || !restauradoRef.current) return;
    try {
      if (carrito.length === 0) {
        window.localStorage.removeItem(claveVentaEnProceso(sucursalId));
      } else {
        const datos: VentaEnProceso = { carrito, pagos, clienteId, modoDescuento, tipoDescuentoFacturaId, facturarVenta };
        window.localStorage.setItem(claveVentaEnProceso(sucursalId), JSON.stringify(datos));
      }
    } catch {
      // si el navegador bloquea localStorage, simplemente no persiste — no rompe la venta actual
    }
  }, [sucursalId, carrito, pagos, clienteId, modoDescuento, tipoDescuentoFacturaId, facturarVenta]);

  function cancelarVenta() {
    setCarrito([]);
    setPagos([{ metodoPago: 'EFECTIVO', monto: '' }]);
    setClienteId('');
    cambiarModoDescuento('NINGUNO');
    setError(null);
    setRecuperada(false);
    if (sucursalId) window.localStorage.removeItem(claveVentaEnProceso(sucursalId));
  }

  const catalogo = tiposDescuento ?? [];
  const opcionesLinea = useMemo(
    () => catalogo.filter((t) => t.vigente && (t.aplicaA === 'LINEA' || t.aplicaA === 'AMBOS')),
    [catalogo]
  );
  const opcionesFactura = useMemo(
    () => catalogo.filter((t) => t.vigente && (t.aplicaA === 'FACTURA' || t.aplicaA === 'AMBOS')),
    [catalogo]
  );

  // Productos y combos activos, unidos en una sola lista vendible.
  const stockPorProducto = useMemo(() => {
    const mapa = new Map<number, { stock: number; bajo: boolean }>();
    for (const s of stockSucursal ?? []) {
      mapa.set(s.productoId, { stock: s.stockActual, bajo: s.stockBajo });
    }
    return mapa;
  }, [stockSucursal]);

  const itemsVendibles = useMemo<ItemVendible[]>(() => {
    const productosItems: ItemVendible[] = (productos ?? [])
      .filter((p) => p.estado)
      .map((p) => {
        const stockInfo = p.manejaInventario ? stockPorProducto.get(p.id) : undefined;
        return {
          tipo: 'PRODUCTO',
          id: p.id,
          nombre: p.nombre,
          precioVenta: p.precioVenta,
          imagen: p.imagen,
          manejaInventario: p.manejaInventario,
          codigoInterno: p.codigoInterno,
          stock: stockInfo ? stockInfo.stock : null,
          stockBajo: stockInfo?.bajo ?? false,
        };
      });
    const combosItems: ItemVendible[] = (combos ?? [])
      .filter((c) => c.estado)
      .map((c) => ({
        tipo: 'COMBO',
        id: c.id,
        nombre: c.nombre,
        precioVenta: c.precioVenta,
        imagen: c.imagen ?? null,
        manejaInventario: false,
        codigoInterno: c.codigo,
        stock: null,
        stockBajo: false,
      }));
    return [...productosItems, ...combosItems];
  }, [productos, combos, stockPorProducto]);

  const itemsVisibles = useMemo(() => {
    if (!busqueda.trim()) return itemsVendibles;
    const term = busqueda.toLowerCase();
    return itemsVendibles.filter(
      (i) => i.nombre.toLowerCase().includes(term) || i.codigoInterno.toLowerCase().includes(term)
    );
  }, [itemsVendibles, busqueda]);

  const valorCanje=sicom?.fidelizacion_activa && clienteId && modoDescuento==='NINGUNO'?puntosCanje*Number(sicom.valor_punto):0;
  const calculo=useCalculoVenta({
    detalles:carrito.map(l=>({productoId:l.tipo==='PRODUCTO'?l.itemId:null,comboId:l.tipo==='COMBO'?l.itemId:null,cantidad:l.cantidad,precioUnitario:l.precioUnitario,tipoDescuentoId:modoDescuento==='LINEA'?l.tipoDescuentoId:null})),
    tipoDescuentoFacturaId:modoDescuento==='FACTURA'?tipoDescuentoFacturaId:null,
    clienteId:clienteId?Number(clienteId):null,puntosCanjear:valorCanje>0?puntosCanje:0
  },!!sicom);
  const subtotal=calculo.data?.subtotal??0;
  const descuentoTotal=calculo.data?.descuento??0;
  const total=calculo.data?.total??0;

  const totalPagos = pagos.reduce((acc, p) => acc + (Number(p.monto) || 0), 0);
  const totalNoEfectivo = pagos
    .filter((p) => p.metodoPago !== 'EFECTIVO')
    .reduce((acc, p) => acc + (Number(p.monto) || 0), 0);
  const cambio = Math.max(0, totalPagos - total);
  const requiereCredito = pagos.some((p) => p.metodoPago === 'CREDITO');

  function agregarItem(item: ItemVendible) {
    setCarrito((prev) => {
      const existente = prev.find((l) => l.tipo === item.tipo && l.itemId === item.id);
      if (existente) {
        return prev.map((l) =>
          l.tipo === item.tipo && l.itemId === item.id ? { ...l, cantidad: l.cantidad + 1 } : l
        );
      }
      return [
        ...prev,
        { tipo: item.tipo, itemId: item.id, nombre: item.nombre, cantidad: 1, precioUnitario: item.precioVenta, tipoDescuentoId: null },
      ];
    });
  }

  /** Con un lector de código de barras (o al escribir un código exacto y dar Enter), si
   *  la búsqueda deja un solo artículo visible, se agrega directo sin soltar el teclado. */
  function manejarEnterBusqueda(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter' || itemsVisibles.length !== 1) return;
    agregarItem(itemsVisibles[0]);
    setBusqueda('');
    busquedaInputRef.current?.focus();
  }

  function actualizarCantidad(tipo: 'PRODUCTO' | 'COMBO', itemId: number, cantidad: number) {
    setCarrito((prev) => prev.map((l) => (l.tipo === tipo && l.itemId === itemId ? { ...l, cantidad } : l)));
  }

  function actualizarDescuentoLinea(tipo: 'PRODUCTO' | 'COMBO', itemId: number, tipoDescuentoId: number | null) {
    setCarrito((prev) => prev.map((l) => (l.tipo === tipo && l.itemId === itemId ? { ...l, tipoDescuentoId } : l)));
  }

  function quitarLinea(tipo: 'PRODUCTO' | 'COMBO', itemId: number) {
    setCarrito((prev) => prev.filter((l) => !(l.tipo === tipo && l.itemId === itemId)));
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
    setPuntosCanje(0);
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
    if (!caja || carrito.length === 0 || !sucursalId || registrarVenta.isPending) return;
    if (!permitido(sicom,'VENDER')) {setError('El administrador no ha habilitado la venta');return;}
    if(!calculo.data||calculo.isFetching||calculo.isError){setError('Espera a que termine el cálculo de la venta');return;}
    if(total<=0){setError('La venta debe tener un total positivo');return;}

    if (empresa?.confirmarAntesDeVenta) {
      const confirmado = window.confirm(`¿Confirmar esta venta por $${total.toLocaleString('es-CO')}?`);
      if (!confirmado) return;
    }

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
      const payload = {
        sucursalId,
        cajaSesionId: caja.id,
        clienteId: clienteId ? Number(clienteId) : undefined,
        detalles: carrito.map((l) => ({
          productoId: l.tipo === 'PRODUCTO' ? l.itemId : undefined,
          comboId: l.tipo === 'COMBO' ? l.itemId : undefined,
          cantidad: l.cantidad,
          precioUnitario: l.precioUnitario,
          tipoDescuentoId: modoDescuento === 'LINEA' ? l.tipoDescuentoId : undefined,
        })),
        pagos: pagos.map((p) => ({ metodoPago: p.metodoPago, monto: Number(p.monto) || 0 })),
        tipoDescuentoFacturaId: modoDescuento === 'FACTURA' ? tipoDescuentoFacturaId : undefined,
        facturar: facturarVenta,
        totalEsperado:total,
        puntosCanjear: valorCanje>0?puntosCanje:0,
      };
      const firma=JSON.stringify(payload);
      const claveLocal=claveVentaEnProceso(sucursalId)+'-operacion';
      const previa=JSON.parse(window.localStorage.getItem(claveLocal)||'null') as {firma:string;clave:string}|null;
      const clave=previa?.firma===firma?previa.clave:crypto.randomUUID();
      window.localStorage.setItem(claveLocal,JSON.stringify({firma,clave}));
      const venta = await registrarVenta.mutateAsync({...payload,claveOperacion:clave});
      window.localStorage.removeItem(claveLocal);
      const mensajeCambio = venta.cambio > 0 ? ` — vuelto: $${venta.cambio.toLocaleString('es-CO')}` : '';
      setVentaExitosa(`Venta ${venta.numero} registrada por $${venta.total.toLocaleString('es-CO')}${mensajeCambio}`);
      setUltimaVenta(venta);
      setCarrito([]);
      setClienteId('');
      setPuntosCanje(0);
      setPagos([{ metodoPago: 'EFECTIVO', monto: '' }]);
      cambiarModoDescuento('NINGUNO');
      setRecuperada(false);
      if (sucursalId) window.localStorage.removeItem(claveVentaEnProceso(sucursalId));
      busquedaInputRef.current?.focus();
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
      {/* Catálogo: productos, servicios y combos en una sola cuadrícula visual */}
      <div>
        <div className="relative mb-4">
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            ref={busquedaInputRef}
            autoFocus
            className="input pl-10"
            placeholder="Escanea o escribe un código, o busca por nombre…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={manejarEnterBusqueda}
          />
        </div>

        {itemsVisibles.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {itemsVisibles.map((item) => (
              <button
                key={`${item.tipo}-${item.id}`}
                onClick={() => {
                  agregarItem(item);
                  busquedaInputRef.current?.focus();
                }}
                className="group rounded-xl border border-ink-100 bg-white p-2 text-left shadow-card transition-all hover:border-ink-300 hover:shadow-md"
              >
                <div className="aspect-square w-full overflow-hidden rounded-lg bg-ink-50">
                  {item.imagen ? (
                    <img
                      src={item.imagen}
                      alt={item.nombre}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-ink-300">
                      {item.tipo === 'COMBO' ? (
                        <Package2 size={28} />
                      ) : item.manejaInventario ? (
                        <ImageOff size={28} />
                      ) : (
                        <Wrench size={28} />
                      )}
                    </div>
                  )}
                </div>
                <p className="mt-2 truncate text-sm font-medium text-ink-800">
                  {item.nombre}
                  {item.tipo === 'COMBO' && (
                    <span className="ml-1.5 rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">
                      Combo
                    </span>
                  )}
                  {item.tipo === 'PRODUCTO' && !item.manejaInventario && (
                    <span className="ml-1.5 rounded-full bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-700">
                      Servicio
                    </span>
                  )}
                </p>
                <p className="text-sm font-semibold text-ink-600">${item.precioVenta.toLocaleString('es-CO')}</p>
                {item.stock !== null && (
                  <p
                    className={`mt-0.5 text-[11px] font-medium ${
                      item.stock <= 0 ? 'text-danger-500' : item.stockBajo ? 'text-amber-600' : 'text-ink-400'
                    }`}
                  >
                    {item.stock <= 0 ? 'Agotado' : `Stock: ${item.stock}`}
                  </p>
                )}
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
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-display text-base font-semibold text-ink-800">
            <ShoppingCart size={18} />
            Carrito
          </h3>
          {carrito.length > 0 && (
            <button
              onClick={cancelarVenta}
              title="Cancelar venta y vaciar el carrito"
              className="flex items-center gap-1 text-xs font-medium text-ink-400 hover:text-danger-500"
            >
              <XCircle size={14} />
              Cancelar venta
            </button>
          )}
        </div>

        {recuperada && (
          <div className="mb-3 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-700">
            Recuperamos la venta que tenías en proceso en esta sucursal.
          </div>
        )}

        <div className="max-h-64 space-y-3 overflow-y-auto">
          {carrito.map((l,indice) => (
            <div key={`${l.tipo}-${l.itemId}`} className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm">
                <div className="flex-1">
                  <p className="font-medium text-ink-800">
                    {l.nombre}
                    {l.tipo === 'COMBO' && <span className="ml-1 text-[10px] text-violet-600">(combo)</span>}
                  </p>
                  <p className="text-xs text-ink-400">
                    {calculo.data?.detalles[indice]&&calculo.data.modoImpuesto!=='DESACTIVADO'&&<span className="block">{calculo.data.detalles[indice].tipo} {calculo.data.detalles[indice].tarifa}% · Impuesto ${calculo.data.detalles[indice].impuesto.toLocaleString('es-CO')}</span>}
                    ${l.precioUnitario.toLocaleString('es-CO')} c/u
                    {permitido(sicom,'MODIFICAR_PRECIO')&&<span className="block mt-1">Precio autorizado<input aria-label={`Precio de ${l.nombre}`} type="number" min="0.01" step="0.01" className="input w-28" value={l.precioUnitario} onChange={e=>setCarrito(prev=>prev.map(x=>x.tipo===l.tipo&&x.itemId===l.itemId?{...x,precioUnitario:Number(e.target.value)}:x))}/></span>}
                    {l.tipo === 'PRODUCTO' &&
                      stockPorProducto.has(l.itemId) &&
                      (() => {
                        const s = stockPorProducto.get(l.itemId)!;
                        return (
                          <span className={`ml-2 ${s.stock < l.cantidad ? 'font-medium text-danger-500' : ''}`}>
                            (stock: {s.stock})
                          </span>
                        );
                      })()}
                  </p>
                </div>
                <input
                  type="number"
                  min={1}
                  value={l.cantidad}
                  onChange={(e) => actualizarCantidad(l.tipo, l.itemId, Number(e.target.value))}
                  className="w-16 rounded-lg border border-ink-200 px-2 py-1 text-center text-sm"
                />
                <span className="w-20 text-right font-medium text-ink-700">
                  ${(calculo.data?.detalles[indice]?.total??0).toLocaleString('es-CO')}
                </span>
                <button onClick={() => quitarLinea(l.tipo, l.itemId)} className="text-ink-300 hover:text-danger-500">
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
                      actualizarDescuentoLinea(l.tipo, l.itemId, e.target.value ? Number(e.target.value) : null)
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
            {(['NINGUNO', 'LINEA', 'FACTURA'] as ModoDescuento[]).filter(m=>m==='NINGUNO'||permitido(sicom,'DESCUENTOS')).map((modo) => (
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

          {calculo.isFetching&&<p role="status" className="text-sm">Calculando total…</p>}
          {calculo.isError&&<p role="alert" className="text-sm text-danger-600">{getApiErrorMessage(calculo.error,'No se pudo calcular la venta')}</p>}
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
            {calculo.data&&calculo.data.modoImpuesto!=='DESACTIVADO'&&<><div className="flex justify-between"><span>Base neta</span><span>${calculo.data.baseImponible.toLocaleString('es-CO')}</span></div><div className="flex justify-between"><span>Impuestos {calculo.data.modoImpuesto==='INCLUIDO'?'incluidos':'adicionales'}</span><span>${calculo.data.impuestos.toLocaleString('es-CO')}</span></div></>}
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

          <div className="space-y-2 pt-2">
            <label className="block text-xs font-medium">Cliente {requiereCredito?'(obligatorio para crédito)':'(opcional)'}
              <select className="input mt-1" value={clienteId} onChange={e=>{setClienteId(e.target.value);setPuntosCanje(0);}}>
                <option value="">Consumidor final / sin cliente</option>
                {clientes?.map(c=><option key={c.id} value={c.id}>{c.nombre}{sicom?.fidelizacion_activa?` · ${c.puntosFidelizacion??0} puntos`:''}</option>)}
              </select>
            </label>
            {permitido(sicom,'REGISTRAR_CLIENTE')&&<button className="text-sm text-blue-700" onClick={()=>setRegistroRapido(!registroRapido)}>+ Registrar cliente rápidamente</button>}
            {registroRapido&&<div className="space-y-2 border rounded p-3"><label className="block text-xs">Nombre<input className="input" value={nombreRapido} onChange={e=>setNombreRapido(e.target.value)} maxLength={150}/></label><label className="block text-xs">Documento (opcional)<input className="input" value={documentoRapido} onChange={e=>setDocumentoRapido(e.target.value)} maxLength={30}/></label><label className="block text-xs">Teléfono (opcional)<input className="input" value={telefonoRapido} onChange={e=>setTelefonoRapido(e.target.value)} maxLength={30}/></label><button disabled={!nombreRapido.trim()||crearCliente.isPending} onClick={registrarClienteRapido} className="rounded bg-slate-800 text-white p-2">Guardar y seleccionar</button></div>}
            {sicom?.fidelizacion_activa&&clienteId&&<div className="border rounded p-3 text-xs"><p>Puntos disponibles: {clientes?.find(c=>String(c.id)===clienteId)?.puntosFidelizacion??0}</p><p>Esta compra suma {Math.floor(total/Number(sicom.pesos_por_punto))+Number(sicom.puntos_por_compra)} puntos.</p>{Number(sicom.valor_punto)>0&&modoDescuento==='NINGUNO'&&<label className="block mt-2">Puntos a canjear (mínimo {sicom.minimo_canje})<input className="input" type="number" min={0} max={clientes?.find(c=>String(c.id)===clienteId)?.puntosFidelizacion??0} step={1} value={puntosCanje} onChange={e=>setPuntosCanje(Math.max(0,Math.floor(Number(e.target.value)||0)))}/></label>}{valorCanje>0&&<p>Descuento por puntos: ${valorCanje.toLocaleString('es-CO')}</p>}</div>}
          </div>

          <label className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              checked={facturarVenta}
              onChange={(e) => setFacturarVenta(e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-xs text-ink-600">Generar factura formal para esta venta</span>
          </label>
        </div>

        {error && <div className="mt-3 rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}
        {ventaExitosa && (
          <div className="mt-3 space-y-2 rounded-lg bg-success-50 px-3 py-2.5 text-sm text-success-600">
            <p>{ventaExitosa}</p>
            {ultimaVenta && empresa && permitido(sicom,'REIMPRIMIR') && (
              <button
                onClick={() => abrirFactura(ultimaVenta, empresa)}
                className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-success-700 shadow-sm hover:bg-success-100"
              >
                <FileText size={14} />
                {ultimaVenta.numeroFactura ? 'Descargar factura' : 'Descargar comprobante'}
              </button>
            )}
          </div>
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
