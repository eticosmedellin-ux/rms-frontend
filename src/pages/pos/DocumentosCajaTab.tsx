import { useState } from 'react';
import { Plus, Loader2, Printer, Receipt, FileMinus, FileText, CircleDollarSign } from 'lucide-react';
import { useDocumentosCaja, useCrearDocumentoCaja, useRegistrarImpresion } from '@/hooks/useDocumentosCaja';
import { useCajaAbierta } from '@/hooks/usePos';
import { usePosStore } from '@/stores/posStore';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { Modal } from '@/components/ui/Modal';
import { getApiErrorMessage } from '@/api/errors';
import { imprimirDocumentoCaja } from '@/lib/documentoCajaImpresion';
import type { DocumentoCaja } from '@/types/pos';

const TIPO_DOC_INFO: Record<DocumentoCaja['tipo'], { label: string; icono: typeof Receipt; tono: string }> = {
  RECIBO: { label: 'Recibo', icono: Receipt, tono: 'bg-success-50 text-success-600' },
  COMPROBANTE: { label: 'Comprobante', icono: FileMinus, tono: 'bg-amber-50 text-amber-700' },
  NOTA_CREDITO: { label: 'Nota crédito', icono: FileText, tono: 'bg-sky-50 text-sky-700' },
  NOTA_DEBITO: { label: 'Nota débito', icono: CircleDollarSign, tono: 'bg-rose-50 text-rose-700' },
};

