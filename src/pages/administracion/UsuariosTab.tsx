import { useEffect, useState } from 'react';
import { Plus, Loader2, Copy, Pencil } from 'lucide-react';
import {
  useUsuarios,
  useCrearUsuario,
  useEditarUsuario,
  useRoles,
  useDesactivarUsuario,
  useReactivarUsuario,
} from '@/hooks/useNucleo';
import { useSucursales } from '@/hooks/useSucursales';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { Modal } from '@/components/ui/Modal';
import { getApiErrorMessage } from '@/api/errors';
import type { UsuarioEmpleado } from '@/types/nucleo';

export function UsuariosTab() {
  const { data: usuarios, isLoading } = useUsuarios();
  const desactivar = useDesactivarUsuario();
  const reactivar = useReactivarUsuario();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioEmpleado | null>(null);

  function abrirCrear() {
    setUsuarioEditando(null);
    setModalAbierto(true);
  }

  function abrirEditar(u: UsuarioEmpleado) {
    setUsuarioEditando(u);
    setModalAbierto(true);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink-400">
          {usuarios?.length ?? 0} usuario{usuarios?.length === 1 ? '' : 's'} registrado
          {usuarios?.length === 1 ? '' : 's'}
        </p>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700"
        >
          <Plus size={16} />
          Nuevo usuario
        </button>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : usuarios && usuarios.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs text-ink-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Nombre</th>
                <th className="px-4 py-3 text-left font-medium">Usuario</th>
                <th className="px-4 py-3 text-left font-medium">Roles</th>
                <th className="px-4 py-3 text-left font-medium">Sucursales</th>
                <th className="px-4 py-3 text-left font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-ink-50/60">
                  <td className="px-4 py-3 font-medium text-ink-800">
                    {u.nombre} {u.apellido}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-600">{u.username}</td>
                  <td className="px-4 py-3 text-ink-500">{u.roles.join(', ')}</td>
                  <td className="px-4 py-3 text-ink-500">{u.sucursales.join(', ') || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        u.estado ? 'bg-success-50 text-success-600' : 'bg-ink-100 text-ink-500'
                      }`}
                    >
                      {u.estado ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => abrirEditar(u)}
                        title="Editar usuario"
                        className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => (u.estado ? desactivar.mutate(u.id) : reactivar.mutate(u.id))}
                        className="text-xs font-medium text-ink-500 hover:text-ink-800"
                      >
                        {u.estado ? 'Desactivar' : 'Reactivar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="Solo existe tu usuario administrador" description="Crea empleados para que puedan entrar al sistema." />
      )}

      <UsuarioFormModal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        usuarioEditando={usuarioEditando}
      />
    </div>
  );
}

function UsuarioFormModal({
  isOpen,
  onClose,
  usuarioEditando,
}: {
  isOpen: boolean;
  onClose: () => void;
  usuarioEditando: UsuarioEmpleado | null;
}) {
  const { data: roles } = useRoles();
  const { data: sucursales } = useSucursales();
  const crear = useCrearUsuario();
  const editar = useEditarUsuario();

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [rolIds, setRolIds] = useState<number[]>([]);
  const [sucursalIds, setSucursalIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [passwordGenerada, setPasswordGenerada] = useState<string | null>(null);

  useEffect(() => {
    if (usuarioEditando) {
      setNombre(usuarioEditando.nombre);
      setApellido(usuarioEditando.apellido ?? '');
      setUsername(usuarioEditando.username);
      setEmail(usuarioEditando.email);
      setRolIds(usuarioEditando.rolIds ?? []);
      setSucursalIds(usuarioEditando.sucursalIds ?? []);
    } else {
      setNombre('');
      setApellido('');
      setUsername('');
      setEmail('');
      setRolIds([]);
      setSucursalIds([]);
    }
    setError(null);
  }, [usuarioEditando, isOpen]);

  function toggleRol(id: number) {
    setRolIds((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  }

  function toggleSucursal(id: number) {
    setSucursalIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function handleSubmit() {
    setError(null);
    if (!nombre.trim() || !email.trim() || rolIds.length === 0) {
      setError('Completa nombre, email y al menos un rol');
      return;
    }
    if (!usuarioEditando && !username.trim()) {
      setError('El usuario (username) es obligatorio');
      return;
    }

    try {
      if (usuarioEditando) {
        await editar.mutateAsync({
          id: usuarioEditando.id,
          data: { nombre, apellido: apellido || undefined, email, rolIds, sucursalIds },
        });
        handleClose();
      } else {
        const usuario = await crear.mutateAsync({ nombre, apellido: apellido || undefined, username, email, rolIds, sucursalIds });
        if (usuario.passwordTemporal) {
          setPasswordGenerada(usuario.passwordTemporal);
        } else {
          handleClose();
        }
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo guardar el usuario'));
    }
  }

  function handleClose() {
    setPasswordGenerada(null);
    onClose();
  }

  if (passwordGenerada) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Usuario creado" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-ink-600">
            Guarda esta contraseña temporal — solo se muestra una vez. Compártela con el empleado para su primer ingreso.
          </p>
          <div className="flex items-center justify-between gap-2 rounded-lg bg-ink-50 px-4 py-3 font-mono text-sm text-ink-800">
            {passwordGenerada}
            <button
              onClick={() => navigator.clipboard.writeText(passwordGenerada)}
              className="text-ink-400 hover:text-ink-700"
              title="Copiar"
            >
              <Copy size={16} />
            </button>
          </div>
          <button
            onClick={handleClose}
            className="w-full rounded-lg bg-ink-800 py-2 text-sm font-semibold text-white hover:bg-ink-700"
          >
            Listo
          </button>
        </div>
      </Modal>
    );
  }

  const pendiente = crear.isPending || editar.isPending;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={usuarioEditando ? 'Editar usuario' : 'Nuevo usuario'} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Nombre</span>
            <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Apellido</span>
            <input className="input" value={apellido} onChange={(e) => setApellido(e.target.value)} />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Usuario (username)</span>
            <input
              className="input disabled:bg-ink-50 disabled:text-ink-400"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={!!usuarioEditando}
            />
            {usuarioEditando && <span className="mt-1 block text-xs text-ink-400">El usuario no se puede cambiar.</span>}
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Email</span>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-ink-700">Roles</p>
          <div className="flex flex-wrap gap-2">
            {roles?.map((r) => (
              <label
                key={r.id}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  (rolIds ?? []).includes(r.id)
                    ? 'border-ink-800 bg-ink-800 text-white'
                    : 'border-ink-200 text-ink-600 hover:bg-ink-50'
                }`}
              >
                <input type="checkbox" className="hidden" checked={(rolIds ?? []).includes(r.id)} onChange={() => toggleRol(r.id)} />
                {r.nombre}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-ink-700">Sucursales asignadas</p>
          <div className="flex flex-wrap gap-2">
            {sucursales?.map((s) => (
              <label
                key={s.id}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  (sucursalIds ?? []).includes(s.id)
                    ? 'border-ink-800 bg-ink-800 text-white'
                    : 'border-ink-200 text-ink-600 hover:bg-ink-50'
                }`}
              >
                <input type="checkbox" className="hidden" checked={(sucursalIds ?? []).includes(s.id)} onChange={() => toggleSucursal(s.id)} />
                {s.nombre}
              </label>
            ))}
          </div>
        </div>

        {!usuarioEditando && (
          <p className="text-xs text-ink-400">
            Se generará una contraseña temporal automáticamente — la verás una sola vez al confirmar.
          </p>
        )}

        {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={handleClose} className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={pendiente}
            className="flex items-center gap-2 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
          >
            {pendiente && <Loader2 size={16} className="animate-spin" />}
            {usuarioEditando ? 'Guardar cambios' : 'Crear usuario'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
