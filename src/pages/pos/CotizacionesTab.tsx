import { useState } from 'react';
import { Plus, ArrowRightCircle, Loader2, FileText } from 'lucide-react';
import { useCotizaciones, useCrearCotizacion, useConvertirCotizacion } from '@/hooks/usePos';
import { useClientes } from '@/hooks/usePos';
import { useCajaAbierta } from '@/hooks/usePos';
import { useEmpresa } from '@/hooks/useGestion';
import { usePosStore } from '@/stores/posStore';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { Modal } from '@/components/ui/Modal';
import { DetalleLineasEditor, type LineaDetalle } from '@/components/ui/DetalleLineasEditor';
import { getApiErrorMessage } from '@/api/errors';
import { abrirCotizacion } from '@/lib/cotizacion';
import type { Cotizacion, EstadoCotizacion, MetodoPagoVenta } from '@/types/pos';

const ESTADO_STYLES: Record<EstadoCotizacion, string> = {
  VIGENTE: 'bg-amber-100 text-amber-700',
  CONVERTIDA: 'bg-success-50 text-success-600',
  VENCIDA: 'bg-ink-100 text-ink-500',
  CANCELADA: 'bg-danger-50 text-danger-600',
};

export function CotizacionesTab() {
  const { data: cotizaciones, isLoading } = useCotizaciones();
  const { data: empresa } = useEmpresa();
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [cotizacionConvirtiendo, setCotizacionConvirtiendo] = useState<Cotizacion | null>(null);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink-400">
          {cotizaciones?.length ?? 0} cotizaci{cotizaciones?.length === 1 ? 'ón' : 'ones'}
        </p>
        <button
          onClick={() => setModalCrearAbierto(true)}
          className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700"
        >
          <Plus size={16} />
          Nueva cotización
        </button>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : cotizaciones && cotizaciones.length > 0 ? (
        <div className="space-y-2">
          {cotizaciones.map((c) => (
            <div key={c.id} className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink-800">{c.cliente ?? 'Cliente mostrador'}</p>
                  <p className="text-xs text-ink-400">
                    {c.detalles.map((d) => `${d.producto} (${d.cantidad})`).join(', ')}
                  </p>
                  {c.validaHasta && <p className="text-xs text-ink-400">Válida hasta: {c.validaHasta}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_STYLES[c.estado]}`}>
                    {c.estado}
                  </span>
                  {empresa && (
                    <button
                      onClick={() => abrirCotizacion(c, empresa)}
                      title="Descargar / imprimir cotización"
                      className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                    >
                      <FileText size={18} />
                    </button>
                  )}
                  {c.estado === 'VIGENTE' && (
                    <button
                      onClick={() => setCotizacionConvirtiendo(c)}
                      title="Convertir en venta"
                      className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                    >
                      <ArrowRightCircle size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="Sin cotizaciones" description="Arma una propuesta de precio sin afectar stock ni caja." />
      )}

      <CotizacionFormModal isOpen={modalCrearAbierto} onClose={() => setModalCrearAbierto(false)} />
      <ConvertirCotizacionModal
        isOpen={cotizacionConvirtiendo !== null}
        onClose={() => setCotizacionConvirtiendo(null)}
        cotizacion={cotizacionConvirtiendo}
      />
    </div>
  );
}

function CotizacionFormModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { sucursalId } = usePosStore();
  const { data: clientes } = useClientes();
  const crear = useCrearCotizacion();

  const [clienteId, setClienteId] = useState('');
  const [validaHasta, setValidaHasta] = useState('');
  const [lineas, setLineas] = useState<LineaDetalle[]>([{ productoId: '', cantidad: '', costoUnitario: '' }]);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (!sucursalId) {
      setError('Selecciona una sucursal en la barra de arriba (Punto de venta) primero');
      return;
    }
    const detallesValidos = lineas.filter((l) => l.productoId !== '' && l.cantidad !== '' && l.costoUnitario !== '');
    if (detallesValidos.length === 0) {
      setError('Agrega al menos un producto con cantidad y precio');
      return;
    }

    try {
      await crear.mutateAsync({
        sucursalId,
        clienteId: clienteId ? Number(clienteId) : undefined,
        validaHasta: validaHasta || undefined,
        detalles: detallesValidos.map((l) => ({
          productoId: Number(l.productoId),
          cantidad: Number(l.cantidad),
          precioUnitario: Number(l.costoUnitario),
        })),
      });
      setClienteId('');
      setValidaHasta('');
      setLineas([{ productoId: '', cantidad: '', costoUnitario: '' }]);
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo crear la cotización'));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva cotización" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Cliente (opcional)</span>
            <select className="input" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
              <option value="">Sin cliente</option>
              {clientes?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Válida hasta (opcional)</span>
            <input type="date" className="input" value={validaHasta} onChange={(e) => setValidaHasta(e.target.value)} />
          </label>
        </div>

        <DetalleLineasEditor lineas={lineas} onChange={setLineas} labelCantidad="Cantidad" />
        <p className="text-xs text-ink-400">La columna "Costo unit." aquí representa el precio de venta cotizado.</p>

        {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={crear.isPending}
            className="flex items-center gap-2 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
          >
            {crear.isPending && <Loader2 size={16} className="animate-spin" />}
            Crear cotización
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ConvertirCotizacionModal({
  isOpen,
  onClose,
  cotizacion,
}: {
  isOpen: boolean;
  onClose: () => void;
  cotizacion: Cotizacion | null;
}) {
  const { sucursalId } = usePosStore();
  const { data: caja } = useCajaAbierta(sucursalId);
  const convertir = useConvertirCotizacion();
  const [metodoPago, setMetodoPago] = useState<MetodoPagoVenta>('EFECTIVO');
  const [error, setError] = useState<string | null>(null);

  if (!cotizacion) return null;

  const total = cotizacion.detalles.reduce((acc, d) => acc + d.cantidad * d.precioUnitario, 0);

  async function handleSubmit() {
    setError(null);
    if (!cotizacion) return;
    if (!caja) {
      setError('No hay una caja abierta en la sucursal seleccionada del POS');
      return;
    }

    try {
      await convertir.mutateAsync({
        id: cotizacion.id,
        data: { cajaSesionId: caja.id, pagos: [{ metodoPago, monto: total }] },
      });
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo convertir la cotización'));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Convertir cotización en venta" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-ink-600">
          Total: <span className="font-semibold text-ink-800">${total.toLocaleString('es-CO')}</span>
        </p>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Método de pago</span>
          <select className="input" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value as MetodoPagoVenta)}>
            <option value="EFECTIVO">Efectivo</option>
            <option value="TARJETA">Tarjeta</option>
            <option value="TRANSFERENCIA">Transferencia</option>
            <option value="CREDITO">Crédito</option>
          </select>
        </label>

        {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={convertir.isPending}
            className="flex items-center gap-2 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
          >
            {convertir.isPending && <Loader2 size={16} className="animate-spin" />}
            Confirmar venta
          </button>
        </div>
      </div>
    </Modal>
  );
}
