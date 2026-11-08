import {useState} from 'react';
import {Loader2, Send} from 'lucide-react';
import {useFacturaElectronica,useEnviarFacturaElectronica} from '@/hooks/usePos';
import {getApiErrorMessage} from '@/api/errors';
import type {Venta} from '@/types/pos';
import type {EstadoFacturaElectronica} from '@/types/gestion';

const ESTADO_DIAN_LABEL: Record<EstadoFacturaElectronica, string> = {
  PENDIENTE: 'Pendiente de enviar',
  ENVIADA: 'Enviada',
  POR_CONFIRMAR: 'Por confirmar',
  ACEPTADA: 'Aceptada DIAN',
  RECHAZADA: 'Rechazada',
  SIN_PROVEEDOR: 'Sin proveedor',
  NO_APLICA: 'No aplica',
};

const ESTADO_DIAN_TONO: Record<EstadoFacturaElectronica, string> = {
  PENDIENTE: 'bg-ink-100 text-ink-500',
  ENVIADA: 'bg-amber-50 text-amber-700',
  POR_CONFIRMAR: 'bg-amber-50 text-amber-700',
  ACEPTADA: 'bg-success-50 text-success-600',
  RECHAZADA: 'bg-danger-50 text-danger-600',
  SIN_PROVEEDOR: 'bg-ink-100 text-ink-400',
  NO_APLICA: 'bg-ink-50 text-ink-300',
};

export function EstadoDian({ venta, permitirEnvio = false }: { venta: Venta; permitirEnvio?: boolean }) {
  const { data: estado, isError, refetch } = useFacturaElectronica(venta.facturar ? venta.id : null);
  const [verRechazo,setVerRechazo]=useState(false);
  const enviar = useEnviarFacturaElectronica();
  const [error, setError] = useState<string | null>(null);

  if (!venta.facturar) {
    return <span className="text-xs text-ink-300">No facturada</span>;
  }
  if (isError) return <button type="button" className="text-xs underline" onClick={() => void refetch()}>No se pudo consultar DIAN · Reintentar consulta</button>;
  if (!estado) {
    return <span className="text-xs text-ink-300">—</span>;
  }

  const puedeEnviar = permitirEnvio && (estado.estado === 'PENDIENTE' || estado.estado === 'RECHAZADA' || estado.estado === 'SIN_PROVEEDOR');
  const mostrarDetalle = estado.estado === 'RECHAZADA' || estado.estado === 'POR_CONFIRMAR' || estado.estado === 'SIN_PROVEEDOR';

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
          {ESTADO_DIAN_LABEL[estado.estado] ?? estado.estado}
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
      {mostrarDetalle && <>
        <button type="button" className="text-xs underline" onClick={()=>setVerRechazo(v=>!v)} aria-expanded={verRechazo}>{estado.estado === 'RECHAZADA' ? 'Ver rechazo' : 'Ver detalle DIAN'}</button>
        {verRechazo && <div className="mt-1 max-w-xs space-y-1 rounded border p-2 text-xs">
          <p><strong>Respuesta recibida:</strong> {estado.mensaje || 'El proveedor no entregó el motivo.'}</p>
          <p><strong>Qué revisar:</strong> {estado.estado === 'POR_CONFIRMAR' ? 'Consulta si la factura ya fue recibida antes de intentar otro envío.' : /HTTP (401|403)/i.test(estado.mensaje??'') ? 'Revisa las credenciales y el ambiente del proveedor.'
            : /resoluci|prefijo|consecutivo/i.test(estado.mensaje??'') ? 'Verifica la resolución, el prefijo y el consecutivo autorizado.'
            : /tax|impuesto|tribut|total/i.test(estado.mensaje??'') ? 'Revisa los impuestos y que el total coincida con las líneas y descuentos.'
            : /customer|adquirente|identifica/i.test(estado.mensaje??'') ? 'Revisa la identificación y los datos fiscales del comprador.'
            : 'Consulta el detalle de validación en el portal del proveedor antes de corregir y reenviar.'}</p>
        </div>}
      </>}
      {!mostrarDetalle && estado.mensaje && <p className="mt-0.5 max-w-[220px] text-[11px] text-ink-400">{estado.mensaje}</p>}
      {error && <p className="mt-0.5 text-[11px] text-danger-500">{error}</p>}
    </div>
  );
}

