import { useEffect, useState } from 'react';
import { Loader2, Ban } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useCrearCita, useActualizarCita, useCambiarEstadoCita, useTiposServicio } from '@/hooks/useServicios';
import { useSucursales } from '@/hooks/useSucursales';
import { useClientes } from '@/hooks/usePos';
import { useUsuarios } from '@/hooks/useNucleo';
import { getApiErrorMessage } from '@/api/errors';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { usePermisosOperacion } from '@/hooks/usePermisosOperacion';
import { useAuthStore } from '@/stores/authStore';
import { CobroCita } from './CobroCita';
import type { RecursoAgenda, InicioCita, Cita } from '@/api/servicios';

export function CitaFormModal({ isOpen, onClose, cita, inicio }: { isOpen: boolean; onClose: () => void; cita: Cita | null; inicio?: InicioCita | null }) {
  const permisos = usePermisosOperacion('SERVICIOS_CITAS');
  const usuarioId=useAuthStore(s=>s.usuarioId);
  const recursos = useQuery({queryKey:['agenda-recursos'],queryFn:async()=>(await apiClient.get<RecursoAgenda[]>('/servicios/citas/recursos')).data,enabled:isOpen});
  const [recursoId,setRecursoId]=useState('');
  const [busquedaCliente,setBusquedaCliente]=useState('');
  const terminada=!!cita && ['COMPLETADA','CANCELADA','NO_ASISTIO'].includes(cita.estado);
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
      setSucursalId(cita?.sucursalId != null ? String(cita.sucursalId) : inicio?.sucursalId ? String(inicio.sucursalId) : sucursales?.[0] ? String(sucursales[0].id) : '');
      setClienteId(cita?.clienteId != null ? String(cita.clienteId) : '');
      setTipoServicioId(cita?.tipoServicioId != null ? String(cita.tipoServicioId) : '');
      setAsignadoAId(cita?.asignadoAId != null ? String(cita.asignadoAId) : inicio?.asignadoAId ? String(inicio.asignadoAId) : '');
      setRecursoId(cita?.recursoId ? String(cita.recursoId) : '');
      setBusquedaCliente('');
      setFechaHora((cita?.fechaHora ?? inicio?.fechaHora ?? '').slice(0,16));
      setDuracionMinutos(cita?.duracionMinutos != null ? String(cita.duracionMinutos) : '30');
      setNotas(cita?.notas ?? '');
      setError(null);
    }
  }, [isOpen, cita, inicio, sucursales]);

  async function handleGuardar() {
    setError(null);
    if (!permisos.operar || terminada || guardando) return;
    if (!sucursalId || !fechaHora || !asignadoAId) {
      setError('Selecciona sucursal, empleado y fecha/hora');
      return;
    }
    const duracion=Number(duracionMinutos);
    if(!Number.isInteger(duracion)||duracion<5||duracion>1440){setError('La duración debe ser un número entero entre 5 y 1440 minutos.');return;}
    const data = {
      sucursalId: Number(sucursalId),
      clienteId: clienteId ? Number(clienteId) : undefined,
      tipoServicioId: tipoServicioId ? Number(tipoServicioId) : undefined,
      asignadoAUsuarioId: asignadoAId ? Number(asignadoAId) : undefined,
      fechaHora: `${fechaHora}:00`,
      recursoId: recursoId ? Number(recursoId) : undefined,
      duracionMinutos: duracion,
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

  const guardando = crear.isPending || actualizar.isPending || cambiarEstado.isPending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={cita ? 'Editar cita' : 'Nueva cita'} size="md">
      <div className="space-y-4">
        <fieldset disabled={!permisos.operar || terminada || guardando} className="grid grid-cols-2 gap-3">
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
            <input className="input mb-2" placeholder="Buscar por nombre o teléfono" aria-label="Buscar cliente" value={busquedaCliente} onChange={e=>setBusquedaCliente(e.target.value)}/>
            <select className="input" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
              <option value="">Sin cliente</option>
              {clientes?.filter(c=>String(c.id)===clienteId || `${c.nombre} ${c.telefono??''}`.toLocaleLowerCase().includes(busquedaCliente.toLocaleLowerCase())).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-600">Tipo de servicio</span>
            <select className="input" value={tipoServicioId} onChange={(e) => {setTipoServicioId(e.target.value);const tipo=tiposServicio?.find(t=>String(t.id)===e.target.value);if(tipo?.duracionMinutos)setDuracionMinutos(String(tipo.duracionMinutos));}}>
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
              {usuarios?.filter(u=>permisos.empresa||permisos.puede('VER_SUCURSAL')||u.id===usuarioId).map((u) => (
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
            <input type="number" min="5" max="1440" className="input" value={duracionMinutos} onChange={(e) => setDuracionMinutos(e.target.value)} />
          </label>
          <label className="block col-span-2"><span className="mb-1 block text-xs font-medium text-ink-600">Puesto o equipo (opcional)</span><select className="input" value={recursoId} onChange={e=>setRecursoId(e.target.value)}><option value="">No requiere equipo</option>{recursos.data?.filter(r=>r.activo&&String(r.sucursal_id)===sucursalId).map(r=><option key={r.id} value={r.id}>{r.nombre}</option>)}</select></label>
        </fieldset>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-600">Notas (opcional)</span>
          <input disabled={!permisos.operar||terminada||guardando} maxLength={255} className="input" value={notas} onChange={(e) => setNotas(e.target.value)} />
        </label>

        {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}

        {terminada&&<p className="text-sm text-ink-500">Cita finalizada: consulta sus datos y cobros.</p>}
        {cita&&<CobroCita cita={cita}/>}
        <div className="flex items-center justify-between pt-2">
          {cita && !terminada && permisos.operar && permisos.administrar ? (
            <button
              disabled={guardando} onClick={handleCancelar}
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
              disabled={guardando||!permisos.operar||terminada}
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
