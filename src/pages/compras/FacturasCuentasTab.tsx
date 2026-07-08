import { useState } from 'react';
import { Plus, Wallet } from 'lucide-react';
import { useProveedores, useFacturasPorProveedor, useCuentasPorPagar } from '@/hooks/useCompras';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { FacturaFormModal } from '@/pages/compras/FacturaFormModal';
import { AbonoProveedorModal } from '@/pages/compras/AbonoProveedorModal';
import type { CuentaPorPagar } from '@/types/compras';

export function FacturasCuentasTab() {
  const { data: proveedores } = useProveedores();
  const [proveedorId, setProveedorId] = useState<number | null>(null);
  const [modalFacturaAbierto, setModalFacturaAbierto] = useState(false);
  const [cuentaAbonando, setCuentaAbonando] = useState<CuentaPorPagar | null>(null);

  const { data: facturas, isLoading: cargandoFacturas } = useFacturasPorProveedor(proveedorId);
  const { data: cuentas, isLoading: cargandoCuentas } = useCuentasPorPagar(proveedorId);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <label className="flex items-center gap-2 text-sm">
          <span className="font-medium text-ink-700">Proveedor:</span>
          <select
            className="input max-w-xs"
            value={proveedorId ?? ''}
            onChange={(e) => setProveedorId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Selecciona un proveedor…</option>
            {proveedores?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </label>

        {proveedorId && (
          <button
            onClick={() => setModalFacturaAbierto(true)}
            className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700"
          >
            <Plus size={16} />
            Registrar factura
          </button>
        )}
      </div>

      {!proveedorId ? (
        <EmptyState title="Selecciona un proveedor" description="Elige uno arriba para ver sus facturas y cuentas por pagar." />
      ) : (
        <div className="space-y-6">
          <section>
            <h3 className="mb-2 text-sm font-semibold text-ink-700">Facturas</h3>
            {cargandoFacturas ? (
              <LoadingState />
            ) : facturas && facturas.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white shadow-card">
                <table className="w-full text-sm">
                  <thead className="border-b border-ink-100 bg-ink-50 text-xs text-ink-500">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">N.º factura</th>
                      <th className="px-4 py-3 text-left font-medium">Fecha emisión</th>
                      <th className="px-4 py-3 text-left font-medium">Crédito</th>
                      <th className="px-4 py-3 text-right font-medium">Total</th>
                      <th className="px-4 py-3 text-left font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-50">
                    {facturas.map((f) => (
                      <tr key={f.id}>
                        <td className="px-4 py-3 text-ink-700">{f.numeroFacturaProveedor ?? '—'}</td>
                        <td className="px-4 py-3 text-ink-500">{f.fechaEmision}</td>
                        <td className="px-4 py-3 text-ink-500">{f.esCredito ? 'Sí' : 'No'}</td>
                        <td className="px-4 py-3 text-right font-medium text-ink-800">
                          ${f.total.toLocaleString('es-CO')}
                        </td>
                        <td className="px-4 py-3 text-ink-500">{f.estado}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="Sin facturas registradas para este proveedor" />
            )}
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-ink-700">Cuentas por pagar</h3>
            {cargandoCuentas ? (
              <LoadingState />
            ) : cuentas && cuentas.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white shadow-card">
                <table className="w-full text-sm">
                  <thead className="border-b border-ink-100 bg-ink-50 text-xs text-ink-500">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Vencimiento</th>
                      <th className="px-4 py-3 text-right font-medium">Monto original</th>
                      <th className="px-4 py-3 text-right font-medium">Saldo pendiente</th>
                      <th className="px-4 py-3 text-left font-medium">Estado</th>
                      <th className="px-4 py-3 text-right font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-50">
                    {cuentas.map((c) => (
                      <tr key={c.id}>
                        <td className="px-4 py-3 text-ink-500">{c.fechaVencimiento ?? '—'}</td>
                        <td className="px-4 py-3 text-right text-ink-700">
                          ${c.montoOriginal.toLocaleString('es-CO')}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-ink-800">
                          ${c.saldoPendiente.toLocaleString('es-CO')}
                        </td>
                        <td className="px-4 py-3 text-ink-500">{c.estado}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setCuentaAbonando(c)}
                            title="Registrar abono"
                            className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                          >
                            <Wallet size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="Sin cuentas por pagar pendientes" />
            )}
          </section>
        </div>
      )}

      {proveedorId && (
        <FacturaFormModal
          isOpen={modalFacturaAbierto}
          onClose={() => setModalFacturaAbierto(false)}
          proveedorId={proveedorId}
        />
      )}
      <AbonoProveedorModal
        isOpen={cuentaAbonando !== null}
        onClose={() => setCuentaAbonando(null)}
        cuenta={cuentaAbonando}
      />
    </div>
  );
}
