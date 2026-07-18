import { useMemo, useState } from 'react';
import { Search, Package2, ImageOff } from 'lucide-react';
import { useProductos } from '@/hooks/useInventario';
import { useCombos } from '@/hooks/useCombos';

export interface ItemSeleccionable {
  tipo: 'PRODUCTO' | 'COMBO';
  id: number;
  nombre: string;
  precioVenta: number;
  imagen: string | null;
}

function formatoMoneda(v: number) {
  return v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

/** Selector visual de producto o combo, con imagen — igual al del Punto de Venta.
 *  Se usa en Comandas (Restaurante) y en Domicilios, para que escoger un plato o
 *  artículo se sienta igual en todos lados. */
export function SelectorProductoOCombo({ onSeleccionar }: { onSeleccionar: (item: ItemSeleccionable) => void }) {
  const { data: productos } = useProductos();
  const { data: combos } = useCombos();
  const [busqueda, setBusqueda] = useState('');

  const items = useMemo<ItemSeleccionable[]>(() => {
    const combosItems: ItemSeleccionable[] = (combos ?? [])
      .filter((c) => c.estado)
      .map((c) => ({ tipo: 'COMBO', id: c.id, nombre: c.nombre, precioVenta: c.precioVenta, imagen: c.imagen }));
    const productosItems: ItemSeleccionable[] = (productos ?? [])
      .filter((p) => p.estado)
      .map((p) => ({ tipo: 'PRODUCTO', id: p.id, nombre: p.nombre, precioVenta: p.precioVenta, imagen: p.imagen }));
    return [...combosItems, ...productosItems];
  }, [productos, combos]);

  const filtrados = items.filter((i) => i.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <div>
      <label className="relative block">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
        <input
          className="input pl-9 text-sm"
          placeholder="Buscar producto o plato del menú..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          autoFocus
        />
      </label>

      <div className="mt-3 grid max-h-80 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
        {filtrados.map((item) => (
          <button
            key={`${item.tipo}-${item.id}`}
            onClick={() => onSeleccionar(item)}
            className="group rounded-xl border border-ink-100 bg-white p-2 text-left shadow-card transition-all hover:border-ink-300 hover:shadow-md"
          >
            <div className="aspect-square w-full overflow-hidden rounded-lg bg-ink-50">
              {item.imagen ? (
                <img
                  src={item.imagen}
                  alt={item.nombre}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-ink-300">
                  {item.tipo === 'COMBO' ? <Package2 size={22} /> : <ImageOff size={22} />}
                </div>
              )}
            </div>
            <p className="mt-1.5 truncate text-xs font-medium text-ink-800">
              {item.nombre}
              {item.tipo === 'COMBO' && (
                <span className="ml-1 rounded-full bg-violet-50 px-1 py-0.5 text-[9px] font-medium text-violet-700">Receta</span>
              )}
            </p>
            <p className="text-xs font-semibold text-ink-600">{formatoMoneda(item.precioVenta)}</p>
          </button>
        ))}
        {filtrados.length === 0 && <p className="col-span-full py-6 text-center text-sm text-ink-400">Sin resultados.</p>}
      </div>
    </div>
  );
}
