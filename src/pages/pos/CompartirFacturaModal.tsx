import { useState } from 'react';
import { Mail, Loader2, Download, X } from 'lucide-react';
import { useEnviarFacturaPorCorreo } from '@/hooks/usePos';
import { useEmpresa } from '@/hooks/useGestion';
import { abrirFactura } from '@/lib/factura';
import { getApiErrorMessage } from '@/api/errors';
import type { Venta } from '@/types/pos';

/** Botón + panel de "Compartir" para una venta: permite mandarla a CUALQUIER correo
 *  (no solo al del cliente ya registrado, que es opcional) y también descargar/imprimir. */
export function CompartirFacturaModal({ venta, onClose }: { venta: Venta; onClose: () => void }) {
  const { data: empresa } = useEmpresa();
  const enviar = useEnviarFacturaPorCorreo();
  const [correo, setCorreo] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEnviar() {
    setError(null);
    setEnviado(false);
    try {
      await enviar.mutateAsync({ ventaId: venta.id, correo: correo || undefined });
      setEnviado(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo enviar el correo'));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-xl border border-ink-100 bg-white p-6 shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-base font-semibold text-ink-800">Compartir venta {venta.numero}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-ink-400 hover:bg-ink-100">
            <X size={18} />
          </button>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Correo del cliente (opcional)</span>
          <input
            type="email"
            className="input"
            placeholder="Déjalo vacío para usar el correo ya registrado del cliente"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />
          <span className="mt-1 block text-xs text-ink-400">
            Si lo dejas vacío, se manda al correo que el cliente ya tenga guardado (si tiene uno).
          </span>
        </label>

        {error && <div className="mt-3 rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}
        {enviado && !error && (
          <div className="mt-3 rounded-lg bg-success-50 px-3 py-2.5 text-sm text-success-600">
            Enviado correctamente.
          </div>
        )}

        <button
          onClick={handleEnviar}
          disabled={enviar.isPending}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-ink-800 py-2.5 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
        >
          {enviar.isPending ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
          Enviar por correo
        </button>

        {empresa && (
          <button
            onClick={() => abrirFactura(venta, empresa)}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-ink-200 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50"
          >
            <Download size={16} />
            Descargar / imprimir PDF
          </button>
        )}
      </div>
    </div>
  );
}
