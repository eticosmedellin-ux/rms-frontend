import { useState } from 'react';
import { ProveedoresTab } from '@/pages/compras/ProveedoresTab';
import { OrdenesCompraTab } from '@/pages/compras/OrdenesCompraTab';
import { FacturasCuentasTab } from '@/pages/compras/FacturasCuentasTab';

const TABS = [
  { id: 'proveedores', label: 'Proveedores' },
  { id: 'ordenes', label: 'Órdenes de compra' },
  { id: 'facturas', label: 'Facturas y cuentas por pagar' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function ComprasPage() {
  const [tab, setTab] = useState<TabId>('proveedores');

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-800">Compras</h1>
      <p className="mt-1 text-sm text-ink-400">
        Proveedores, órdenes de compra, recepciones, facturas y cuentas por pagar.
      </p>

      <div className="mt-5 flex gap-1 border-b border-ink-100">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === id ? 'border-ink-800 text-ink-800' : 'border-transparent text-ink-400 hover:text-ink-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === 'proveedores' && <ProveedoresTab />}
        {tab === 'ordenes' && <OrdenesCompraTab />}
        {tab === 'facturas' && <FacturasCuentasTab />}
      </div>
    </div>
  );
}
