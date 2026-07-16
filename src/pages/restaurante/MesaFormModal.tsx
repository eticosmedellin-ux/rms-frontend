import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useCrearMesa, useActualizarMesa } from '@/hooks/useRestaurante';
import { useSucursales } from '@/hooks/useSucursales';
import { getApiErrorMessage } from '@/api/errors';
import type { Mesa } from '@/api/restaurante';

export function MesaFormModal({ isOpen, onClose, mesa }: { isOpen: boolean; onClose: () => void; mesa: Mesa | null }) {
  const { data: sucursales } = useSucursales();
  const crear = useCrearMesa();
  const actualizar = useActualizarMesa();

  const [numero, setNumero] = useState('');
  const [zona, setZona] = useState('');
  const [capacidad, setCapacidad] = useState('');
  const [sucursalId, setSucursalId] = useState('');
  const [activa, setActiva] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNumero(mesa?.numero ?? '');
      setZona(mesa?.zona ?? '');
      setCapacidad(mesa?.capacidad != null ? String(mesa.capacidad) : '');
      setSucursalId(mesa?.sucursalId != null ? String(mesa.sucursalId) : sucursales?.[0] ? String(sucursales[0].id) : '');
      setActiva(mesa?.activa ?? true);
      setError(null);
    }
  }, [isOpen, mesa, sucursales]);

  async function handleGuardar() {
    setError(null);
    if (!numero.trim() || !sucursalId) {
      setError('El número de mesa y la sucursal son obligatorios');
      return;
    }
    const data = {
      numero,
      zona: zona || undefined,
      capacidad: capacidad ? Number(capacidad) : undefined,
      sucursalId: Number(sucursalId),
      activa,
    };
    try {
      if (mesa) {
        await actualizar.mutateAsync({ id: mesa.id, data });
      } else {
        await crear.mutateAsync(data);
      }
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo guardar la mesa'));
    }
  }

  const guardando = crear.isPending || actualizar.isPending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mesa ? 'Editar mesa' : 'Nueva mesa'} size="sm">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-600">Número</span>
            <input className="input" value={numero} onChange={(e) => setNumero(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-600">Zona (opcional)</span>
            <input className="input" value={zona} onChange={(e) => setZona(e.target.value)} placeholder="Terraza, salón..." />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-600">Capacidad</span>
            <input type="number" className="input" value={capacidad} onChange={(e) => setCapacidad(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-600">Sucursal</span>
            <select className="input" value={sucursalId} onChange={(e) => setSucursalId(e.target.value)}>
              {sucursales?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={activa} onChange={(e) => setActiva(e.target.checked)} />
          <span className="text-sm text-ink-700">Activa</span>
        </label>

        {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50">
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="flex items-center gap-2 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
          >
            {guardando && <Loader2 size={16} className="animate-spin" />}
            Guardar
          </button>
        </div>
      </div>
    </Modal>
  );
}
