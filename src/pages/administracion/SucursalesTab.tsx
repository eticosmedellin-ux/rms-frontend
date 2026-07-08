import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useSucursales } from '@/hooks/useSucursales';
import { useCrearSucursal } from '@/hooks/useNucleo';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { Modal } from '@/components/ui/Modal';
import { getApiErrorMessage } from '@/api/errors';

export function SucursalesTab() {
  const { data: sucursales, isLoading } = useSucursales();
  const [modalAbierto, setModalAbierto] = useState(false);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink-400">
          {sucursales?.length ?? 0} sucursal{sucursales?.length === 1 ? '' : 'es'}
        </p>
        <button
          onClick={() => setModalAbierto(true)}
          className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700"
        >
          <Plus size={16} />
          Nueva sucursal
        </button>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : sucursales && sucursales.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sucursales.map((s) => (
            <div key={s.id} className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
              <div className="flex items-center justify-between">
                <p className="font-display font-semibold text-ink-800">{s.nombre}</p>
                {s.esPrincipal && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    Principal
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-ink-500">{s.direccion ?? 'Sin dirección'}</p>
              <p className="text-sm text-ink-400">{s.telefono ?? '—'}</p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="Sin sucursales" />
      )}

      <SucursalFormModal isOpen={modalAbierto} onClose={() => setModalAbierto(false)} />
    </div>
  );
}

function SucursalFormModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const crear = useCrearSucursal();
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (!nombre.trim()) return;
    try {
      await crear.mutateAsync({ nombre, direccion: direccion || undefined, telefono: telefono || undefined });
      setNombre('');
      setDireccion('');
      setTelefono('');
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo crear la sucursal'));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva sucursal">
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Nombre</span>
          <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Dirección</span>
          <input className="input" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Teléfono</span>
          <input className="input" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        </label>

        {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={crear.isPending || !nombre.trim()}
            className="rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
          >
            Guardar
          </button>
        </div>
      </div>
    </Modal>
  );
}
