import { useEffect, useMemo, useState } from 'react';
import { Plus, Loader2, Pencil } from 'lucide-react';
import { useRoles, useCrearRol, useActualizarRol, usePermisos } from '@/hooks/useNucleo';
import { useMiPlan } from '@/hooks/usePlataforma';
import { permisoIncluidoEnPlan } from '@/lib/permisos';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { Modal } from '@/components/ui/Modal';
import { getApiErrorMessage } from '@/api/errors';
import type { Rol } from '@/types/nucleo';

export function RolesTab() {
  const { data: roles, isLoading } = useRoles();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [rolEditando, setRolEditando] = useState<Rol | null>(null);

  function abrirCrear() {
    setRolEditando(null);
    setModalAbierto(true);
  }

  function abrirEditar(rol: Rol) {
    setRolEditando(rol);
    setModalAbierto(true);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink-400">
          {roles?.length ?? 0} rol{roles?.length === 1 ? '' : 'es'} configurado{roles?.length === 1 ? '' : 's'}
        </p>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700"
        >
          <Plus size={16} />
          Nuevo rol
        </button>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : roles && roles.length > 0 ? (
        <div className="space-y-2">
          {roles.map((r) => (
            <div key={r.id} className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display font-semibold text-ink-800">
                    {r.nombre}
                    {r.esPredeterminado && (
                      <span className="ml-2 rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-600">
                        Predeterminado
                      </span>
                    )}
                  </p>
                  {r.descripcion && <p className="text-sm text-ink-400">{r.descripcion}</p>}
                </div>
                <button
                  onClick={() => abrirEditar(r)}
                  title="Editar permisos"
                  className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                >
                  <Pencil size={16} />
                </button>
              </div>
              <p className="mt-2 text-xs text-ink-400">{r.permisos.length} permiso(s) asignados</p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="Sin roles configurados" />
      )}

      <RolFormModal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        rolEditando={rolEditando}
      />
    </div>
  );
}

function RolFormModal({
  isOpen,
  onClose,
  rolEditando,
}: {
  isOpen: boolean;
  onClose: () => void;
  rolEditando: Rol | null;
}) {
  const { data: permisos } = usePermisos();
  const { data: miPlan } = useMiPlan();
  const crear = useCrearRol();
  const actualizar = useActualizarRol();

  const [nombre, setNombre] = useState(rolEditando?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(rolEditando?.descripcion ?? '');
  const [permisoIds, setPermisoIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Sincroniza el formulario cuando cambia el rol a editar (o se abre para crear uno nuevo)
  useEffect(() => {
    setNombre(rolEditando?.nombre ?? '');
    setDescripcion(rolEditando?.descripcion ?? '');
    if (rolEditando && permisos) {
      const ids = permisos.filter((p) => rolEditando.permisos.includes(p.codigo)).map((p) => p.id);
      setPermisoIds(ids);
    } else {
      setPermisoIds([]);
    }
  }, [rolEditando, permisos]);

  const permisosDelPlan = useMemo(
    () => permisos?.filter((p) => permisoIncluidoEnPlan(miPlan?.rutasHabilitadas, p.modulo)),
    [permisos, miPlan]
  );

  const permisosPorModulo = useMemo(() => {
    const grupos: Record<string, typeof permisos> = {};
    permisosDelPlan?.forEach((p) => {
      grupos[p.modulo] = grupos[p.modulo] ? [...grupos[p.modulo]!, p] : [p];
    });
    return grupos;
  }, [permisosDelPlan]);

  function togglePermiso(id: number) {
    setPermisoIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  function toggleModuloCompleto(idsDelModulo: number[]) {
    const todosMarcados = idsDelModulo.every((id) => permisoIds.includes(id));
    setPermisoIds((prev) =>
      todosMarcados ? prev.filter((id) => !idsDelModulo.includes(id)) : [...new Set([...prev, ...idsDelModulo])]
    );
  }

  async function handleSubmit() {
    setError(null);
    if (!nombre.trim() || permisoIds.length === 0) {
      setError('El nombre y al menos un permiso son obligatorios');
      return;
    }

    try {
      if (rolEditando) {
        await actualizar.mutateAsync({ id: rolEditando.id, data: { nombre, descripcion, permisoIds } });
      } else {
        await crear.mutateAsync({ nombre, descripcion, permisoIds });
      }
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo guardar el rol'));
    }
  }

  const pendiente = crear.isPending || actualizar.isPending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={rolEditando ? 'Editar rol' : 'Nuevo rol'} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Nombre del rol</span>
            <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Descripción</span>
            <input className="input" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </label>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-ink-700">Permisos</p>
          {permisos && permisosDelPlan && permisos.length > permisosDelPlan.length && (
            <p className="mb-2 text-xs text-ink-400">
              Solo se muestran los módulos que incluye tu plan actual — para agregar más, contacta a tu proveedor.
            </p>
          )}
          <div className="max-h-72 space-y-3 overflow-y-auto rounded-lg border border-ink-100 p-3">
            {Object.entries(permisosPorModulo).map(([modulo, lista]) => {
              const idsDelModulo = lista!.map((p) => p.id);
              const todosMarcados = idsDelModulo.every((id) => permisoIds.includes(id));
              return (
                <div key={modulo}>
                  <label className="flex items-center gap-2 text-sm font-semibold text-ink-800">
                    <input
                      type="checkbox"
                      checked={todosMarcados}
                      onChange={() => toggleModuloCompleto(idsDelModulo)}
                    />
                    {modulo}
                  </label>
                  <div className="ml-6 mt-1 grid grid-cols-2 gap-1">
                    {lista!.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 text-xs text-ink-600">
                        <input
                          type="checkbox"
                          checked={permisoIds.includes(p.id)}
                          onChange={() => togglePermiso(p.id)}
                        />
                        {p.accion}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={pendiente}
            className="flex items-center gap-2 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
          >
            {pendiente && <Loader2 size={16} className="animate-spin" />}
            Guardar rol
          </button>
        </div>
      </div>
    </Modal>
  );
}
