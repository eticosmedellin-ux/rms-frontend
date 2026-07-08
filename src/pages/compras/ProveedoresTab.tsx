import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useProveedores, useCrearProveedor } from '@/hooks/useCompras';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { Modal } from '@/components/ui/Modal';
import { getApiErrorMessage } from '@/api/errors';

export function ProveedoresTab() {
  const { data: proveedores, isLoading } = useProveedores();
  const [modalAbierto, setModalAbierto] = useState(false);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink-400">
          {proveedores?.length ?? 0} proveedor{proveedores?.length === 1 ? '' : 'es'} registrado
          {proveedores?.length === 1 ? '' : 's'}
        </p>
        <button
          onClick={() => setModalAbierto(true)}
          className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700"
        >
          <Plus size={16} />
          Nuevo proveedor
        </button>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : proveedores && proveedores.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs text-ink-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Nombre</th>
                <th className="px-4 py-3 text-left font-medium">NIT</th>
                <th className="px-4 py-3 text-left font-medium">Contacto</th>
                <th className="px-4 py-3 text-left font-medium">Teléfono</th>
                <th className="px-4 py-3 text-right font-medium">Días crédito</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {proveedores.map((p) => (
                <tr key={p.id} className="hover:bg-ink-50/60">
                  <td className="px-4 py-3 font-medium text-ink-800">{p.nombre}</td>
                  <td className="px-4 py-3 text-ink-500">{p.nit ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-500">{p.contactoNombre ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-500">{p.telefono ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-ink-700">{p.diasCredito}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="Todavía no tienes proveedores" description="Crea el primero para empezar a registrar compras." />
      )}

      <ProveedorFormModal isOpen={modalAbierto} onClose={() => setModalAbierto(false)} />
    </div>
  );
}

function ProveedorFormModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const crear = useCrearProveedor();
  const [nombre, setNombre] = useState('');
  const [nit, setNit] = useState('');
  const [contacto, setContacto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [diasCredito, setDiasCredito] = useState('0');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (!nombre.trim()) return;
    try {
      await crear.mutateAsync({
        nombre,
        nit: nit || undefined,
        contactoNombre: contacto || undefined,
        telefono: telefono || undefined,
        diasCredito: Number(diasCredito) || 0,
      });
      setNombre('');
      setNit('');
      setContacto('');
      setTelefono('');
      setDiasCredito('0');
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo guardar el proveedor'));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo proveedor">
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Nombre</span>
          <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">NIT</span>
            <input className="input" value={nit} onChange={(e) => setNit(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Días de crédito</span>
            <input
              type="number"
              className="input"
              value={diasCredito}
              onChange={(e) => setDiasCredito(e.target.value)}
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Contacto</span>
            <input className="input" value={contacto} onChange={(e) => setContacto(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Teléfono</span>
            <input className="input" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          </label>
        </div>

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
