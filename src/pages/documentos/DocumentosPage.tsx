import { useMemo, useState } from 'react';
import { Search, FileText, Receipt, FileMinus, ReceiptText, CircleDollarSign } from 'lucide-react';
import { useVentas } from '@/hooks/usePos';
import { useDocumentosCaja, useRegistrarImpresion } from '@/hooks/useDocumentosCaja';
import { useEmpresa } from '@/hooks/useGestion';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { abrirFactura } from '@/lib/factura';
import { imprimirDocumentoCaja } from '@/lib/documentoCajaImpresion';

type TipoDocumentoUnificado = 'FACTURA' | 'RECIBO' | 'COMPROBANTE' | 'NOTA_CREDITO' | 'NOTA_DEBITO';

interface DocumentoUnificado {
  id: string;
  tipo: TipoDocumentoUnificado;
  numero: string;
  relacionado: string;
  monto: number;
  fecha: string;
  accion: () => void;
}

const TIPO_INFO: Record<TipoDocumentoUnificado, { label: string; icono: typeof FileText; tono: string }> = {
  FACTURA: { label: 'Factura', icono: FileText, tono: 'bg-ink-100 text-ink-700' },
  RECIBO: { label: 'Recibo', icono: Receipt, tono: 'bg-success-50 text-success-600' },
  COMPROBANTE: { label: 'Comprobante', icono: FileMinus, tono: 'bg-amber-50 text-amber-700' },
  NOTA_CREDITO: { label: 'Nota crédito', icono: ReceiptText, tono: 'bg-sky-50 text-sky-700' },
  NOTA_DEBITO: { label: 'Nota débito', icono: CircleDollarSign, tono: 'bg-rose-50 text-rose-700' },
};

export default function DocumentosPage() {
  const { data: ventas, isLoading: cargandoVentas } = useVentas();
  const { data: documentosCaja, isLoading: cargandoDocumentos } = useDocumentosCaja();
  const { data: empresa } = useEmpresa();
  const registrarImpresion = useRegistrarImpresion();

  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | TipoDocumentoUnificado>('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const documentos = useMemo<DocumentoUnificado[]>(() => {
    const facturas: DocumentoUnificado[] = (ventas ?? []).map((v) => ({
      id: `venta-${v.id}`,
      tipo: 'FACTURA',
      numero: v.numeroFactura ?? v.numero,
      relacionado: v.cliente,
      monto: v.total,
      fecha: v.fecha,
      accion: () => empresa && abrirFactura(v, empresa),
    }));

    const caja: DocumentoUnificado[] = (documentosCaja ?? []).map((d) => ({
      id: `doc-${d.id}`,
      tipo: d.tipo,
      numero: d.numero,
      relacionado: d.personaRelacionada ?? '—',
      monto: d.monto,
      fecha: d.fecha,
      accion: async () => {
        await registrarImpresion.mutateAsync(d.id);
        imprimirDocumentoCaja(d);
      },
    }));

    return [...facturas, ...caja].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [ventas, documentosCaja, empresa, registrarImpresion]);

  const documentosFiltrados = useMemo(() => {
    return documentos.filter((d) => {
      if (filtroTipo !== 'TODOS' && d.tipo !== filtroTipo) return false;
      if (busqueda.trim()) {
        const term = busqueda.toLowerCase();
        if (!d.numero.toLowerCase().includes(term) && !d.relacionado.toLowerCase().includes(term)) return false;
      }
      const fechaDoc = d.fecha.slice(0, 10);
      if (desde && fechaDoc < desde) return false;
      if (hasta && fechaDoc > hasta) return false;
      return true;
    });
  }, [documentos, filtroTipo, busqueda, desde, hasta]);

  const isLoading = cargandoVentas || cargandoDocumentos;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold text-ink-800">Documentos</h1>
        <p className="mt-1 text-sm text-ink-400">
          Todas las facturas, recibos, comprobantes y notas crédito en un solo lugar, con búsqueda y filtros.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            className="input pl-9"
            placeholder="Buscar por número o cliente…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <select
          className="input w-auto"
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value as typeof filtroTipo)}
        >
          <option value="TODOS">Todos los tipos</option>
          <option value="FACTURA">Facturas</option>
          <option value="RECIBO">Recibos</option>
          <option value="COMPROBANTE">Comprobantes</option>
          <option value="NOTA_CREDITO">Notas crédito</option>
          <option value="NOTA_DEBITO">Notas débito</option>
        </select>

        <label className="flex items-center gap-1.5 text-xs text-ink-500">
          Desde
          <input type="date" className="input w-auto" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </label>
        <label className="flex items-center gap-1.5 text-xs text-ink-500">
          Hasta
          <input type="date" className="input w-auto" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </label>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : documentosFiltrados.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs text-ink-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Tipo</th>
                <th className="px-4 py-3 text-left font-medium">Número</th>
                <th className="px-4 py-3 text-left font-medium">Cliente / relacionado</th>
                <th className="px-4 py-3 text-right font-medium">Monto</th>
                <th className="px-4 py-3 text-left font-medium">Fecha</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {documentosFiltrados.map((d) => {
                const info = TIPO_INFO[d.tipo];
                const Icono = info.icono;
                return (
                  <tr key={d.id} className="hover:bg-ink-50/60">
                    <td className="px-4 py-3">
                      <span className={`flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${info.tono}`}>
                        <Icono size={12} />
                        {info.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-600">{d.numero}</td>
                    <td className="px-4 py-3 text-ink-700">{d.relacionado}</td>
                    <td className="px-4 py-3 text-right font-medium text-ink-800">
                      ${d.monto.toLocaleString('es-CO')}
                    </td>
                    <td className="px-4 py-3 text-ink-500">
                      {new Date(d.fecha).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={d.accion}
                        className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-50"
                      >
                        {d.tipo === 'FACTURA' ? 'Descargar' : 'Imprimir'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="Sin documentos que coincidan"
          description="Ajusta los filtros o el texto de búsqueda."
        />
      )}
    </div>
  );
}