export function DocumentosCajaTab() {
  const { sucursalId } = usePosStore();
  const { data: caja } = useCajaAbierta(sucursalId);
  const { data: documentos, isLoading } = useDocumentosCaja();
  const registrarImpresion = useRegistrarImpresion();
  const [modalAbierto, setModalAbierto] = useState(false);

  async function imprimir(doc: DocumentoCaja) {
    await registrarImpresion.mutateAsync(doc.id);
    imprimirDocumentoCaja(doc);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink-400">
          {documentos?.length ?? 0} documento{documentos?.length === 1 ? '' : 's'} emitido
          {documentos?.length === 1 ? '' : 's'}
        </p>
        <button
          onClick={() => setModalAbierto(true)}
          disabled={!caja}
          title={!caja ? 'Abre una caja para emitir documentos' : undefined}
          className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-50"
        >
          <Plus size={16} />
          Nuevo documento
        </button>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : documentos && documentos.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs text-ink-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Número</th>
                <th className="px-4 py-3 text-left font-medium">Tipo</th>
                <th className="px-4 py-3 text-left font-medium">Concepto</th>
                <th className="px-4 py-3 text-left font-medium">Relacionado</th>
                <th className="px-4 py-3 text-right font-medium">Monto</th>
                <th className="px-4 py-3 text-left font-medium">Fecha</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {documentos.map((d) => (
                <tr key={d.id} className="hover:bg-ink-50/60">
                  <td className="px-4 py-3 font-mono text-xs text-ink-600">{d.numero}</td>
                  <td className="px-4 py-3">
                    <span className={`flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${TIPO_DOC_INFO[d.tipo].tono}`}>
                      {(() => {
                        const Icono = TIPO_DOC_INFO[d.tipo].icono;
                        return <Icono size={12} />;
                      })()}
                      {TIPO_DOC_INFO[d.tipo].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-700">{d.concepto}</td>
                  <td className="px-4 py-3 text-ink-500">{d.personaRelacionada ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-medium text-ink-800">
                    ${d.monto.toLocaleString('es-CO')}
                  </td>
                  <td className="px-4 py-3 text-ink-500">{new Date(d.fecha).toLocaleString('es-CO')}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => imprimir(d)}
                      title={d.vecesImpreso > 0 ? `Reimprimir (impreso ${d.vecesImpreso}x)` : 'Imprimir'}
                      className="inline-flex items-center gap-1 rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                    >
                      <Printer size={16} />
                      {d.vecesImpreso > 0 && <span className="text-xs">{d.vecesImpreso}x</span>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="Sin documentos emitidos"
          description="Los recibos y comprobantes de caja aparecerán aquí, incluyendo los que se generan automáticamente al registrar abonos."
        />
      )}

      <DocumentoFormModal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        cajaSesionId={caja?.id ?? null}
      />
    </div>
  );
}

function DocumentoFormModal({
  isOpen,
  onClose,
  cajaSesionId,
}: {
  isOpen: boolean;
  onClose: () => void;
  cajaSesionId: number | null;
}) {
  const crear = useCrearDocumentoCaja();
  const registrarImpresion = useRegistrarImpresion();

  const [tipo, setTipo] = useState<'RECIBO' | 'COMPROBANTE'>('RECIBO');
  const [concepto, setConcepto] = useState('');
  const [detalle, setDetalle] = useState('');
  const [personaRelacionada, setPersonaRelacionada] = useState('');
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [monto, setMonto] = useState('');
  const [error, setError] = useState<string | null>(null);

  function limpiarYCerrar() {
    setConcepto('');
    setDetalle('');
    setPersonaRelacionada('');
    setMonto('');
    setError(null);
    onClose();
  }

  async function handleSubmit() {
    setError(null);
    if (!cajaSesionId) {
      setError('No hay una caja abierta');
      return;
    }
    const montoNumerico = Number(monto);
    if (!concepto.trim() || !montoNumerico || montoNumerico <= 0) {
      setError('Completa el concepto y un monto mayor a cero');
      return;
    }

    try {
      const documento = await crear.mutateAsync({
        tipo,
        cajaSesionId,
        concepto,
        detalle: detalle || undefined,
        personaRelacionada: personaRelacionada || undefined,
        metodoPago,
        monto: montoNumerico,
      });
      await registrarImpresion.mutateAsync(documento.id);
      imprimirDocumentoCaja({ ...documento, vecesImpreso: documento.vecesImpreso + 1 });
      limpiarYCerrar();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo emitir el documento'));
    }
  }

  const pendiente = crear.isPending;

  return (
    <Modal isOpen={isOpen} onClose={limpiarYCerrar} title="Nuevo documento de caja" size="md">
      <div className="space-y-4">
        <div className="flex gap-1 rounded-lg bg-ink-50 p-1 text-sm font-medium">
          <button
            onClick={() => setTipo('RECIBO')}
            className={`flex-1 rounded-md py-2 transition-colors ${
              tipo === 'RECIBO' ? 'bg-white text-ink-800 shadow-sm' : 'text-ink-400 hover:text-ink-600'
            }`}
          >
            Recibo (entra dinero)
          </button>
          <button
            onClick={() => setTipo('COMPROBANTE')}
            className={`flex-1 rounded-md py-2 transition-colors ${
              tipo === 'COMPROBANTE' ? 'bg-white text-ink-800 shadow-sm' : 'text-ink-400 hover:text-ink-600'
            }`}
          >
            Comprobante (sale dinero)
          </button>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Concepto</span>
          <input
            className="input"
            placeholder="Ej: Consignación al banco, compra de insumos de aseo…"
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Monto</span>
            <input type="number" min={0} className="input" value={monto} onChange={(e) => setMonto(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Método</span>
            <select className="input" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="TARJETA">Tarjeta</option>
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Persona relacionada (opcional)</span>
          <input
            className="input"
            placeholder="Nombre de quien entrega o recibe el dinero"
            value={personaRelacionada}
            onChange={(e) => setPersonaRelacionada(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Detalle (opcional)</span>
          <textarea
            className="input"
            rows={2}
            value={detalle}
            onChange={(e) => setDetalle(e.target.value)}
          />
        </label>

        {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={limpiarYCerrar} className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={pendiente}
            className="flex items-center gap-2 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
          >
            {pendiente && <Loader2 size={16} className="animate-spin" />}
            Emitir e imprimir
          </button>
        </div>
      </div>
    </Modal>
  );
}
