import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { useCategorias, useMarcas, useCrearProducto, useActualizarProducto } from '@/hooks/useInventario';
import { productoSchema, type ProductoFormValues } from '@/pages/inventario/producto-schema';
import type { Producto } from '@/types/inventario';
import { getApiErrorMessage } from '@/api/errors';
import { Loader2 } from 'lucide-react';

const UNIDADES = ['UND', 'KG', 'LT', 'CAJA', 'PAQUETE'];

interface ProductoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productoEditando: Producto | null;
}

export function ProductoFormModal({ isOpen, onClose, productoEditando }: ProductoFormModalProps) {
  const { data: categorias } = useCategorias();
  const { data: marcas } = useMarcas();
  const crear = useCrearProducto();
  const actualizar = useActualizarProducto();
  const [serverError, setServerError] = useState<string | null>(null);

  const isEditing = productoEditando !== null;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductoFormValues>({
    resolver: zodResolver(productoSchema),
    values: productoEditando
      ? {
          codigoInterno: productoEditando.codigoInterno,
          codigoBarras: productoEditando.codigoBarras ?? '',
          nombre: productoEditando.nombre,
          descripcion: productoEditando.descripcion ?? '',
          unidadMedida: productoEditando.unidadMedida,
          categoriaId: '',
          marcaId: '',
          precioCompra: productoEditando.precioCompra,
          precioVenta: productoEditando.precioVenta,
          esServicio: !productoEditando.manejaInventario,
        }
      : { esServicio: false },
  });

  const esServicio = watch('esServicio');

  async function onSubmit(values: ProductoFormValues) {
    setServerError(null);
    const payload = {
      codigoInterno: values.codigoInterno,
      codigoBarras: values.codigoBarras || null,
      nombre: values.nombre,
      descripcion: values.descripcion || null,
      unidadMedida: values.unidadMedida || 'UND',
      categoriaId: values.categoriaId ? Number(values.categoriaId) : null,
      marcaId: values.marcaId ? Number(values.marcaId) : null,
      precioCompra: values.precioCompra,
      precioVenta: values.precioVenta,
      manejaInventario: !values.esServicio,
    };

    try {
      if (isEditing) {
        await actualizar.mutateAsync({ id: productoEditando.id, data: payload });
      } else {
        await crear.mutateAsync(payload);
      }
      reset();
      onClose();
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'No se pudo guardar el producto'));
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar producto' : 'Nuevo producto'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="flex gap-1 rounded-lg bg-ink-50 p-1 text-sm font-medium">
          <label className={`flex-1 cursor-pointer rounded-md py-2 text-center transition-colors ${!esServicio ? 'bg-white text-ink-800 shadow-sm' : 'text-ink-400 hover:text-ink-600'}`}>
            <input type="radio" className="hidden" checked={!esServicio} onChange={() => setValue('esServicio', false)} />
            Producto (con inventario)
          </label>
          <label className={`flex-1 cursor-pointer rounded-md py-2 text-center transition-colors ${esServicio ? 'bg-white text-ink-800 shadow-sm' : 'text-ink-400 hover:text-ink-600'}`}>
            <input type="radio" className="hidden" checked={!!esServicio} onChange={() => setValue('esServicio', true)} />
            Servicio (sin inventario)
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Código interno" error={errors.codigoInterno?.message}>
            <input
              className="input"
              disabled={isEditing}
              {...register('codigoInterno')}
            />
          </Field>
          <Field label="Código de barras" error={errors.codigoBarras?.message}>
            <input className="input" {...register('codigoBarras')} />
          </Field>
        </div>

        <Field label="Nombre" error={errors.nombre?.message}>
          <input className="input" {...register('nombre')} />
        </Field>

        <Field label="Descripción" error={errors.descripcion?.message}>
          <textarea className="input" rows={2} {...register('descripcion')} />
        </Field>

        <div className="grid grid-cols-3 gap-4">
          {!esServicio && (
            <Field label="Unidad de medida" error={errors.unidadMedida?.message}>
              <select className="input" {...register('unidadMedida')} defaultValue="UND">
                {UNIDADES.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Categoría">
            <select className="input" {...register('categoriaId')}>
              <option value="">Sin categoría</option>
              {categorias?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Marca">
            <select className="input" {...register('marcaId')}>
              <option value="">Sin marca</option>
              {marcas?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label={esServicio ? 'Costo (opcional)' : 'Precio de compra'} error={errors.precioCompra?.message}>
            <input type="number" step="0.01" className="input" {...register('precioCompra')} />
          </Field>
          <Field label="Precio de venta" error={errors.precioVenta?.message}>
            <input type="number" step="0.01" className="input" {...register('precioVenta')} />
          </Field>
        </div>

        {serverError && (
          <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{serverError}</div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-danger-500">{error}</span>}
    </label>
  );
}
