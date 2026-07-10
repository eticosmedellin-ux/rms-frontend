import type { DocumentoCaja } from '@/types/pos';

/** Abre una ventana de impresión con el formato de recibo/comprobante/nota crédito.
 *  Reutilizado tanto en la pestaña de Caja como en el módulo unificado de Documentos. */
export function imprimirDocumentoCaja(doc: DocumentoCaja) {
  const ventana = window.open('', '_blank', 'width=380,height=600');
  if (!ventana) return;

  const fecha = new Date(doc.fecha).toLocaleString('es-CO');
  const titulo =
    doc.tipo === 'RECIBO'
      ? 'RECIBO DE CAJA'
      : doc.tipo === 'NOTA_CREDITO'
        ? 'NOTA CRÉDITO'
        : doc.tipo === 'NOTA_DEBITO'
          ? 'NOTA DÉBITO'
          : 'COMPROBANTE DE CAJA';
  const etiquetaPersona =
    doc.tipo === 'RECIBO' ? 'Recibido de' : doc.tipo === 'COMPROBANTE' ? 'Pagado a' : 'Cliente';

  const html = `
    <html>
      <head>
        <title>${doc.numero}</title>
        <style>
          body { font-family: monospace; font-size: 13px; padding: 16px; color: #1f2933; }
          h1 { font-size: 16px; margin: 0 0 4px; }
          .linea { display: flex; justify-content: space-between; margin: 4px 0; }
          .total { font-size: 15px; font-weight: bold; border-top: 1px dashed #999; margin-top: 10px; padding-top: 8px; }
          .muted { color: #666; font-size: 11px; }
          hr { border: none; border-top: 1px dashed #999; margin: 10px 0; }
        </style>
      </head>
      <body>
        <h1>${titulo}</h1>
        <div class="muted">${doc.numero}</div>
        <hr />
        <div class="linea"><span>Fecha</span><span>${fecha}</span></div>
        <div class="linea"><span>Concepto</span><span>${doc.concepto}</span></div>
        ${doc.personaRelacionada ? `<div class="linea"><span>${etiquetaPersona}</span><span>${doc.personaRelacionada}</span></div>` : ''}
        <div class="linea"><span>Método de pago</span><span>${doc.metodoPago}</span></div>
        ${doc.detalle ? `<div class="linea"><span>Detalle</span><span>${doc.detalle}</span></div>` : ''}
        <div class="linea"><span>Emitido por</span><span>${doc.usuario}</span></div>
        <div class="total linea"><span>Monto</span><span>$${doc.monto.toLocaleString('es-CO')}</span></div>
        <div class="muted" style="margin-top:12px;">Impresión ${doc.vecesImpreso > 1 ? `#${doc.vecesImpreso} (reimpresión)` : '#1'}</div>
      </body>
    </html>
  `;
  ventana.document.write(html);
  ventana.document.close();
  ventana.focus();
  ventana.print();
}
