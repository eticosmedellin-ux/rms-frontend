import { useEffect, useState } from 'react';
import { Loader2, Ban } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useCrearCita, useActualizarCita, useCambiarEstadoCita, useTiposServicio } from '@/hooks/useServicios';
import { useSucursales } from '@/hooks/useSucursales';
import { useClientes } from '@/hooks/usePos';
import { useUsuarios } from '@/hooks/useNucleo';
import { getApiErrorMessage } from '@/api/errors';
import type { Cita } from '@/api/servicios';

function aInputDatetimeLocal(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CitaFormModal({ isOpen, onClose, cita }: { isOpen: boolean; onClose: () => void; cita: Cita | null }) {
  const { data: sucursales } = useSucursales();
  const { data: tiposServicio } = useTiposServicio();
  const { data: clientes } = useClientes();
  const { data: usuarios } = useUsuarios();
  const crear = useCrearCita();
  const actualizar = useActualizarCita();
  const cambiarEstado = useCambiarEstadoCita();

  const [sucursalId, setSucursalId] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [tipoServicioId, setTipoServicioId] = useState('');
  const [asignadoAId, setAsignadoAId] = useState('');
  const [fechaHora, setFechaHora] = useState('');
  const [duracionMinutos, setDuracionMinutos] = useState('30');
  const [notas, setNotas] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSucursalId(cita?.sucursalId != null ? String(cita.sucursalId) : sucursales?.[0] ? String(sucursales[0].id) : '');
      setClienteId(cita?.clienteId != null ? String(cita.clienteId) : '');
      setTipoServicioId(cita?.tipoServicioId != null ? String(cita.tipoServicioId) : '');
      setAsignadoAId(cita?.asignadoAId != null ? String(cita.asignadoAId) : '');
      setFechaHora(aInputDatetimeLocal(cita?.fechaHora ?? null));
      setDuracionMinutos(cita?.duracionMinutos != null ? String(cita.duracionMinutos) : '30');
      setNotas(cita?.notas ?? '');
      setError(null);
    }
  }, [isOpen, cita, sucursales]);

  async function handleGuardar() {
    setError(null);
    if (!sucursalId || !fechaHora) {
      setError('Sucursal y fecha/hora son obligatorios');
      return;
    }
    const data = {
      sucursalId: Number(sucursalId),
      clienteId: clienteId ? Number(clienteId) : undefined,
      tipoServicioId: tipoServicioId ? Number(tipoServicioId) : undefined,
      asignadoAUsuarioId: asignadoAId ? Number(asignadoAId) : undefined,
      fechaHora: new Date(fechaHora).toISOString(),
      duracionMinutos: Number(duracionMinutos) || 30,
      notas: notas || undefined,
    };
    try {
      if (cita) {
        await actualizar.mutateAsync({ id: cita.id, data });
      } else {
        await crear.mutateAsync(data);
      }
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo guardar la cita'));
    }
  }

  async function handleCancelar() {
    if (!cita) return;
    try {
      await cambiarEstado.mutateAsync({ id: cita.id, estado: 'CANCELADA' });
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo cancelar la cita'));
    }
  }

  const guardando = crear.isPending || actualizar.isPending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={cita ? 'Editar cita' : 'Nueva cita'} size="md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
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
            <span className="mb-1 block text-xs font-medium text-ink-600">Cliente (opcional)</span>
            <select className="input" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
              <option value="">Sin cliente</option>
              {clientes?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-600">Tipo de servicio</span>
            <select className="input" value={tipoServicioId} onChange={(e) => setTipoServicioId(e.target.value)}>
              <option value="">Sin especificar</option>
              {tiposServicio?.filter((t) => t.activo).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-600">Asignado a</span>
            <select className="input" value={asignadoAId} onChange={(e) => setAsignadoAId(e.target.value)}>
              <option value="">Sin asignar</option>
              {usuarios?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre} {u.apellido ?? ''}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-600">Fecha y hora</span>
            <input type="datetime-local" className="input" value={fechaHora} onChange={(e) => setFechaHora(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-600">Duración (min)</span>
            <input type="number" className="input" value={duracionMinutos} onChange={(e) => setDuracionMinutos(e.target.value)} />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-600">Notas (opcional)</span>
          <input className="input" value={notas} onChange={(e) => setNotas(e.target.value)} />
        </label>

        {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}

        <div className="flex items-center justify-between pt-2">
          {cita && cita.estado !== 'CANCELADA' && cita.estado !== 'COMPLETADA' ? (
            <button
              onClick={handleCancelar}
              className="flex items-center gap-1.5 text-xs font-medium text-danger-500 hover:text-danger-600"
            >
              <Ban size={14} />
              Cancelar cita
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50">
              Cerrar
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
      </div>
    </Modal>
  );
}
