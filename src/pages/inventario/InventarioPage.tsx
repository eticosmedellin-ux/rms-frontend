import { useState } from 'react';
import { ProductosTab } from '@/pages/inventario/ProductosTab';
import { CategoriasMarcasTab } from '@/pages/inventario/CategoriasMarcasTab';
import { AjustesTab } from '@/pages/inventario/AjustesTab';
import { TransferenciasTab } from '@/pages/inventario/TransferenciasTab';
import { ConteosTab } from '@/pages/inventario/ConteosTab';
import { CombosTab } from '@/pages/inventario/CombosTab';

const TABS = [
  { id: 'productos', label: 'Productos' },
  { id: 'combos', label: 'Combos' },
  { id: 'categorias', label: 'Categorías y marcas' },
  { id: 'ajustes', label: 'Ajustes' },
  { id: 'transferencias', label: 'Transferencias' },
  { id: 'conteos', label: 'Conteos físicos' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function InventarioPage() {
  const [tab, setTab] = useState<TabId>('productos');

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-800">Inventario</h1>
      <p className="mt-1 text-sm text-ink-400">
        Productos, categorías, marcas, stock, kardex, ajustes, transferencias y conteos físicos.
      </p>

      <div className="mt-5 flex gap-1 border-b border-ink-100">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === id
                ? 'border-ink-800 text-ink-800'
                : 'border-transparent text-ink-400 hover:text-ink-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === 'productos' && <ProductosTab />}
        {tab === 'combos' && <CombosTab />}
        {tab === 'categorias' && <CategoriasMarcasTab />}
        {tab === 'ajustes' && <AjustesTab />}
        {tab === 'transferencias' && <TransferenciasTab />}
        {tab === 'conteos' && <ConteosTab />}
      </div>
    </div>
  );
}
