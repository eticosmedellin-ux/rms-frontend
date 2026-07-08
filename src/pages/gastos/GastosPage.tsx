import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useGastos, useCategoriasGasto, useCrearCategoriaGasto, useRegistrarGasto } from '@/hooks/useGestion';
import { useSucursales } from '@/hooks/useSucursales';
import { usePosStore } from '@/stores/posStore';
import { useCajaAbierta } from '@/hooks/usePos';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { Modal } from '@/components/ui/Modal';
import { getApiErrorMessage } from '@/api/errors';
import { Loader2 } from 'lucide-react';

export default function GastosPage() {
  const { data: gastos, isLoading } = useGastos();
  const [modalAbierto, setModalAbierto] = useState(false);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-800">Gastos</h1>
          <p className="mt-1 text-sm text-ink-400">Gastos operativos y administrativos del negocio.</p>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700"
        >
          <Plus size={16} />
          Registrar gasto
        </button>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : gastos && gastos.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs text-ink-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Concepto</th>
                <th className="px-4 py-3 text-left font-medium">Categoría</th>
                <th className="px-4 py-3 text-left font-medium">Sucursal</th>
                <th className="px-4 py-3 text-left font-medium">Método</th>
                <th className="px-4 py-3 text-right font-medium">Monto</th>
                <th className="px-4 py-3 text-left font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {gastos.map((g) => (
                <tr key={g.id} className="hover:bg-ink-50/60">
                  <td className="px-4 py-3 font-medium text-ink-800">{g.concepto}</td>
                  <td className="px-4 py-3 text-ink-500">{g.categoriaGasto}</td>
                  <td className="px-4 py-3 text-ink-500">{g.sucursal}</td>
                  <td className="px-4 py-3 text-ink-500">{g.metodoPago}</td>
                  <td className="px-4 py-3 text-right font-medium text-ink-800">${g.monto.toLocaleString('es-CO')}</td>
                  <td className="px-4 py-3 text-ink-500">
                    {new Date(g.fecha).toLocaleDateString('es-CO')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="Sin gastos registrados todavía" />
      )}

      <GastoFormModal isOpen={modalAbierto} onClose={() => setModalAbierto(false)} />
    </div>
  );
}

function GastoFormModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data: sucursales } = useSucursales();
  const { data: categorias } = useCategoriasGasto();
  const crearCategoria = useCrearCategoriaGasto();
  const registrar = useRegistrarGasto();
  const { sucursalId: sucursalPos } = usePosStore();
  const { data: caja } = useCajaAbierta(sucursalPos);

  const [sucursalId, setSucursalId] = useState('');
  const [categoriaGastoId, setCategoriaGastoId] = useState('');
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [error, setError] = useState<string | null>(null);

  async function handleAgregarCategoria() {
    if (!nuevaCategoria.trim()) return;
    const categoria = await crearCategoria.mutateAsync({ nombre: nuevaCategoria.trim(), tipo: 'OPERATIVO' });
    setCategoriaGastoId(String(categoria.id));
    setNuevaCategoria('');
  }

  async function handleSubmit() {
    setError(null);
    if (!sucursalId || !categoriaGastoId || !concepto.trim() || !monto) {
      setError('Completa todos los campos');
      return;
    }

    const usarCaja = metodoPago === 'EFECTIVO' && caja && Number(sucursalId) === sucursalPos;

    try {
      await registrar.mutateAsync({
        sucursalId: Number(sucursalId),
        categoriaGastoId: Number(categoriaGastoId),
        concepto,
        monto: Number(monto),
        metodoPago,
        cajaSesionId: usarCaja ? caja!.id : undefined,
      });
      setConcepto('');
      setMonto('');
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo registrar el gasto'));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar gasto">
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Sucursal</span>
          <select className="input" value={sucursalId} onChange={(e) => setSucursalId(e.target.value)}>
            <option value="">Selecciona…</option>
            {sucursales?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Categoría</span>
          <div className="flex gap-2">
            <select className="input" value={categoriaGastoId} onChange={(e) => setCategoriaGastoId(e.target.value)}>
              <option value="">Selecciona…</option>
              {categorias?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-2 flex gap-2">
            <input
              className="input"
              placeholder="O crea una categoría nueva…"
              value={nuevaCategoria}
              onChange={(e) => setNuevaCategoria(e.target.value)}
            />
            <button
              type="button"
              onClick={handleAgregarCategoria}
              className="rounded-lg bg-ink-100 px-3 text-sm font-medium text-ink-700 hover:bg-ink-200"
            >
              <Plus size={16} />
            </button>
          </div>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Concepto</span>
          <input className="input" value={concepto} onChange={(e) => setConcepto(e.target.value)} />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Monto</span>
            <input type="number" className="input" value={monto} onChange={(e) => setMonto(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Método de pago</span>
            <select className="input" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="TARJETA">Tarjeta</option>
            </select>
          </label>
        </div>

        {metodoPago === 'EFECTIVO' && (!caja || Number(sucursalId) !== sucursalPos) && sucursalId && (
          <p className="text-xs text-amber-600">
            No hay una caja abierta para esta sucursal en el POS — el gasto se registrará sin afectar caja.
          </p>
        )}

        {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={registrar.isPending}
            className="flex items-center gap-2 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
          >
            {registrar.isPending && <Loader2 size={16} className="animate-spin" />}
            Guardar
          </button>
        </div>
      </div>
    </Modal>
  );
}
