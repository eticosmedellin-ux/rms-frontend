import { useEffect, useState } from 'react';
import { Plus, Loader2, Pencil, Tag } from 'lucide-react';
import {
  useTiposDescuento,
  useCrearTipoDescuento,
  useActualizarTipoDescuento,
  useDesactivarTipoDescuento,
  useReactivarTipoDescuento,
} from '@/hooks/useDescuentos';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { Modal } from '@/components/ui/Modal';
import { getApiErrorMessage } from '@/api/errors';
import type { TipoDescuento, TipoValorDescuento, AplicaDescuento } from '@/types/pos';

const APLICA_A_LABEL: Record<AplicaDescuento, string> = {
  LINEA: 'Por producto',
  FACTURA: 'De factura',
  AMBOS: 'Ambos',
};

export default function DescuentosPage() {
  const { data: tipos, isLoading } = useTiposDescuento();
  const desactivar = useDesactivarTipoDescuento();
  const reactivar = useReactivarTipoDescuento();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<TipoDescuento | null>(null);

  function abrirCrear() {
    setEditando(null);
    setModalAbierto(true);
  }

  function abrirEditar(t: TipoDescuento) {
    setEditando(t);
    setModalAbierto(true);
  }

  function formatearValor(t: TipoDescuento) {
    return t.tipo === 'PORCENTAJE' ? `${t.valor}%` : `$${t.valor.toLocaleString('es-CO')}`;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold text-ink-800">Descuentos</h1>
        <p className="mt-1 text-sm text-ink-400">
          Catálogo de descuentos que los cajeros pueden aplicar al vender. Ellos solo eligen de esta lista —
          nunca escriben un valor libre.
        </p>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink-400">
          {tipos?.length ?? 0} descuento{tipos?.length === 1 ? '' : 's'} registrado{tipos?.length === 1 ? '' : 's'}
        </p>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700"
        >
          <Plus size={16} />
          Nuevo descuento
        </button>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : tipos && tipos.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs text-ink-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Nombre</th>
                <th className="px-4 py-3 text-left font-medium">Valor</th>
                <th className="px-4 py-3 text-left font-medium">Aplica a</th>
                <th className="px-4 py-3 text-left font-medium">Vence</th>
                <th className="px-4 py-3 text-left font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {tipos.map((t) => (
                <tr key={t.id} className="hover:bg-ink-50/60">
                  <td className="px-4 py-3 font-medium text-ink-800">{t.nombre}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-600">{formatearValor(t)}</td>
                  <td className="px-4 py-3 text-ink-500">{APLICA_A_LABEL[t.aplicaA]}</td>
                  <td className="px-4 py-3 text-ink-500">{t.fechaVencimiento ?? 'Sin vencimiento'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        t.vigente ? 'bg-success-50 text-success-600' : 'bg-ink-100 text-ink-500'
                      }`}
                    >
                      {t.vigente ? 'Vigente' : t.estado ? 'Vencido' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => abrirEditar(t)}
                        title="Editar"
                        className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => (t.estado ? desactivar.mutate(t.id) : reactivar.mutate(t.id))}
                        className="text-xs font-medium text-ink-500 hover:text-ink-800"
                      >
                        {t.estado ? 'Desactivar' : 'Reactivar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="Sin descuentos registrados"
          description="Crea el primero para que los cajeros puedan usarlo al vender."
        />
      )}

      <DescuentoFormModal isOpen={modalAbierto} onClose={() => setModalAbierto(false)} editando={editando} />
    </div>
  );
}

function DescuentoFormModal({
  isOpen,
  onClose,
  editando,
}: {
  isOpen: boolean;
  onClose: () => void;
  editando: TipoDescuento | null;
}) {
  const crear = useCrearTipoDescuento();
  const actualizar = useActualizarTipoDescuento();

  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<TipoValorDescuento>('PORCENTAJE');
  const [valor, setValor] = useState('');
  const [aplicaA, setAplicaA] = useState<AplicaDescuento>('AMBOS');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editando) {
      setNombre(editando.nombre);
      setTipo(editando.tipo);
      setValor(String(editando.valor));
      setAplicaA(editando.aplicaA);
      setFechaVencimiento(editando.fechaVencimiento ?? '');
    } else {
      setNombre('');
      setTipo('PORCENTAJE');
      setValor('');
      setAplicaA('AMBOS');
      setFechaVencimiento('');
    }
    setError(null);
  }, [editando, isOpen]);

  async function handleSubmit() {
    setError(null);
    const valorNumerico = Number(valor);
    if (!nombre.trim() || !valorNumerico || valorNumerico <= 0) {
      setError('Completa el nombre y un valor mayor a cero');
      return;
    }
    if (tipo === 'PORCENTAJE' && valorNumerico > 100) {
      setError('Un descuento en porcentaje no puede superar el 100%');
      return;
    }

    const data = {
      nombre,
      tipo,
      valor: valorNumerico,
      aplicaA,
      fechaVencimiento: fechaVencimiento || undefined,
    };

    try {
      if (editando) {
        await actualizar.mutateAsync({ id: editando.id, data });
      } else {
        await crear.mutateAsync(data);
      }
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo guardar el descuento'));
    }
  }

  const pendiente = crear.isPending || actualizar.isPending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editando ? 'Editar descuento' : 'Nuevo descuento'} size="md">
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Nombre</span>
          <input
            className="input"
            placeholder="Ej: Descuento empleado, Promoción fin de semana…"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Valor</span>
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                className="input flex-1"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
              <select
                className="input w-24"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoValorDescuento)}
              >
                <option value="PORCENTAJE">%</option>
                <option value="MONTO">$</option>
              </select>
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Aplica a</span>
            <select className="input" value={aplicaA} onChange={(e) => setAplicaA(e.target.value as AplicaDescuento)}>
              <option value="AMBOS">Producto y factura</option>
              <option value="LINEA">Solo por producto</option>
              <option value="FACTURA">Solo factura completa</option>
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Fecha de vencimiento (opcional)</span>
          <input
            type="date"
            className="input"
            value={fechaVencimiento}
            onChange={(e) => setFechaVencimiento(e.target.value)}
          />
          <span className="mt-1 block text-xs text-ink-400">
            Si la dejas vacía, el descuento no vence — se puede usar mientras esté activo.
          </span>
        </label>

        {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={pendiente}
            className="flex items-center gap-2 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
          >
            {pendiente && <Loader2 size={16} className="animate-spin" />}
            <Tag size={16} />
            {editando ? 'Guardar cambios' : 'Crear descuento'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
