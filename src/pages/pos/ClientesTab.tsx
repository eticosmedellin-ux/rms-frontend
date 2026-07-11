import { useState } from 'react';
import { Plus, FileSpreadsheet } from 'lucide-react';
import { useClientes, useCrearCliente } from '@/hooks/usePos';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { Modal } from '@/components/ui/Modal';
import { getApiErrorMessage } from '@/api/errors';
import { useEmpresa } from '@/hooks/useGestion';
import { obtenerEstadoCuentaCliente } from '@/api/pos';
import { abrirEstadoCuenta } from '@/lib/estadoCuenta';
import type { Empresa } from '@/types/gestion';

export function ClientesTab() {
  const { data: clientes, isLoading } = useClientes();
  const { data: empresa } = useEmpresa();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cargandoEstadoId, setCargandoEstadoId] = useState<number | null>(null);

  async function verEstadoCuenta(clienteId: number, empresaActual: Empresa) {
    setCargandoEstadoId(clienteId);
    try {
      const estado = await obtenerEstadoCuentaCliente(clienteId);
      abrirEstadoCuenta(estado, empresaActual);
    } finally {
      setCargandoEstadoId(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink-400">
          {clientes?.length ?? 0} cliente{clientes?.length === 1 ? '' : 's'} registrado
          {clientes?.length === 1 ? '' : 's'}
        </p>
        <button
          onClick={() => setModalAbierto(true)}
          className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700"
        >
          <Plus size={16} />
          Nuevo cliente
        </button>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : clientes && clientes.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs text-ink-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Nombre</th>
                <th className="px-4 py-3 text-left font-medium">Documento</th>
                <th className="px-4 py-3 text-left font-medium">Teléfono</th>
                <th className="px-4 py-3 text-right font-medium">Límite crédito</th>
                <th className="px-4 py-3 text-right font-medium">Saldo pendiente</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {clientes.map((c) => (
                <tr key={c.id} className="hover:bg-ink-50/60">
                  <td className="px-4 py-3 font-medium text-ink-800">{c.nombre}</td>
                  <td className="px-4 py-3 text-ink-500">{c.documento ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-500">{c.telefono ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-ink-700">${c.limiteCredito.toLocaleString('es-CO')}</td>
                  <td className={`px-4 py-3 text-right font-medium ${c.saldoPendiente > 0 ? 'text-amber-600' : 'text-ink-700'}`}>
                    ${c.saldoPendiente.toLocaleString('es-CO')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {empresa && (
                      <button
                        onClick={() => verEstadoCuenta(c.id, empresa)}
                        disabled={cargandoEstadoId === c.id}
                        title="Ver / imprimir estado de cuenta"
                        className="inline-flex items-center gap-1 rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700 disabled:opacity-50"
                      >
                        <FileSpreadsheet size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="Todavía no tienes clientes" description="Crea el primero para poder venderle a crédito." />
      )}

      <ClienteFormModal isOpen={modalAbierto} onClose={() => setModalAbierto(false)} />
    </div>
  );
}

function ClienteFormModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const crear = useCrearCliente();
  const [nombre, setNombre] = useState('');
  const [documento, setDocumento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [limiteCredito, setLimiteCredito] = useState('0');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (!nombre.trim()) return;
    try {
      await crear.mutateAsync({
        nombre,
        documento: documento || undefined,
        telefono: telefono || undefined,
        limiteCredito: Number(limiteCredito) || 0,
      });
      setNombre('');
      setDocumento('');
      setTelefono('');
      setLimiteCredito('0');
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo guardar el cliente'));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo cliente">
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Nombre</span>
          <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Documento</span>
            <input className="input" value={documento} onChange={(e) => setDocumento(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Teléfono</span>
            <input className="input" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          </label>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Límite de crédito</span>
          <input type="number" className="input" value={limiteCredito} onChange={(e) => setLimiteCredito(e.target.value)} />
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
