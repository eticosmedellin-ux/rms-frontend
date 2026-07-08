import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useCategorias, useMarcas, useCrearCategoria, useCrearMarca } from '@/hooks/useInventario';
import { LoadingState, EmptyState } from '@/components/ui/States';

export function CategoriasMarcasTab() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <ListaSimple
        titulo="Categorías"
        placeholder="Ej: Abarrotes"
        useLista={useCategorias}
        useCrear={useCrearCategoria}
      />
      <ListaSimple
        titulo="Marcas"
        placeholder="Ej: Genérica"
        useLista={useMarcas}
        useCrear={useCrearMarca}
      />
    </div>
  );
}

interface Item {
  id: number;
  nombre: string;
  estado: boolean;
}

function ListaSimple({
  titulo,
  placeholder,
  useLista,
  useCrear,
}: {
  titulo: string;
  placeholder: string;
  useLista: () => { data?: Item[]; isLoading: boolean };
  useCrear: () => { mutateAsync: (data: { nombre: string }) => Promise<unknown>; isPending: boolean };
}) {
  const { data: items, isLoading } = useLista();
  const crear = useCrear();
  const [nombre, setNombre] = useState('');

  async function handleAgregar() {
    if (!nombre.trim()) return;
    await crear.mutateAsync({ nombre: nombre.trim() });
    setNombre('');
  }

  return (
    <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-card">
      <h3 className="font-display text-base font-semibold text-ink-800">{titulo}</h3>

      <div className="mt-3 flex gap-2">
        <input
          className="input"
          placeholder={placeholder}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAgregar()}
        />
        <button
          onClick={handleAgregar}
          disabled={crear.isPending || !nombre.trim()}
          className="flex items-center gap-1 rounded-lg bg-ink-800 px-3 py-2 text-sm font-medium text-white hover:bg-ink-700 disabled:opacity-60"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <LoadingState />
        ) : items && items.length > 0 ? (
          <ul className="divide-y divide-ink-50">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between py-2 text-sm text-ink-700">
                {item.nombre}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title={`Sin ${titulo.toLowerCase()} todavía`} />
        )}
      </div>
    </div>
  );
}
