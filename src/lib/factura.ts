import type { Venta } from '@/types/pos';
import type { Empresa } from '@/types/gestion';
import { estiloPagina } from '@/lib/tamanoImpresion';

/** Genera y abre una factura con diseño profesional en una ventana nueva, lista para
 *  imprimir o "Guardar como PDF" desde el diálogo de impresión del navegador. */
export function abrirFactura(venta: Venta, empresa: Empresa) {
  const ventana = window.open('', '_blank', 'width=820,height=1000');
  if (!ventana) return;

  ventana.document.write(construirHtmlFactura(venta, empresa));
  ventana.document.close();
  ventana.focus();
  setTimeout(() => ventana.print(), 300); // pequeña espera para que cargue el logo si hay uno
}

function construirHtmlFactura(venta: Venta, empresa: Empresa): string {
  const nombreEmpresa = empresa.nombreComercial || empresa.nombre;
  const fecha = new Date(venta.fecha).toLocaleString('es-CO', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
  const numero = venta.numeroFactura || venta.numero;
  const esFacturaFormal = !!venta.numeroFactura;
  const pagina = estiloPagina(empresa);

  const filas = venta.detalles
    .map(
      (d, i) => `
        <tr class="${i % 2 === 0 ? 'par' : ''}">
          <td>${escapeHtml(d.producto)}</td>
          <td class="num">${formatearNumero(d.cantidad)}</td>
          <td class="num">${formatearMoneda(d.precioUnitario)}</td>
          <td class="num">${d.descuentoLinea > 0 ? '-' + formatearMoneda(d.descuentoLinea) : '—'}</td>
          <td class="num total-linea">${formatearMoneda(d.subtotalLinea)}</td>
        </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>${numero}</title>
<style>
  @media print {
    @page { ${pagina.reglaPagina} }
  }
  * { box-sizing: border-box; }
  body {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    color: #1f2933;
    margin: 0 auto;
    padding: ${pagina.anchoMaximo === '100%' ? '40px' : '10px'};
    background: #fff;
    font-size: ${pagina.fontSize};
    line-height: 1.5;
    max-width: ${pagina.anchoMaximo};
  }
  .encabezado {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 3px solid #0f172a;
    padding-bottom: 20px;
    margin-bottom: 24px;
  }
  .marca { display: flex; gap: 14px; align-items: center; }
  .marca img { height: 56px; width: auto; object-fit: contain; }
  .marca-nombre { font-size: 22px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px; }
  .marca-datos { font-size: 11.5px; color: #64748b; margin-top: 2px; line-height: 1.6; }
  .doc-tipo {
    text-align: right;
  }
  .doc-tipo .titulo {
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: ${esFacturaFormal ? '#0f172a' : '#94a3b8'};
    font-weight: 700;
  }
  .doc-tipo .numero {
    font-size: 26px;
    font-weight: 800;
    color: #0f172a;
    margin-top: 2px;
    font-variant-numeric: tabular-nums;
  }
  .doc-tipo .fecha { font-size: 11.5px; color: #64748b; margin-top: 6px; }
  .aviso-no-formal {
    display: inline-block;
    margin-top: 6px;
    font-size: 10.5px;
    background: #fef3c7;
    color: #92400e;
    padding: 3px 8px;
    border-radius: 999px;
    font-weight: 600;
  }

  .bloques {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 26px;
  }
  .bloque h3 {
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: #94a3b8;
    margin: 0 0 6px;
    font-weight: 700;
  }
  .bloque p { margin: 0; font-size: 13.5px; color: #1f2933; }
  .bloque .secundario { font-size: 12px; color: #64748b; margin-top: 2px; }

  table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
  thead th {
    text-align: left;
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #fff;
    background: #0f172a;
    padding: 10px 12px;
  }
  thead th.num { text-align: right; }
  tbody td { padding: 9px 12px; border-bottom: 1px solid #eef1f4; font-size: 13px; }
  tbody tr.par { background: #f8fafc; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  td.total-linea { font-weight: 600; }

  .resumen {
    display: flex;
    justify-content: flex-end;
    margin-top: 18px;
  }
  .resumen table { width: 280px; }
  .resumen td { padding: 6px 4px; font-size: 13px; border: none; }
  .resumen td.label { color: #64748b; }
  .resumen td.valor { text-align: right; font-variant-numeric: tabular-nums; }
  .resumen tr.total td {
    border-top: 2px solid #0f172a;
    font-size: 17px;
    font-weight: 800;
    color: #0f172a;
    padding-top: 10px;
  }
  .resumen tr.cambio td { color: #b45309; font-weight: 600; }

  .pie {
    margin-top: 40px;
    padding-top: 18px;
    border-top: 1px solid #eef1f4;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .pie .gracias { font-size: 15px; font-weight: 700; color: #0f172a; }
  .pie .gracias-sub { font-size: 12px; color: #64748b; margin-top: 2px; }
  .pie .atendido { font-size: 11.5px; color: #94a3b8; text-align: right; }
  .info-extra {
    margin-top: 16px; padding-top: 12px; border-top: 1px dashed #dbe1e8;
    display: flex; justify-content: space-between; gap: 20px; flex-wrap: wrap;
  }
  .info-extra-bloque { display: flex; flex-direction: column; gap: 2px; font-size: 11px; color: #64748b; }
  .info-extra-titulo { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; }
  .info-extra-redes { text-align: right; align-items: flex-end; }
</style>
</head>
<body>

  <div class="encabezado">
    <div class="marca">
      ${empresa.logoUrl ? `<img src="${empresa.logoUrl}" alt="Logo" />` : ''}
      <div>
        <div class="marca-nombre">${escapeHtml(nombreEmpresa)}</div>
        <div class="marca-datos">
          ${empresa.nit ? `NIT ${escapeHtml(empresa.nit)}<br/>` : ''}
          ${empresa.direccion ? `${escapeHtml(empresa.direccion)}<br/>` : ''}
          ${[empresa.telefono, empresa.email].filter(Boolean).map(escapeHtml).join(' · ')}
        </div>
      </div>
    </div>
    <div class="doc-tipo">
      <div class="titulo">${esFacturaFormal ? 'Factura de venta' : 'Comprobante de venta'}</div>
      <div class="numero">${numero}</div>
      <div class="fecha">${fecha}</div>
      ${!esFacturaFormal ? '<div class="aviso-no-formal">Sin factura formal</div>' : ''}
    </div>
  </div>

  <div class="bloques">
    <div class="bloque">
      <h3>Cliente</h3>
      <p>${escapeHtml(venta.cliente)}</p>
      <p class="secundario">${venta.tipoVenta === 'CREDITO' ? 'Venta a crédito' : 'Venta de contado'}</p>
    </div>
    <div class="bloque">
      <h3>Detalles del pago</h3>
      <p>Total pagado: ${formatearMoneda(venta.total + venta.cambio)}</p>
      ${venta.cambio > 0 ? `<p class="secundario">Cambio entregado: ${formatearMoneda(venta.cambio)}</p>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Producto</th>
        <th class="num">Cant.</th>
        <th class="num">Precio</th>
        <th class="num">Descuento</th>
        <th class="num">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${filas}
    </tbody>
  </table>

  <div class="resumen">
    <table>
      <tr><td class="label">Subtotal</td><td class="valor">${formatearMoneda(venta.subtotal)}</td></tr>
      ${
        venta.descuento > 0
          ? `<tr><td class="label">Descuento${venta.descuentoPorcentaje ? ` (${venta.descuentoPorcentaje}%)` : ''}${venta.tipoDescuentoNombre ? ` — ${escapeHtml(venta.tipoDescuentoNombre)}` : ''}</td><td class="valor">-${formatearMoneda(venta.descuento)}</td></tr>`
          : ''
      }
      <tr class="total"><td>Total</td><td class="valor">${formatearMoneda(venta.total)}</td></tr>
      ${venta.cambio > 0 ? `<tr class="cambio"><td>Cambio</td><td class="valor">${formatearMoneda(venta.cambio)}</td></tr>` : ''}
    </table>
  </div>

  <div class="pie">
    <div>
      <div class="gracias">${escapeHtml(empresa.mensajeAgradecimiento) || '¡Gracias por tu compra!'}</div>
      ${empresa.infoAdicionalDocumentos ? `<div class="gracias-sub">${escapeHtml(empresa.infoAdicionalDocumentos)}</div>` : ''}
    </div>
    <div class="atendido">Documento generado por ${escapeHtml(nombreEmpresa)}</div>
  </div>

  ${(empresa.bancoNombre || empresa.facebook || empresa.instagram || empresa.whatsapp || empresa.sitioWeb) ? `
  <div class="info-extra">
    ${empresa.bancoNombre ? `
      <div class="info-extra-bloque">
        <span class="info-extra-titulo">Pagos por transferencia</span>
        <span>${escapeHtml(empresa.bancoNombre)} — ${escapeHtml(empresa.bancoTipoCuenta ?? '')} ${escapeHtml(empresa.bancoNumeroCuenta ?? '')}</span>
        ${empresa.bancoTitular ? `<span>A nombre de: ${escapeHtml(empresa.bancoTitular)}</span>` : ''}
      </div>` : ''}
    <div class="info-extra-bloque info-extra-redes">
      ${empresa.sitioWeb ? `<span>${escapeHtml(empresa.sitioWeb)}</span>` : ''}
      ${empresa.whatsapp ? `<span>WhatsApp: ${escapeHtml(empresa.whatsapp)}</span>` : ''}
      ${empresa.facebook ? `<span>Facebook: ${escapeHtml(empresa.facebook)}</span>` : ''}
      ${empresa.instagram ? `<span>Instagram: ${escapeHtml(empresa.instagram)}</span>` : ''}
    </div>
  </div>` : ''}

</body>
</html>`;
}

function formatearMoneda(valor: number): string {
  return `$${valor.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`;
}

function formatearNumero(valor: number): string {
  return valor.toLocaleString('es-CO', { maximumFractionDigits: 2 });
}

function escapeHtml(texto: string | null | undefined): string {
  if (!texto) return '';
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
