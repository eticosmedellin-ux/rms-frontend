import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useCrearOrden, useActualizarOrden, useCambiarEstadoOrden } from '@/hooks/useServicios';
import { useSucursales } from '@/hooks/useSucursales';
import { useClientes } from '@/hooks/usePos';
import { useUsuarios } from '@/hooks/useNucleo';
import { getApiErrorMessage } from '@/api/errors';
import type { OrdenTrabajo, PrioridadOrden } from '@/api/servicios';

export function OrdenTrabajoFormModal({
  isOpen,
  onClose,
  orden,
}: {
  isOpen: boolean;
  onClose: () => void;
  orden: OrdenTrabajo | null;
}) {
  const { data: sucursales } = useSucursales();
  const { data: clientes } = useClientes();
  const { data: usuarios } = useUsuarios();
  const crear = useCrearOrden();
  const actualizar = useActualizarOrden();
  const cambiarEstado = useCambiarEstadoOrden();

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [sucursalId, setSucursalId] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [asignadoAId, setAsignadoAId] = useState('');
  const [prioridad, setPrioridad] = useState<PrioridadOrden>('MEDIA');
  const [fechaEstimadaEntrega, setFechaEstimadaEntrega] = useState('');
  const [costoEstimado, setCostoEstimado] = useState('');
  const [notas, setNotas] = useState('');
  const [costoFinal, setCostoFinal] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitulo(orden?.titulo ?? '');
      setDescripcion(orden?.descripcion ?? '');
      setSucursalId(orden?.sucursalId != null ? String(orden.sucursalId) : sucursales?.[0] ? String(sucursales[0].id) : '');
      setClienteId(orden?.clienteId != null ? String(orden.clienteId) : '');
      setAsignadoAId(orden?.asignadoAId != null ? String(orden.asignadoAId) : '');
      setPrioridad(orden?.prioridad ?? 'MEDIA');
      setFechaEstimadaEntrega(orden?.fechaEstimadaEntrega ?? '');
      setCostoEstimado(orden?.costoEstimado != null ? String(orden.costoEstimado) : '');
      setCostoFinal(orden?.costoFinal != null ? String(orden.costoFinal) : orden?.costoEstimado != null ? String(orden.costoEstimado) : '');
      setNotas(orden?.notas ?? '');
      setError(null);
    }
  }, [isOpen, orden, sucursales]);

  async function handleGuardar() {
    setError(null);
    if (!titulo.trim() || !sucursalId) {
      setError('Título y sucursal son obligatorios');
      return;
    }
    const data = {
      titulo,
      descripcion: descripcion || undefined,
      sucursalId: Number(sucursalId),
      clienteId: clienteId ? Number(clienteId) : undefined,
      asignadoAUsuarioId: asignadoAId ? Number(asignadoAId) : undefined,
      prioridad,
      fechaEstimadaEntrega: fechaEstimadaEntrega || undefined,
      costoEstimado: costoEstimado ? Number(costoEstimado) : undefined,
      notas: notas || undefined,
    };
    try {
      if (orden) {
        await actualizar.mutateAsync({ id: orden.id, data });
      } else {
        await crear.mutateAsync(data);
      }
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo guardar la orden'));
    }
  }

  async function handleEntregar() {
    if (!orden) return;
    setError(null);
    try {
      await cambiarEstado.mutateAsync({
        id: orden.id,
        data: { estado: 'ENTREGADA', costoFinal: costoFinal ? Number(costoFinal) : undefined },
      });
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo marcar como entregada'));
    }
  }

  const guardando = crear.isPending || actualizar.isPending;
  const puedeEntregar = orden && orden.estado !== 'ENTREGADA' && orden.estado !== 'CANCELADA';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={orden ? 'Editar orden de trabajo' : 'Nueva orden de trabajo'} size="md">
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-600">Título</span>
          <input className="input" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-600">Descripción (opcional)</span>
          <textarea className="input" rows={2} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </label>

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
            <span className="mb-1 block text-xs font-medium text-ink-600">Prioridad</span>
            <select className="input" value={prioridad} onChange={(e) => setPrioridad(e.target.value as PrioridadOrden)}>
              <option value="BAJA">Baja</option>
              <option value="MEDIA">Media</option>
              <option value="ALTA">Alta</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-600">Entrega estimada</span>
            <input type="date" className="input" value={fechaEstimadaEntrega} onChange={(e) => setFechaEstimadaEntrega(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-600">Costo estimado</span>
            <input type="number" className="input" value={costoEstimado} onChange={(e) => setCostoEstimado(e.target.value)} />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-600">Notas (opcional)</span>
          <input className="input" value={notas} onChange={(e) => setNotas(e.target.value)} />
        </label>

        {puedeEntregar && (
          <div className="rounded-lg border border-success-200 bg-success-50/60 p-3">
            <p className="mb-2 text-xs font-semibold text-success-700">Marcar como entregada</p>
            <div className="flex items-end gap-2">
              <label className="block flex-1">
                <span className="mb-1 block text-[11px] font-medium text-ink-500">Costo final cobrado</span>
                <input type="number" className="input text-sm" value={costoFinal} onChange={(e) => setCostoFinal(e.target.value)} />
              </label>
              <button
                onClick={handleEntregar}
                disabled={cambiarEstado.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-success-600 px-3 py-2 text-xs font-semibold text-white hover:bg-success-700 disabled:opacity-60"
              >
                {cambiarEstado.isPending && <Loader2 size={13} className="animate-spin" />}
                <CheckCircle2 size={14} />
                Entregar
              </button>
            </div>
          </div>
        )}

        {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}

        <div className="flex justify-end gap-3 pt-2">
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
    </Modal>
  );
}
