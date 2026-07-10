import { useState } from 'react';
import { Undo2, FileText, Send, Loader2, CircleDollarSign } from 'lucide-react';
import { useVentas, useFacturaElectronica, useEnviarFacturaElectronica } from '@/hooks/usePos';
import { useEmpresa } from '@/hooks/useGestion';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { DevolucionModal } from '@/pages/pos/DevolucionModal';
import { NotaDebitoModal } from '@/pages/pos/NotaDebitoModal';
import { abrirFactura } from '@/lib/factura';
import { getApiErrorMessage } from '@/api/errors';
import type { Venta } from '@/types/pos';
import type { EstadoFacturaElectronica } from '@/types/gestion';

const ESTADO_DIAN_LABEL: Record<EstadoFacturaElectronica, string> = {
  PENDIENTE: 'Pendiente de enviar',
  ENVIADA: 'Enviada',
  ACEPTADA: 'Aceptada DIAN',
  RECHAZADA: 'Rechazada',
  SIN_PROVEEDOR: 'Sin proveedor',
  NO_APLICA: 'No aplica',
};

const ESTADO_DIAN_TONO: Record<EstadoFacturaElectronica, string> = {
  PENDIENTE: 'bg-ink-100 text-ink-500',
  ENVIADA: 'bg-amber-50 text-amber-700',
  ACEPTADA: 'bg-success-50 text-success-600',
  RECHAZADA: 'bg-danger-50 text-danger-600',
  SIN_PROVEEDOR: 'bg-ink-100 text-ink-400',
  NO_APLICA: 'bg-ink-50 text-ink-300',
};

export function VentasTab() {
  const { data: ventas, isLoading } = useVentas();
  const { data: empresa } = useEmpresa();
  const [ventaDevolviendo, setVentaDevolviendo] = useState<Venta | null>(null);
  const [ventaNotaDebito, setVentaNotaDebito] = useState<Venta | null>(null);

  if (isLoading) return <LoadingState />;
  if (!ventas || ventas.length === 0) {
    return <EmptyState title="Sin ventas registradas todavía" description="Ve a la pestaña 'Vender' para registrar la primera." />;
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-100 bg-ink-50 text-xs text-ink-500">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Número</th>
              <th className="px-4 py-3 text-left font-medium">Factura</th>
              <th className="px-4 py-3 text-left font-medium">Cliente</th>
              <th className="px-4 py-3 text-left font-medium">Tipo</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
              <th className="px-4 py-3 text-left font-medium">Fecha</th>
              <th className="px-4 py-3 text-left font-medium">DIAN</th>
              <th className="px-4 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-50">
            {ventas.map((v) => (
              <tr key={v.id} className="hover:bg-ink-50/60">
                <td className="px-4 py-3 font-mono text-xs text-ink-600">{v.numero}</td>
                <td className="px-4 py-3 font-mono text-xs text-ink-600">
                  {v.numeroFactura ?? <span className="text-ink-300">Sin facturar</span>}
                </td>
                <td className="px-4 py-3 text-ink-700">{v.cliente}</td>
                <td className="px-4 py-3 text-ink-500">{v.tipoVenta}</td>
                <td className="px-4 py-3 text-right font-medium text-ink-800">${v.total.toLocaleString('es-CO')}</td>
                <td className="px-4 py-3 text-ink-500">
                  {new Date(v.fecha).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                </td>
                <td className="px-4 py-3">
                  <EstadoDian venta={v} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    {empresa && (
                      <button
                        onClick={() => abrirFactura(v, empresa)}
                        title={v.numeroFactura ? 'Descargar factura' : 'Descargar comprobante (sin facturar)'}
                        className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                      >
                        <FileText size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => setVentaDevolviendo(v)}
                      title="Registrar devolución"
                      className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                    >
                      <Undo2 size={16} />
                    </button>
                    {v.cliente !== 'Mostrador' && (
                      <button
                        onClick={() => setVentaNotaDebito(v)}
                        title="Cargo adicional (nota débito)"
                        className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                      >
                        <CircleDollarSign size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DevolucionModal
        isOpen={ventaDevolviendo !== null}
        onClose={() => setVentaDevolviendo(null)}
        venta={ventaDevolviendo}
      />
      {ventaNotaDebito && (
        <NotaDebitoModal
          isOpen={ventaNotaDebito !== null}
          onClose={() => setVentaNotaDebito(null)}
          ventaId={ventaNotaDebito.id}
          ventaNumero={ventaNotaDebito.numeroFactura ?? ventaNotaDebito.numero}
          clienteId={undefined}
          clienteNombre={ventaNotaDebito.cliente}
        />
      )}
    </div>
  );
}

/** Muestra el estado de la factura electrónica de una venta y permite enviarla (o
 *  reintentarla) a la DIAN a través del proveedor configurado en Configuración. */
function EstadoDian({ venta }: { venta: Venta }) {
  const { data: estado } = useFacturaElectronica(venta.facturar ? venta.id : null);
  const enviar = useEnviarFacturaElectronica();
  const [error, setError] = useState<string | null>(null);

  if (!venta.facturar) {
    return <span className="text-xs text-ink-300">No facturada</span>;
  }
  if (!estado) {
    return <span className="text-xs text-ink-300">—</span>;
  }

  const puedeEnviar = estado.estado === 'PENDIENTE' || estado.estado === 'RECHAZADA' || estado.estado === 'SIN_PROVEEDOR';

  async function handleEnviar() {
    setError(null);
    try {
      await enviar.mutateAsync(venta.id);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo enviar a la DIAN'));
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_DIAN_TONO[estado.estado]}`}>
          {ESTADO_DIAN_LABEL[estado.estado]}
        </span>
        {puedeEnviar && (
          <button
            onClick={handleEnviar}
            disabled={enviar.isPending}
            title="Enviar a la DIAN"
            className="rounded-lg p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
          >
            {enviar.isPending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          </button>
        )}
      </div>
      {estado.mensaje && <p className="mt-0.5 max-w-[220px] text-[11px] text-ink-400">{estado.mensaje}</p>}
      {error && <p className="mt-0.5 text-[11px] text-danger-500">{error}</p>}
    </div>
  );
}
