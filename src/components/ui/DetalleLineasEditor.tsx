import { Plus, Trash2 } from 'lucide-react';
import { useProductos } from '@/hooks/useInventario';

export interface LineaDetalle {
  productoId: number | '';
  cantidad: string;
  costoUnitario: string;
}

interface DetalleLineasEditorProps {
  lineas: LineaDetalle[];
  onChange: (lineas: LineaDetalle[]) => void;
  mostrarCosto?: boolean;
  labelCantidad?: string;
}

export function DetalleLineasEditor({
  lineas,
  onChange,
  mostrarCosto = true,
  labelCantidad = 'Cantidad',
}: DetalleLineasEditorProps) {
  const { data: productos } = useProductos();

  function actualizarLinea(index: number, cambios: Partial<LineaDetalle>) {
    const nuevas = lineas.map((linea, i) => (i === index ? { ...linea, ...cambios } : linea));
    onChange(nuevas);
  }

  function agregarLinea() {
    onChange([...lineas, { productoId: '', cantidad: '', costoUnitario: '' }]);
  }

  function quitarLinea(index: number) {
    onChange(lineas.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="grid grid-cols-[1fr_100px_100px_auto] gap-2 text-xs font-medium text-ink-500">
        <span>Producto</span>
        <span>{labelCantidad}</span>
        {mostrarCosto && <span>Costo unit.</span>}
        <span></span>
      </div>

      <div className="mt-1 space-y-2">
        {lineas.map((linea, index) => (
          <div key={index} className="grid grid-cols-[1fr_100px_100px_auto] gap-2">
            <select
              className="input"
              value={linea.productoId}
              onChange={(e) => actualizarLinea(index, { productoId: Number(e.target.value) })}
            >
              <option value="">Selecciona…</option>
              {productos?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
            <input
              type="number"
              className="input"
              value={linea.cantidad}
              onChange={(e) => actualizarLinea(index, { cantidad: e.target.value })}
            />
            {mostrarCosto && (
              <input
                type="number"
                className="input"
                value={linea.costoUnitario}
                onChange={(e) => actualizarLinea(index, { costoUnitario: e.target.value })}
              />
            )}
            <button
              type="button"
              onClick={() => quitarLinea(index)}
              className="rounded-lg p-2 text-ink-400 hover:bg-danger-50 hover:text-danger-500"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={agregarLinea}
        className="mt-2 flex items-center gap-1.5 text-sm font-medium text-ink-700 hover:text-ink-900"
      >
        <Plus size={16} />
        Agregar producto
      </button>
    </div>
  );
}
