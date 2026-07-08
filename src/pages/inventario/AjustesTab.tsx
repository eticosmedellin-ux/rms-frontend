import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAjustes, useCrearAjuste } from '@/hooks/useInventario';
import { useSucursales } from '@/hooks/useSucursales';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { Modal } from '@/components/ui/Modal';
import { DetalleLineasEditor, type LineaDetalle } from '@/components/ui/DetalleLineasEditor';
import { getApiErrorMessage } from '@/api/errors';
import { Loader2 } from 'lucide-react';

export function AjustesTab() {
  const { data: ajustes, isLoading } = useAjustes();
  const [modalAbierto, setModalAbierto] = useState(false);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink-400">
          {ajustes?.length ?? 0} ajuste{ajustes?.length === 1 ? '' : 's'} registrado{ajustes?.length === 1 ? '' : 's'}
        </p>
        <button
          onClick={() => setModalAbierto(true)}
          className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700"
        >
          <Plus size={16} />
          Nuevo ajuste
        </button>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : ajustes && ajustes.length > 0 ? (
        <div className="space-y-2">
          {ajustes.map((a) => (
            <div key={a.id} className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink-800">{a.motivo}</p>
                  <p className="text-xs text-ink-400">
                    {a.sucursal} · {a.usuario} · {new Date(a.fecha).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                    {a.origen === 'CONTEO_FISICO' && ' · Generado por conteo físico'}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {a.detalles.map((d, i) => (
                  <span
                    key={i}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      d.tipo === 'POSITIVO' ? 'bg-success-50 text-success-600' : 'bg-danger-50 text-danger-600'
                    }`}
                  >
                    {d.producto}: {d.tipo === 'POSITIVO' ? '+' : '-'}
                    {d.cantidad}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="Sin ajustes registrados" description="Úsalos para corregir mermas, daños o errores de conteo." />
      )}

      <AjusteFormModal isOpen={modalAbierto} onClose={() => setModalAbierto(false)} />
    </div>
  );
}

interface LineaAjuste extends LineaDetalle {
  tipo: 'POSITIVO' | 'NEGATIVO';
}

function AjusteFormModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data: sucursales } = useSucursales();
  const crear = useCrearAjuste();

  const [sucursalId, setSucursalId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [lineas, setLineas] = useState<LineaAjuste[]>([
    { productoId: '', cantidad: '', costoUnitario: '', tipo: 'NEGATIVO' },
  ]);
  const [error, setError] = useState<string | null>(null);

  function actualizarTipo(index: number, tipo: 'POSITIVO' | 'NEGATIVO') {
    setLineas((prev) => prev.map((l, i) => (i === index ? { ...l, tipo } : l)));
  }

  async function handleSubmit() {
    setError(null);
    const detallesValidos = lineas.filter((l) => l.productoId !== '' && l.cantidad !== '');
    if (!sucursalId || !motivo.trim() || detallesValidos.length === 0) {
      setError('Completa sucursal, motivo y al menos un producto');
      return;
    }

    try {
      await crear.mutateAsync({
        sucursalId: Number(sucursalId),
        motivo,
        detalles: detallesValidos.map((l) => ({
          productoId: Number(l.productoId),
          tipo: l.tipo,
          cantidad: Number(l.cantidad),
        })),
      });
      setSucursalId('');
      setMotivo('');
      setLineas([{ productoId: '', cantidad: '', costoUnitario: '', tipo: 'NEGATIVO' }]);
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo registrar el ajuste'));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo ajuste de inventario" size="lg">
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
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Motivo</span>
          <input
            className="input"
            placeholder="Ej: Producto vencido, error de conteo, daño en bodega…"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </label>

        <div>
          <DetalleLineasEditor
            lineas={lineas}
            onChange={(nuevas) => setLineas(nuevas.map((n, i) => ({ ...n, tipo: lineas[i]?.tipo ?? 'NEGATIVO' })))}
            mostrarCosto={false}
          />
          <div className="mt-2 space-y-1">
            {lineas.map((l, i) => (
              <label key={i} className="flex items-center gap-2 text-xs text-ink-600">
                <span>Línea {i + 1}:</span>
                <select
                  className="rounded border border-ink-200 px-2 py-1 text-xs"
                  value={l.tipo}
                  onChange={(e) => actualizarTipo(i, e.target.value as 'POSITIVO' | 'NEGATIVO')}
                >
                  <option value="NEGATIVO">Resta stock (merma, daño)</option>
                  <option value="POSITIVO">Suma stock (corrección a favor)</option>
                </select>
              </label>
            ))}
          </div>
        </div>

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
            Registrar ajuste
          </button>
        </div>
      </div>
    </Modal>
  );
}
