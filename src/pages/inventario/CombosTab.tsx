import { useEffect, useState } from 'react';
import { Plus, Loader2, Pencil, Package2, X, Camera } from 'lucide-react';
import { useCombos, useCrearCombo, useActualizarCombo, useDesactivarCombo, useReactivarCombo } from '@/hooks/useCombos';
import { useProductos } from '@/hooks/useInventario';
import { useTiposServicio } from '@/hooks/useServicios';
import { comprimirImagen } from '@/api/imagen';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { Modal } from '@/components/ui/Modal';
import { getApiErrorMessage } from '@/api/errors';
import type { Combo } from '@/types/inventario';

export function CombosTab() {
  const { data: combos, isLoading } = useCombos();
  const desactivar = useDesactivarCombo();
  const reactivar = useReactivarCombo();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Combo | null>(null);

  function abrirCrear() {
    setEditando(null);
    setModalAbierto(true);
  }

  function abrirEditar(c: Combo) {
    setEditando(c);
    setModalAbierto(true);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink-400">
          {combos?.length ?? 0} combo{combos?.length === 1 ? '' : 's'} registrado{combos?.length === 1 ? '' : 's'}
        </p>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700"
        >
          <Plus size={16} />
          Nuevo combo
        </button>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : combos && combos.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {combos.map((c) => (
            <div key={c.id} className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {c.imagen ? (
                    <img src={c.imagen} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-ink-50 text-ink-300">
                      <Package2 size={20} />
                    </div>
                  )}
                  <div>
                    <p className="flex items-center gap-1.5 font-display font-semibold text-ink-800">{c.nombre}</p>
                    <p className="font-mono text-xs text-ink-400">{c.codigo}</p>
                  </div>
                </div>
                <button onClick={() => abrirEditar(c)} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700">
                  <Pencil size={14} />
                </button>
              </div>

              <p className="mt-2 text-lg font-semibold text-ink-800">${c.precioVenta.toLocaleString('es-CO')}</p>

              <ul className="mt-2 space-y-0.5 text-xs text-ink-500">
                {c.items.map((i, idx) => (
                  <li key={i.productoId ?? `s-${i.tipoServicioId}-${idx}`}>
                    {i.cantidad}× {i.productoNombre ?? i.tipoServicioNombre}
                    {i.tipoServicioId && <span className="ml-1 text-[10px] text-violet-500">(servicio)</span>}
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex items-center justify-between border-t border-ink-50 pt-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    c.estado ? 'bg-success-50 text-success-600' : 'bg-ink-100 text-ink-500'
                  }`}
                >
                  {c.estado ? 'Activo' : 'Inactivo'}
                </span>
                <button
                  onClick={() => (c.estado ? desactivar.mutate(c.id) : reactivar.mutate(c.id))}
                  className="text-xs font-medium text-ink-500 hover:text-ink-800"
                >
                  {c.estado ? 'Desactivar' : 'Reactivar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Sin combos registrados"
          description="Crea el primero agrupando varios productos con un precio propio."
        />
      )}

      <ComboFormModal isOpen={modalAbierto} onClose={() => setModalAbierto(false)} editando={editando} />
    </div>
  );
}

function ComboFormModal({ isOpen, onClose, editando }: { isOpen: boolean; onClose: () => void; editando: Combo | null }) {
  const crear = useCrearCombo();
  const actualizar = useActualizarCombo();
  const { data: productos } = useProductos();
  const { data: tiposServicio } = useTiposServicio();

  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [imagen, setImagen] = useState<string | null>(null);
  const [items, setItems] = useState<{ seleccion: string; cantidad: string }[]>([{ seleccion: '', cantidad: '1' }]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editando) {
      setCodigo(editando.codigo);
      setNombre(editando.nombre);
      setPrecioVenta(String(editando.precioVenta));
      setImagen(editando.imagen);
      setItems(
        editando.items.map((i) => ({
          seleccion: i.productoId != null ? `p-${i.productoId}` : `s-${i.tipoServicioId}`,
          cantidad: String(i.cantidad),
        }))
      );
    } else {
      setCodigo('');
      setNombre('');
      setPrecioVenta('');
      setImagen(null);
      setItems([{ seleccion: '', cantidad: '1' }]);
    }
    setError(null);
  }, [editando, isOpen]);

  function agregarItem() {
    setItems((prev) => [...prev, { seleccion: '', cantidad: '1' }]);
  }

  function quitarItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function actualizarItem(index: number, cambios: Partial<{ seleccion: string; cantidad: string }>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...cambios } : it)));
  }

  async function handleSubmit() {
    setError(null);
    const itemsValidos = items.filter((i) => i.seleccion && Number(i.cantidad) > 0);
    if (!codigo.trim() || !nombre.trim() || !Number(precioVenta) || Number(precioVenta) <= 0) {
      setError('Completa código, nombre y un precio de venta mayor a cero');
      return;
    }
    if (itemsValidos.length === 0) {
      setError('Agrega al menos un producto o servicio al combo');
      return;
    }

    const data = {
      codigo,
      nombre,
      precioVenta: Number(precioVenta),
      imagen,
      items: itemsValidos.map((i) => {
        const [tipo, idTexto] = i.seleccion.split('-');
        return {
          productoId: tipo === 'p' ? Number(idTexto) : undefined,
          tipoServicioId: tipo === 's' ? Number(idTexto) : undefined,
          cantidad: Number(i.cantidad),
        };
      }),
    };

    try {
      if (editando) {
        await actualizar.mutateAsync({ id: editando.id, data });
      } else {
        await crear.mutateAsync(data);
      }
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo guardar el combo'));
    }
  }

  const pendiente = crear.isPending || actualizar.isPending;
  const productosConInventario = productos?.filter((p) => p.estado) ?? [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editando ? 'Editar combo' : 'Nuevo combo'} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Código</span>
            <input className="input" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
          </label>
          <label className="col-span-2 block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Nombre</span>
            <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </label>
        </div>

        <div className="flex items-center gap-3">
          {imagen ? (
            <img src={imagen} alt="" className="h-16 w-16 rounded-lg border border-ink-200 object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-ink-200 text-ink-300">
              <Package2 size={22} />
            </div>
          )}
          <label className="cursor-pointer rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-50">
            <span className="flex items-center gap-1.5">
              <Camera size={13} />
              {imagen ? 'Cambiar foto' : 'Agregar foto'}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const archivo = e.target.files?.[0];
                if (!archivo) return;
                try {
                  setImagen(await comprimirImagen(archivo, 500, 0.8));
                } catch {
                  setError('No se pudo procesar la foto');
                }
              }}
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Precio de venta del combo</span>
          <input
            type="number"
            min={0}
            className="input"
            value={precioVenta}
            onChange={(e) => setPrecioVenta(e.target.value)}
          />
          <span className="mt-1 block text-xs text-ink-400">
            Es independiente de lo que sumen los productos por separado — tú decides el precio final.
          </span>
        </label>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-ink-700">Productos que incluye</span>
            <button onClick={agregarItem} className="flex items-center gap-1 text-xs font-medium text-ink-600 hover:text-ink-900">
              <Plus size={14} />
              Agregar producto
            </button>
          </div>

          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  className="input flex-1"
                  value={item.seleccion}
                  onChange={(e) => actualizarItem(i, { seleccion: e.target.value })}
                >
                  <option value="">Selecciona un producto o servicio…</option>
                  {tiposServicio && tiposServicio.length > 0 && (
                    <optgroup label="Servicios">
                      {tiposServicio.filter((s) => s.activo).map((s) => (
                        <option key={`s-${s.id}`} value={`s-${s.id}`}>
                          {s.nombre}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="Productos">
                    {productosConInventario.map((p) => (
                      <option key={`p-${p.id}`} value={`p-${p.id}`}>
                        {p.nombre}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <input
                  type="number"
                  min={1}
                  className="input w-20"
                  value={item.cantidad}
                  onChange={(e) => actualizarItem(i, { cantidad: e.target.value })}
                />
                {items.length > 1 && (
                  <button onClick={() => quitarItem(i)} className="text-ink-300 hover:text-danger-500">
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
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
            {editando ? 'Guardar cambios' : 'Crear combo'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
