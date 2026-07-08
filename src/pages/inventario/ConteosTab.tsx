import { useState } from 'react';
import { Plus, CheckCircle2, Loader2 } from 'lucide-react';
import { useConteos, useIniciarConteo, useCerrarConteo, useProductos } from '@/hooks/useInventario';
import { useSucursales } from '@/hooks/useSucursales';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { Modal } from '@/components/ui/Modal';
import { getApiErrorMessage } from '@/api/errors';
import type { ConteoFisico } from '@/types/inventario';

export function ConteosTab() {
  const { data: conteos, isLoading } = useConteos();
  const [modalIniciarAbierto, setModalIniciarAbierto] = useState(false);
  const [conteoCerrando, setConteoCerrando] = useState<ConteoFisico | null>(null);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink-400">
          {conteos?.length ?? 0} conteo{conteos?.length === 1 ? '' : 's'} registrado{conteos?.length === 1 ? '' : 's'}
        </p>
        <button
          onClick={() => setModalIniciarAbierto(true)}
          className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700"
        >
          <Plus size={16} />
          Iniciar conteo
        </button>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : conteos && conteos.length > 0 ? (
        <div className="space-y-2">
          {conteos.map((c) => (
            <div key={c.id} className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink-800">
                    {c.sucursal} · {c.detalles.length} producto{c.detalles.length === 1 ? '' : 's'}
                  </p>
                  <p className="text-xs text-ink-400">
                    {c.usuario} · iniciado{' '}
                    {new Date(c.fechaInicio).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      c.estado === 'EN_PROCESO' ? 'bg-amber-100 text-amber-700' : 'bg-success-50 text-success-600'
                    }`}
                  >
                    {c.estado === 'EN_PROCESO' ? 'En proceso' : 'Cerrado'}
                  </span>
                  {c.estado === 'EN_PROCESO' && (
                    <button
                      onClick={() => setConteoCerrando(c)}
                      title="Cerrar conteo"
                      className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                    >
                      <CheckCircle2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Sin conteos físicos"
          description="Úsalos para hacer inventario físico periódico y detectar diferencias contra el sistema."
        />
      )}

      <IniciarConteoModal isOpen={modalIniciarAbierto} onClose={() => setModalIniciarAbierto(false)} />
      <CerrarConteoModal
        isOpen={conteoCerrando !== null}
        onClose={() => setConteoCerrando(null)}
        conteo={conteoCerrando}
      />
    </div>
  );
}

function IniciarConteoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data: sucursales } = useSucursales();
  const { data: productos } = useProductos();
  const iniciar = useIniciarConteo();

  const [sucursalId, setSucursalId] = useState('');
  const [productoIds, setProductoIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  function toggleProducto(id: number) {
    setProductoIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  function seleccionarTodos() {
    setProductoIds(productos?.map((p) => p.id) ?? []);
  }

  async function handleSubmit() {
    setError(null);
    if (!sucursalId || productoIds.length === 0) {
      setError('Selecciona la sucursal y al menos un producto a contar');
      return;
    }
    try {
      await iniciar.mutateAsync({ sucursalId: Number(sucursalId), productoIds });
      setSucursalId('');
      setProductoIds([]);
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo iniciar el conteo'));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Iniciar conteo físico" size="lg">
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

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-medium text-ink-700">Productos a contar</span>
            <button onClick={seleccionarTodos} className="text-xs font-medium text-ink-500 hover:text-ink-800">
              Seleccionar todos
            </button>
          </div>
          <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-ink-100 p-2">
            {productos?.map((p) => (
              <label key={p.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-ink-50">
                <input type="checkbox" checked={productoIds.includes(p.id)} onChange={() => toggleProducto(p.id)} />
                {p.nombre}
              </label>
            ))}
          </div>
        </div>

        <p className="text-xs text-ink-400">
          El stock actual del sistema queda "congelado" en este momento para cada producto seleccionado — así comparamos
          contra lo que se cuente físicamente al cerrar, sin que ventas posteriores alteren la comparación.
        </p>

        {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={iniciar.isPending}
            className="flex items-center gap-2 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
          >
            {iniciar.isPending && <Loader2 size={16} className="animate-spin" />}
            Iniciar conteo
          </button>
        </div>
      </div>
    </Modal>
  );
}

function CerrarConteoModal({
  isOpen,
  onClose,
  conteo,
}: {
  isOpen: boolean;
  onClose: () => void;
  conteo: ConteoFisico | null;
}) {
  const cerrar = useCerrarConteo();
  const [cantidades, setCantidades] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  if (!conteo) return null;

  function valorActual(productoId: number, cantidadSistema: number): string {
    return cantidades[productoId] ?? String(cantidadSistema);
  }

  async function handleSubmit() {
    setError(null);
    if (!conteo) return;
    try {
      await cerrar.mutateAsync({
        id: conteo.id,
        data: {
          conteos: conteo.detalles.map((d) => ({
            productoId: d.productoId,
            cantidadContada: Number(valorActual(d.productoId, d.cantidadSistema)),
          })),
        },
      });
      setCantidades({});
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo cerrar el conteo'));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Cerrar conteo — ${conteo.sucursal}`} size="lg">
      <div className="space-y-4">
        <p className="text-sm text-ink-500">
          Ingresa lo que contaste físicamente de cada producto. Si difiere del sistema, se genera un ajuste automático.
        </p>

        <div className="max-h-72 overflow-y-auto rounded-lg border border-ink-100">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-ink-50 text-xs text-ink-500">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Producto</th>
                <th className="px-3 py-2 text-right font-medium">Sistema</th>
                <th className="px-3 py-2 text-right font-medium">Contado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {conteo.detalles.map((d) => (
                <tr key={d.productoId}>
                  <td className="px-3 py-2 text-ink-700">{d.producto}</td>
                  <td className="px-3 py-2 text-right text-ink-500">{d.cantidadSistema}</td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      className="w-24 rounded-lg border border-ink-200 px-2 py-1 text-right text-sm"
                      value={valorActual(d.productoId, d.cantidadSistema)}
                      onChange={(e) => setCantidades((prev) => ({ ...prev, [d.productoId]: e.target.value }))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={cerrar.isPending}
            className="flex items-center gap-2 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
          >
            {cerrar.isPending && <Loader2 size={16} className="animate-spin" />}
            Cerrar conteo
          </button>
        </div>
      </div>
    </Modal>
  );
}
