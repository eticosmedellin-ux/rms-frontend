import { useEffect, useState } from 'react';
import { Plus, Pencil, AlertTriangle } from 'lucide-react';
import { useSucursales } from '@/hooks/useSucursales';
import { useCrearSucursal, useActualizarSucursal } from '@/hooks/useNucleo';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { Modal } from '@/components/ui/Modal';
import { getApiErrorMessage } from '@/api/errors';
import type { Sucursal } from '@/api/sucursales';

export function SucursalesTab() {
  const { data: sucursales, isLoading } = useSucursales();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Sucursal | null>(null);

  function abrirCrear() {
    setEditando(null);
    setModalAbierto(true);
  }

  function abrirEditar(s: Sucursal) {
    setEditando(s);
    setModalAbierto(true);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink-400">
          {sucursales?.length ?? 0} sucursal{sucursales?.length === 1 ? '' : 'es'}
        </p>
        <button
          onClick={abrirCrear}
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
                <div className="flex items-center gap-2">
                  {s.esPrincipal && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Principal
                    </span>
                  )}
                  <button
                    onClick={() => abrirEditar(s)}
                    title="Editar sucursal"
                    className="rounded-lg p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              </div>
              <p className="mt-1 text-sm text-ink-500">{s.direccion ?? 'Sin dirección'}</p>
              <p className="text-sm text-ink-400">{s.telefono ?? '—'}</p>

              <div className="mt-3 border-t border-ink-50 pt-2">
                {s.montoMaximoEfectivo ? (
                  <p className="flex items-center gap-1.5 text-xs text-ink-500">
                    <AlertTriangle size={12} className={s.alertaEfectivoActiva ? 'text-amber-500' : 'text-ink-300'} />
                    Máximo de efectivo: ${s.montoMaximoEfectivo.toLocaleString('es-CO')}
                    {!s.alertaEfectivoActiva && ' (alerta desactivada)'}
                  </p>
                ) : (
                  <p className="text-xs text-ink-300">Sin límite de efectivo configurado</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="Sin sucursales" />
      )}

      <SucursalFormModal isOpen={modalAbierto} onClose={() => setModalAbierto(false)} editando={editando} />
    </div>
  );
}

function SucursalFormModal({
  isOpen,
  onClose,
  editando,
}: {
  isOpen: boolean;
  onClose: () => void;
  editando: Sucursal | null;
}) {
  const crear = useCrearSucursal();
  const actualizar = useActualizarSucursal();
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [montoMaximoEfectivo, setMontoMaximoEfectivo] = useState('');
  const [alertaEfectivoActiva, setAlertaEfectivoActiva] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editando) {
      setNombre(editando.nombre);
      setDireccion(editando.direccion ?? '');
      setTelefono(editando.telefono ?? '');
      setMontoMaximoEfectivo(editando.montoMaximoEfectivo ? String(editando.montoMaximoEfectivo) : '');
      setAlertaEfectivoActiva(editando.alertaEfectivoActiva);
    } else {
      setNombre('');
      setDireccion('');
      setTelefono('');
      setMontoMaximoEfectivo('');
      setAlertaEfectivoActiva(true);
    }
    setError(null);
  }, [editando, isOpen]);

  async function handleSubmit() {
    setError(null);
    if (!nombre.trim()) return;

    const data = {
      nombre,
      direccion: direccion || undefined,
      telefono: telefono || undefined,
      montoMaximoEfectivo: montoMaximoEfectivo ? Number(montoMaximoEfectivo) : null,
      alertaEfectivoActiva,
    };

    try {
      if (editando) {
        await actualizar.mutateAsync({ id: editando.id, data });
      } else {
        await crear.mutateAsync(data);
      }
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo guardar la sucursal'));
    }
  }

  const pendiente = crear.isPending || actualizar.isPending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editando ? 'Editar sucursal' : 'Nueva sucursal'}>
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

        <div className="rounded-lg border border-ink-100 bg-ink-50/60 p-3">
          <p className="mb-2 text-xs font-medium text-ink-600">Control de efectivo en caja</p>
          <label className="block">
            <span className="mb-1.5 block text-xs text-ink-500">
              Monto máximo recomendado de efectivo (opcional)
            </span>
            <input
              type="number"
              min={0}
              className="input"
              placeholder="Ej: 500000"
              value={montoMaximoEfectivo}
              onChange={(e) => setMontoMaximoEfectivo(e.target.value)}
            />
          </label>
          <label className="mt-2 flex items-center gap-2">
            <input
              type="checkbox"
              checked={alertaEfectivoActiva}
              onChange={(e) => setAlertaEfectivoActiva(e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-xs text-ink-600">
              Avisar cuando el efectivo de esta sucursal alcance ese monto
            </span>
          </label>
          <p className="mt-1.5 text-xs text-ink-400">
            No limita las ventas — solo genera una alerta recomendando consignar o transferir el excedente.
          </p>
        </div>

        {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={pendiente || !nombre.trim()}
            className="rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
          >
            Guardar
          </button>
        </div>
      </div>
    </Modal>
  );
}
