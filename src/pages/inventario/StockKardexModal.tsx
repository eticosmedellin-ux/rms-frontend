import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useSucursales } from '@/hooks/useSucursales';
import { useStockPorProducto, useKardex, useRegistrarEntrada } from '@/hooks/useInventario';
import { getApiErrorMessage } from '@/api/errors';
import type { Producto } from '@/types/inventario';
import { Loader2, Plus } from 'lucide-react';
import { LoadingState, EmptyState } from '@/components/ui/States';

interface StockKardexModalProps {
  isOpen: boolean;
  onClose: () => void;
  producto: Producto | null;
}

const TIPO_LABELS: Record<string, { label: string; tone: string }> = {
  ENTRADA: { label: 'Entrada', tone: 'text-success-500' },
  SALIDA: { label: 'Salida', tone: 'text-danger-500' },
  AJUSTE_POSITIVO: { label: 'Ajuste (+)', tone: 'text-success-500' },
  AJUSTE_NEGATIVO: { label: 'Ajuste (-)', tone: 'text-danger-500' },
  TRANSFERENCIA_SALIDA: { label: 'Transferencia (salida)', tone: 'text-amber-500' },
  TRANSFERENCIA_ENTRADA: { label: 'Transferencia (entrada)', tone: 'text-amber-500' },
};

export function StockKardexModal({ isOpen, onClose, producto }: StockKardexModalProps) {
  const { data: sucursales } = useSucursales();
  const [sucursalId, setSucursalId] = useState<number | null>(null);
  const [mostrarFormEntrada, setMostrarFormEntrada] = useState(false);
  const [cantidad, setCantidad] = useState('');
  const [costoUnitario, setCostoUnitario] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: stocks, isLoading: cargandoStock } = useStockPorProducto(producto?.id ?? null);
  const { data: kardex, isLoading: cargandoKardex } = useKardex(producto?.id ?? null, sucursalId);
  const registrarEntrada = useRegistrarEntrada();

  const sucursalActiva = sucursalId ?? sucursales?.[0]?.id ?? null;

  useEffect(() => {
    if (sucursalId === null && sucursales && sucursales.length > 0) {
      setSucursalId(sucursales[0].id);
    }
  }, [sucursalId, sucursales]);

  async function handleRegistrarEntrada() {
    setError(null);
    if (!producto || !sucursalActiva) return;
    try {
      await registrarEntrada.mutateAsync({
        productoId: producto.id,
        sucursalId: sucursalActiva,
        cantidad: Number(cantidad),
        costoUnitario: Number(costoUnitario),
      });
      setCantidad('');
      setCostoUnitario('');
      setMostrarFormEntrada(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo registrar la entrada'));
    }
  }

  if (!producto) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Stock y kardex — ${producto.nombre}`} size="lg">
      <div className="space-y-5">
        {/* Selector de sucursal */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-ink-700">Sucursal:</label>
          <select
            className="input max-w-xs"
            value={sucursalActiva ?? ''}
            onChange={(e) => setSucursalId(Number(e.target.value))}
          >
            {sucursales?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Stock por sucursal */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-ink-700">Stock por sucursal</h3>
          {cargandoStock ? (
            <LoadingState label="Cargando stock…" />
          ) : stocks && stocks.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {stocks.map((s) => (
                <div
                  key={s.sucursalId}
                  className={`rounded-lg border p-3 ${
                    s.stockBajo ? 'border-amber-300 bg-amber-50' : 'border-ink-100 bg-white'
                  }`}
                >
                  <p className="text-xs text-ink-400">{s.sucursalNombre}</p>
                  <p className="font-display text-xl font-semibold text-ink-800">{s.stockActual}</p>
                  {s.stockBajo && <p className="text-xs font-medium text-amber-600">Stock bajo</p>}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Sin stock registrado" description="Registra una entrada para empezar." />
          )}
        </div>

        {/* Registrar entrada manual */}
        {!mostrarFormEntrada ? (
          <button
            onClick={() => setMostrarFormEntrada(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-ink-700 hover:text-ink-900"
          >
            <Plus size={16} />
            Registrar entrada manual
          </button>
        ) : (
          <div className="rounded-lg border border-ink-100 bg-ink-50 p-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-600">Cantidad</span>
                <input
                  type="number"
                  className="input"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-600">Costo unitario</span>
                <input
                  type="number"
                  className="input"
                  value={costoUnitario}
                  onChange={(e) => setCostoUnitario(e.target.value)}
                />
              </label>
            </div>
            {error && <p className="mt-2 text-xs text-danger-500">{error}</p>}
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => setMostrarFormEntrada(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-ink-500 hover:bg-ink-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegistrarEntrada}
                disabled={registrarEntrada.isPending || !cantidad || !costoUnitario}
                className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
              >
                {registrarEntrada.isPending && <Loader2 size={14} className="animate-spin" />}
                Confirmar entrada
              </button>
            </div>
          </div>
        )}

        {/* Kardex */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-ink-700">Kardex (movimientos)</h3>
          {cargandoKardex ? (
            <LoadingState label="Cargando kardex…" />
          ) : kardex && kardex.length > 0 ? (
            <div className="max-h-64 overflow-y-auto rounded-lg border border-ink-100">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-ink-50 text-xs text-ink-500">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Fecha</th>
                    <th className="px-3 py-2 text-left font-medium">Tipo</th>
                    <th className="px-3 py-2 text-right font-medium">Cantidad</th>
                    <th className="px-3 py-2 text-right font-medium">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-50">
                  {kardex.map((m) => (
                    <tr key={m.id}>
                      <td className="px-3 py-2 text-ink-500">
                        {new Date(m.fecha).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className={`px-3 py-2 font-medium ${TIPO_LABELS[m.tipoMovimiento]?.tone}`}>
                        {TIPO_LABELS[m.tipoMovimiento]?.label ?? m.tipoMovimiento}
                      </td>
                      <td className="px-3 py-2 text-right text-ink-700">{m.cantidad}</td>
                      <td className="px-3 py-2 text-right font-medium text-ink-800">{m.saldoResultante}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="Sin movimientos en esta sucursal" />
          )}
        </div>
      </div>
    </Modal>
  );
}
