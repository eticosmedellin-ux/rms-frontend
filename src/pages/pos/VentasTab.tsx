import { useState } from 'react';
import { Undo2, FileText, Send, Loader2, CircleDollarSign, ChevronLeft, ChevronRight, Download, Mail, Share2 } from 'lucide-react';
import { useVentasPaginado, useFacturaElectronica, useEnviarFacturaElectronica, useEnviarFacturaPorCorreo, useClientes } from '@/hooks/usePos';
import { useEmpresa } from '@/hooks/useGestion';
import { useSucursales } from '@/hooks/useSucursales';
import { useUsuarios } from '@/hooks/useNucleo';
import { CompartirFacturaModal } from '@/pages/pos/CompartirFacturaModal';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { DevolucionModal } from '@/pages/pos/DevolucionModal';
import { NotaDebitoModal } from '@/pages/pos/NotaDebitoModal';
import { abrirFactura } from '@/lib/factura';
import { getApiErrorMessage } from '@/api/errors';
import { descargarArchivo } from '@/lib/descargarArchivo';
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

const TAMANO_PAGINA = 25;

export function VentasTab() {
  const [pagina, setPagina] = useState(0);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [sucursalId, setSucursalId] = useState('');
  const [usuarioId, setUsuarioId] = useState('');
  const [texto, setTexto] = useState('');

  const filtros = {
    desde: desde ? `${desde}T00:00:00` : undefined,
    hasta: hasta ? `${hasta}T23:59:59` : undefined,
    clienteId: clienteId ? Number(clienteId) : undefined,
    sucursalId: sucursalId ? Number(sucursalId) : undefined,
    usuarioId: usuarioId ? Number(usuarioId) : undefined,
    texto: texto || undefined,
  };

  const { data: paginaVentas, isLoading } = useVentasPaginado(pagina, TAMANO_PAGINA, filtros);
  const { data: empresa } = useEmpresa();
  const { data: clientes } = useClientes();
  const { data: sucursales } = useSucursales();
  const { data: usuarios } = useUsuarios();
  const [ventaDevolviendo, setVentaDevolviendo] = useState<Venta | null>(null);
  const [ventaNotaDebito, setVentaNotaDebito] = useState<Venta | null>(null);
  const [ventaCompartiendo, setVentaCompartiendo] = useState<Venta | null>(null);

  function handleCambiarFiltro(actualizar: () => void) {
    actualizar();
    setPagina(0); // cualquier cambio de filtro vuelve a la primera página
  }

  if (isLoading) return <LoadingState />;
  const ventas = paginaVentas?.contenido ?? [];
  const hayFiltrosActivos = Boolean(desde || hasta || clienteId || sucursalId || usuarioId || texto);
  if (ventas.length === 0 && pagina === 0 && !hayFiltrosActivos) {
    return <EmptyState title="Sin ventas registradas todavía" description="Ve a la pestaña 'Vender' para registrar la primera." />;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-ink-100 bg-white p-4 shadow-card">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-600">Buscar (n.° venta o factura)</span>
          <input
            className="input w-44"
            value={texto}
            onChange={(e) => handleCambiarFiltro(() => setTexto(e.target.value))}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-600">Desde</span>
          <input type="date" className="input" value={desde} onChange={(e) => handleCambiarFiltro(() => setDesde(e.target.value))} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-600">Hasta</span>
          <input type="date" className="input" value={hasta} onChange={(e) => handleCambiarFiltro(() => setHasta(e.target.value))} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-600">Cliente</span>
          <select className="input" value={clienteId} onChange={(e) => handleCambiarFiltro(() => setClienteId(e.target.value))}>
            <option value="">Todos</option>
            {clientes?.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-600">Vendedor</span>
          <select className="input" value={usuarioId} onChange={(e) => handleCambiarFiltro(() => setUsuarioId(e.target.value))}>
            <option value="">Todos</option>
            {usuarios?.map((u) => (
              <option key={u.id} value={u.id}>{u.nombre}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-600">Sucursal</span>
          <select className="input" value={sucursalId} onChange={(e) => handleCambiarFiltro(() => setSucursalId(e.target.value))}>
            <option value="">Todas</option>
            {sucursales?.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        </label>
        {hayFiltrosActivos && (
          <button
            onClick={() => handleCambiarFiltro(() => { setDesde(''); setHasta(''); setClienteId(''); setSucursalId(''); setUsuarioId(''); setTexto(''); })}
            className="rounded-lg border border-ink-200 px-3 py-2 text-xs font-medium text-ink-500 hover:bg-ink-50"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {ventas.length === 0 ? (
        <EmptyState title="Sin resultados" description="Ninguna venta coincide con los filtros elegidos." />
      ) : (
      <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-ink-400">
          {paginaVentas?.totalElementos ?? 0} venta{paginaVentas?.totalElementos === 1 ? '' : 's'} en total
        </p>
        <button
          onClick={() =>
            descargarArchivo(
              '/reportes/ventas/exportar',
              'ventas.xlsx',
              { desde: '2000-01-01', hasta: new Date().toISOString().slice(0, 10) }
            )
          }
          className="flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-50"
        >
          <Download size={14} />
          Exportar a Excel
        </button>
      </div>

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
                    <BotonEnviarCorreo venta={v} />
                    <button
                      onClick={() => setVentaCompartiendo(v)}
                      title="Compartir"
                      className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                    >
                      <Share2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {paginaVentas && paginaVentas.totalPaginas > 1 && (
        <div className="mt-3 flex items-center justify-between text-sm text-ink-500">
          <button
            onClick={() => setPagina((p) => Math.max(0, p - 1))}
            disabled={pagina === 0}
            className="flex items-center gap-1 rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium hover:bg-ink-50 disabled:opacity-40"
          >
            <ChevronLeft size={14} />
            Anterior
          </button>
          <span>
            Página {pagina + 1} de {paginaVentas.totalPaginas}
          </span>
          <button
            onClick={() => setPagina((p) => Math.min(paginaVentas.totalPaginas - 1, p + 1))}
            disabled={pagina >= paginaVentas.totalPaginas - 1}
            className="flex items-center gap-1 rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium hover:bg-ink-50 disabled:opacity-40"
          >
            Siguiente
            <ChevronRight size={14} />
          </button>
        </div>
      )}
      </div>
      )}

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
      {ventaCompartiendo && (
        <CompartirFacturaModal venta={ventaCompartiendo} onClose={() => setVentaCompartiendo(null)} />
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

/** Manda por correo la factura (o el comprobante, si no se facturó) al cliente de la venta. */
function BotonEnviarCorreo({ venta }: { venta: Venta }) {
  const enviar = useEnviarFacturaPorCorreo();
  const [estado, setEstado] = useState<'idle' | 'ok' | 'error'>('idle');
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  if (venta.cliente === 'Mostrador') return null;

  async function handleClick() {
    setEstado('idle');
    setMensajeError(null);
    try {
      await enviar.mutateAsync({ ventaId: venta.id });
      setEstado('ok');
      setTimeout(() => setEstado('idle'), 3000);
    } catch (err) {
      setEstado('error');
      setMensajeError(getApiErrorMessage(err, 'No se pudo enviar el correo'));
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={enviar.isPending}
      title={mensajeError ?? 'Enviar factura por correo al cliente'}
      className={`rounded-lg p-1.5 hover:bg-ink-100 ${
        estado === 'ok' ? 'text-success-600' : estado === 'error' ? 'text-danger-500' : 'text-ink-400 hover:text-ink-700'
      }`}
    >
      {enviar.isPending ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
    </button>
  );
}
