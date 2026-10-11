import { useState, useEffect, type ReactNode } from 'react';
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
  onCreado?:(p:Producto)=>void;
}

export function ProductoFormModal({ isOpen, onClose, productoEditando, onCreado }: ProductoFormModalProps) {
  const { data: categorias } = useCategorias();
  const { data: marcas } = useMarcas();
  const crear = useCrearProducto();
  const actualizar = useActualizarProducto();
  const [serverError, setServerError] = useState<string | null>(null);

  const [ubicacion,setUbicacion]=useState('');
  const [presentaciones,setPresentaciones]=useState<{nombre:string;unidades:number;codigoBarras?:string}[]>([]);
  useEffect(()=>{if(isOpen){setUbicacion(productoEditando?.ubicacion??'');setPresentaciones(productoEditando?.presentaciones?.map(p=>({nombre:p.nombre,unidades:p.unidades,codigoBarras:p.codigo_barras??''}))??[]);}},[isOpen,productoEditando]);
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
          categoriaId: productoEditando.categoriaId?String(productoEditando.categoriaId):'',
          marcaId: productoEditando.marcaId?String(productoEditando.marcaId):'',
          precioCompra: productoEditando.precioCompra,
          precioVenta: productoEditando.precioVenta,
          esServicio: !productoEditando.manejaInventario,
          impuestoTipo:productoEditando.impuestoTipo??"SIN_CONFIGURAR",
          impuestoTarifa:productoEditando.impuestoTarifa??0,
        }
      : {
          codigoInterno: '',
          codigoBarras: '',
          nombre: '',
          descripcion: '',
          unidadMedida: 'UND',
          categoriaId: '',
          marcaId: '',
          precioCompra: 0,
          precioVenta: 0,
          esServicio: false,
          impuestoTipo:"SIN_CONFIGURAR",
          impuestoTarifa:0,
        },
  });

  const esServicio = watch('esServicio');

  async function onSubmit(values: ProductoFormValues) {
    setServerError(null);
    const payload = {
      ubicacion,presentaciones,
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
      impuestoTipo:values.impuestoTipo,
      impuestoTarifa:["IVA","INC"].includes(values.impuestoTipo??"")?values.impuestoTarifa??0:0,
    };

    try {
      if (isEditing) {
        await actualizar.mutateAsync({ id: productoEditando.id, data: payload });
      } else {
        const nuevo=await crear.mutateAsync(payload);onCreado?.(nuevo);
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

        <div className="grid grid-cols-2 gap-4"><Field label="Tratamiento del impuesto"><select className="input" {...register('impuestoTipo')}>{(['SIN_CONFIGURAR','IVA','INC','EXENTO','EXCLUIDO','NO_APLICA'] as const).map(t=><option key={t} value={t}>{{SIN_CONFIGURAR:"Sin configurar",IVA:"IVA",INC:"Impuesto al consumo (INC)",EXENTO:"Exento",EXCLUIDO:"Excluido",NO_APLICA:"No aplica"}[t]}</option>)}</select></Field><Field label="Tarifa (%)" error={errors.impuestoTarifa?.message}><input type="number" min="0" max="100" step="0.01" className="input" disabled={!['IVA','INC'].includes(watch('impuestoTipo')??'')} {...register('impuestoTarifa')}/></Field></div>
        <Field label="Ubicación física (estante, pasillo o bodega)"><input className="input" maxLength={300} value={ubicacion} onChange={e=>setUbicacion(e.target.value)}/></Field>
        {!esServicio&&<section className="rounded border p-3 space-y-2"><strong>Presentaciones de compra</strong><p className="text-xs">La unidad base es {watch('unidadMedida')}. Una caja de 10 se registra aquí como 10 unidades base.</p>{presentaciones.map((p,i)=><div className="grid grid-cols-3 gap-2" key={i}><input aria-label="Nombre de presentación" className="input" value={p.nombre} onChange={e=>setPresentaciones(presentaciones.map((x,j)=>j===i?{...x,nombre:e.target.value}:x))}/><input aria-label="Unidades por presentación" type="number" min="0.01" step="0.01" className="input" value={p.unidades} onChange={e=>setPresentaciones(presentaciones.map((x,j)=>j===i?{...x,unidades:Number(e.target.value)}:x))}/><div><input aria-label="Código de barras presentación" className="input" value={p.codigoBarras??''} onChange={e=>setPresentaciones(presentaciones.map((x,j)=>j===i?{...x,codigoBarras:e.target.value}:x))}/><button type="button" className="text-xs underline" onClick={()=>setPresentaciones(presentaciones.filter((_,j)=>j!==i))}>Quitar</button></div></div>)}<button type="button" className="text-sm underline" onClick={()=>setPresentaciones([...presentaciones,{nombre:'',unidades:1}])}>Añadir caja o presentación</button></section>}
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
