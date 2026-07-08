import { useState } from 'react';
import { Plus, Boxes, Pencil, Upload, Camera } from 'lucide-react';
import { useProductos } from '@/hooks/useInventario';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { ProductoFormModal } from '@/pages/inventario/ProductoFormModal';
import { StockKardexModal } from '@/pages/inventario/StockKardexModal';
import { ImportarProductosModal } from '@/pages/inventario/ImportarProductosModal';
import { ImagenProductoModal } from '@/pages/inventario/ImagenProductoModal';
import type { Producto } from '@/types/inventario';

export function ProductosTab() {
  const { data: productos, isLoading } = useProductos();
  const [modalFormAbierto, setModalFormAbierto] = useState(false);
  const [modalImportarAbierto, setModalImportarAbierto] = useState(false);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  const [productoStock, setProductoStock] = useState<Producto | null>(null);
  const [productoFoto, setProductoFoto] = useState<Producto | null>(null);

  function abrirCrear() {
    setProductoEditando(null);
    setModalFormAbierto(true);
  }

  function abrirEditar(producto: Producto) {
    setProductoEditando(producto);
    setModalFormAbierto(true);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink-400">
          {productos?.length ?? 0} producto{productos?.length === 1 ? '' : 's'} registrado
          {productos?.length === 1 ? '' : 's'}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setModalImportarAbierto(true)}
            className="flex items-center gap-1.5 rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50"
          >
            <Upload size={16} />
            Importar
          </button>
          <button
            onClick={abrirCrear}
            className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700"
          >
            <Plus size={16} />
            Nuevo producto
          </button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState label="Cargando productos…" />
      ) : productos && productos.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs text-ink-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium"></th>
                <th className="px-4 py-3 text-left font-medium">Código</th>
                <th className="px-4 py-3 text-left font-medium">Nombre</th>
                <th className="px-4 py-3 text-left font-medium">Categoría</th>
                <th className="px-4 py-3 text-left font-medium">Marca</th>
                <th className="px-4 py-3 text-right font-medium">Costo prom.</th>
                <th className="px-4 py-3 text-right font-medium">Precio venta</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {productos.map((p) => (
                <tr key={p.id} className="hover:bg-ink-50/60">
                  <td className="px-4 py-2">
                    {p.imagen ? (
                      <img src={p.imagen} alt={p.nombre} className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-50 text-ink-300">
                        <Camera size={16} />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-500">{p.codigoInterno}</td>
                  <td className="px-4 py-3 font-medium text-ink-800">{p.nombre}</td>
                  <td className="px-4 py-3 text-ink-500">{p.categoria ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-500">{p.marca ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-ink-700">
                    ${p.costoPromedio.toLocaleString('es-CO')}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-ink-800">
                    ${p.precioVenta.toLocaleString('es-CO')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setProductoFoto(p)}
                        title="Foto del producto"
                        className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                      >
                        <Camera size={16} />
                      </button>
                      <button
                        onClick={() => setProductoStock(p)}
                        title="Ver stock y kardex"
                        className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                      >
                        <Boxes size={16} />
                      </button>
                      <button
                        onClick={() => abrirEditar(p)}
                        title="Editar producto"
                        className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                      >
                        <Pencil size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="Todavía no tienes productos"
          description="Crea el primero con el botón de arriba para empezar a registrar inventario."
        />
      )}

      <ProductoFormModal
        isOpen={modalFormAbierto}
        onClose={() => setModalFormAbierto(false)}
        productoEditando={productoEditando}
      />
      <StockKardexModal
        isOpen={productoStock !== null}
        onClose={() => setProductoStock(null)}
        producto={productoStock}
      />
      <ImportarProductosModal isOpen={modalImportarAbierto} onClose={() => setModalImportarAbierto(false)} />
      <ImagenProductoModal isOpen={productoFoto !== null} onClose={() => setProductoFoto(null)} producto={productoFoto} />
    </div>
  );
}
