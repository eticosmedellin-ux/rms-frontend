import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useCrearPrestamo } from '@/hooks/usePrestamos';
import { useSucursales } from '@/hooks/useSucursales';
import { useClientes } from '@/hooks/usePos';
import { getApiErrorMessage } from '@/api/errors';
import type { FrecuenciaPrestamo } from '@/api/prestamos';

export function PrestamoFormModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data: sucursales } = useSucursales();
  const { data: clientes } = useClientes();
  const crear = useCrearPrestamo();

  const [clienteId, setClienteId] = useState('');
  const [sucursalId, setSucursalId] = useState('');
  const [montoPrincipal, setMontoPrincipal] = useState('');
  const [tasaInteres, setTasaInteres] = useState('');
  const [numeroCuotas, setNumeroCuotas] = useState('12');
  const [frecuenciaPago, setFrecuenciaPago] = useState<FrecuenciaPrestamo>('MENSUAL');
  const [fechaInicio, setFechaInicio] = useState(() => new Date().toISOString().slice(0, 10));
  const [notas, setNotas] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setClienteId('');
      setSucursalId(sucursales?.[0] ? String(sucursales[0].id) : '');
      setMontoPrincipal('');
      setTasaInteres('');
      setNumeroCuotas('12');
      setFrecuenciaPago('MENSUAL');
      setFechaInicio(new Date().toISOString().slice(0, 10));
      setNotas('');
      setError(null);
    }
  }, [isOpen, sucursales]);

  async function handleCrear() {
    setError(null);
    if (!clienteId || !sucursalId || !montoPrincipal || !numeroCuotas || !fechaInicio) {
      setError('Cliente, sucursal, monto, número de cuotas y fecha de inicio son obligatorios');
      return;
    }
    try {
      await crear.mutateAsync({
        clienteId: Number(clienteId),
        sucursalId: Number(sucursalId),
        montoPrincipal: Number(montoPrincipal),
        tasaInteres: tasaInteres ? Number(tasaInteres) : undefined,
        numeroCuotas: Number(numeroCuotas),
        frecuenciaPago,
        fechaInicio,
        notas: notas || undefined,
      });
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo crear el préstamo'));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo préstamo" size="md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-600">Cliente</span>
            <select className="input" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
              <option value="">Elegir...</option>
              {clientes?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
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
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-600">Monto del préstamo</span>
            <input type="number" className="input" value={montoPrincipal} onChange={(e) => setMontoPrincipal(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-600">Tasa de interés % (opcional)</span>
            <input type="number" className="input" value={tasaInteres} onChange={(e) => setTasaInteres(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-600">Número de cuotas</span>
            <input type="number" min={1} className="input" value={numeroCuotas} onChange={(e) => setNumeroCuotas(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-600">Frecuencia de pago</span>
            <select className="input" value={frecuenciaPago} onChange={(e) => setFrecuenciaPago(e.target.value as FrecuenciaPrestamo)}>
              <option value="MENSUAL">Mensual</option>
              <option value="QUINCENAL">Quincenal</option>
              <option value="SEMANAL">Semanal</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-600">Fecha de inicio</span>
            <input type="date" className="input" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-600">Notas (opcional)</span>
          <input className="input" value={notas} onChange={(e) => setNotas(e.target.value)} />
        </label>

        {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50">
            Cancelar
          </button>
          <button
            onClick={handleCrear}
            disabled={crear.isPending}
            className="flex items-center gap-2 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
          >
            {crear.isPending && <Loader2 size={16} className="animate-spin" />}
            Crear préstamo
          </button>
        </div>
      </div>
    </Modal>
  );
}
