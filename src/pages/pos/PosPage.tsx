import { useState } from 'react';
import { CajaBar } from '@/pages/pos/CajaBar';
import { VenderTab } from '@/pages/pos/VenderTab';
import { VentasTab } from '@/pages/pos/VentasTab';
import { ClientesTab } from '@/pages/pos/ClientesTab';
import { CuentasPorCobrarTab } from '@/pages/pos/CuentasPorCobrarTab';
import { CotizacionesTab } from '@/pages/pos/CotizacionesTab';
import { DocumentosCajaTab } from '@/pages/pos/DocumentosCajaTab';

const TABS = [
  { id: 'vender', label: 'Vender' },
  { id: 'ventas', label: 'Historial de ventas' },
  { id: 'cotizaciones', label: 'Cotizaciones' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'cuentas', label: 'Cuentas por cobrar' },
  { id: 'documentos', label: 'Recibos y comprobantes' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function PosPage() {
  const [tab, setTab] = useState<TabId>('vender');

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-800">Punto de venta</h1>
      <p className="mt-1 text-sm text-ink-400">Caja, ventas, cotizaciones, clientes y cuentas por cobrar.</p>

      <div className="mt-5">
        <CajaBar />
      </div>

      <div className="flex gap-1 border-b border-ink-100">
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
        {tab === 'vender' && <VenderTab />}
        {tab === 'ventas' && <VentasTab />}
        {tab === 'cotizaciones' && <CotizacionesTab />}
        {tab === 'clientes' && <ClientesTab />}
        {tab === 'cuentas' && <CuentasPorCobrarTab />}
        {tab === 'documentos' && <DocumentosCajaTab />}
      </div>
    </div>
  );
}
