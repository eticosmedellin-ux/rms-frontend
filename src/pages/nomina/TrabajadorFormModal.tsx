import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useCrearTrabajador, useActualizarTrabajador } from '@/hooks/useNomina';
import { useSucursales } from '@/hooks/useSucursales';
import { useUsuarios } from '@/hooks/useNucleo';
import { getApiErrorMessage } from '@/api/errors';
import type { Trabajador } from '@/api/nomina';

export function TrabajadorFormModal({
  isOpen,
  onClose,
  trabajador,
}: {
  isOpen: boolean;
  onClose: () => void;
  trabajador: Trabajador | null;
}) {
  const { data: sucursales } = useSucursales();
  const { data: usuarios } = useUsuarios();
  const crear = useCrearTrabajador();
  const actualizar = useActualizarTrabajador();

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [documento, setDocumento] = useState('');
  const [cargo, setCargo] = useState('');
  const [salario, setSalario] = useState('');
  const [comisionPorcentaje, setComisionPorcentaje] = useState('');
  const [usuarioAsociadoId, setUsuarioAsociadoId] = useState('');
  const [sucursalId, setSucursalId] = useState('');
  const [frecuenciaPago, setFrecuenciaPago] = useState<'MENSUAL' | 'QUINCENAL' | 'SEMANAL'>('MENSUAL');
  const [diaPago1, setDiaPago1] = useState('30');
  const [diaPago2, setDiaPago2] = useState('15');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [fechaIngreso, setFechaIngreso] = useState('');
  const [estado, setEstado] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (trabajador) {
      setNombre(trabajador.nombre);
      setApellido(trabajador.apellido ?? '');
      setDocumento(trabajador.documento ?? '');
      setCargo(trabajador.cargo ?? '');
      setSalario(trabajador.salario?.toString() ?? '');
      setComisionPorcentaje(trabajador.comisionPorcentaje?.toString() ?? '');
      setUsuarioAsociadoId(trabajador.usuarioAsociadoId?.toString() ?? '');
      setSucursalId(trabajador.sucursalId?.toString() ?? '');
      setFrecuenciaPago(trabajador.frecuenciaPago);
      setDiaPago1(trabajador.diaPago1.toString());
      setDiaPago2(trabajador.diaPago2?.toString() ?? '15');
      setTelefono(trabajador.telefono ?? '');
      setEmail(trabajador.email ?? '');
      setFechaIngreso(trabajador.fechaIngreso ?? '');
      setEstado(trabajador.estado);
    } else {
      setNombre('');
      setApellido('');
      setDocumento('');
      setCargo('');
      setSalario('');
      setComisionPorcentaje('');
      setUsuarioAsociadoId('');
      setSucursalId(sucursales?.[0]?.id.toString() ?? '');
      setFrecuenciaPago('MENSUAL');
      setDiaPago1('30');
      setDiaPago2('15');
      setTelefono('');
      setEmail('');
      setFechaIngreso('');
      setEstado(true);
    }
    setError(null);
  }, [isOpen, trabajador, sucursales]);

  async function handleGuardar() {
    setError(null);
    if (!nombre.trim() || !sucursalId) {
      setError('Nombre y sucursal son obligatorios');
      return;
    }
    const data = {
      nombre,
      apellido: apellido || undefined,
      documento: documento || undefined,
      cargo: cargo || undefined,
      salario: salario ? Number(salario) : undefined,
      comisionPorcentaje: comisionPorcentaje ? Number(comisionPorcentaje) : undefined,
      usuarioAsociadoId: usuarioAsociadoId ? Number(usuarioAsociadoId) : undefined,
      sucursalId: Number(sucursalId),
      frecuenciaPago,
      diaPago1: Number(diaPago1),
      diaPago2: frecuenciaPago === 'QUINCENAL' ? Number(diaPago2) : undefined,
      telefono: telefono || undefined,
      email: email || undefined,
      fechaIngreso: fechaIngreso || undefined,
      estado,
    };
    try {
      if (trabajador) {
        await actualizar.mutateAsync({ id: trabajador.id, data });
      } else {
        await crear.mutateAsync(data);
      }
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo guardar el trabajador'));
    }
  }

  const guardando = crear.isPending || actualizar.isPending;
  const maxDia = frecuenciaPago === 'SEMANAL' ? 7 : 31;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={trabajador ? 'Editar trabajador' : 'Nuevo trabajador'} size="md">
      <div className="space-y-4 px-6 py-5">
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Nombre</span>
            <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Apellido</span>
            <input className="input" value={apellido} onChange={(e) => setApellido(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Documento</span>
            <input className="input" value={documento} onChange={(e) => setDocumento(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Cargo</span>
            <input className="input" value={cargo} onChange={(e) => setCargo(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Salario</span>
            <input type="number" className="input" value={salario} onChange={(e) => setSalario(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Comisión (% opcional)</span>
            <input
              type="number"
              step="0.1"
              className="input"
              placeholder="Ej. 10"
              value={comisionPorcentaje}
              onChange={(e) => setComisionPorcentaje(e.target.value)}
            />
          </label>
          <label className="block col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Usuario del sistema asociado (para calcular su comisión)</span>
            <select className="input" value={usuarioAsociadoId} onChange={(e) => setUsuarioAsociadoId(e.target.value)}>
              <option value="">Sin usuario asociado (no gana comisión)</option>
              {usuarios?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre} {u.apellido ?? ''}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-ink-400">
              Se usa para sumar las ventas que este usuario registra y calcular su comisión al pagar la nómina.
            </span>
          </label>
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
        </div>

        <div className="border-t border-ink-100 pt-4">
          <p className="mb-3 text-sm font-semibold text-ink-700">Fecha de pago</p>
          <div className="grid grid-cols-3 gap-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-700">Frecuencia</span>
              <select
                className="input"
                value={frecuenciaPago}
                onChange={(e) => setFrecuenciaPago(e.target.value as typeof frecuenciaPago)}
              >
                <option value="MENSUAL">Mensual</option>
                <option value="QUINCENAL">Quincenal</option>
                <option value="SEMANAL">Semanal</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-700">
                {frecuenciaPago === 'SEMANAL' ? 'Día (1=lun…7=dom)' : 'Día del mes'}
              </span>
              <input
                type="number"
                min={1}
                max={maxDia}
                className="input"
                value={diaPago1}
                onChange={(e) => setDiaPago1(e.target.value)}
              />
            </label>
            {frecuenciaPago === 'QUINCENAL' && (
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink-700">Segundo día</span>
                <input
                  type="number"
                  min={1}
                  max={31}
                  className="input"
                  value={diaPago2}
                  onChange={(e) => setDiaPago2(e.target.value)}
                />
              </label>
            )}
          </div>
        </div>

        <div className="border-t border-ink-100 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-700">Teléfono</span>
              <input className="input" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-700">Email</span>
              <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-700">Fecha de ingreso</span>
              <input type="date" className="input" value={fechaIngreso} onChange={(e) => setFechaIngreso(e.target.value)} />
            </label>
            <label className="mt-6 flex items-center gap-2">
              <input type="checkbox" checked={estado} onChange={(e) => setEstado(e.target.checked)} />
              <span className="text-sm font-medium text-ink-700">Activo</span>
            </label>
          </div>
        </div>

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
