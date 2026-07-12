import type { Cotizacion } from '@/types/pos';
import type { Empresa } from '@/types/gestion';
import { estiloPagina } from '@/lib/tamanoImpresion';

export function abrirCotizacion(cotizacion: Cotizacion, empresa: Empresa) {
  const ventana = window.open('', '_blank', 'width=820,height=1000');
  if (!ventana) return;

  ventana.document.write(construirHtml(cotizacion, empresa));
  ventana.document.close();
  ventana.focus();
  setTimeout(() => ventana.print(), 300);
}

function construirHtml(cotizacion: Cotizacion, empresa: Empresa): string {
  const nombreEmpresa = empresa.nombreComercial || empresa.nombre;
  const numero = `COT-${String(cotizacion.id).padStart(6, '0')}`;
  const fecha = new Date(cotizacion.fecha).toLocaleDateString('es-CO', { dateStyle: 'long' });
  const pagina = estiloPagina(empresa);

  const subtotal = cotizacion.detalles.reduce((acc, d) => acc + d.cantidad * d.precioUnitario, 0);

  const filas = cotizacion.detalles
    .map(
      (d, i) => `
        <tr class="${i % 2 === 0 ? 'par' : ''}">
          <td>${escapeHtml(d.producto)}</td>
          <td class="num">${d.cantidad}</td>
          <td class="num">${formatearMoneda(d.precioUnitario)}</td>
          <td class="num total-linea">${formatearMoneda(d.cantidad * d.precioUnitario)}</td>
        </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>Cotizacion ${numero}</title>
<style>
  @media print { @page { ${pagina.reglaPagina} } }
  * { box-sizing: border-box; }
  body {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    color: #1f2933; margin: 0 auto; padding: ${pagina.anchoMaximo === '100%' ? '40px' : '10px'};
    background: #fff; font-size: ${pagina.fontSize}; line-height: 1.5; max-width: ${pagina.anchoMaximo};
  }
  .encabezado {
    display: flex; justify-content: space-between; align-items: flex-start;
    border-bottom: 3px solid #0f172a; padding-bottom: 20px; margin-bottom: 24px;
  }
  .marca-nombre { font-size: 20px; font-weight: 700; color: #0f172a; }
  .doc-tipo { text-align: right; }
  .doc-tipo .titulo { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #0f172a; font-weight: 700; }
  .doc-tipo .numero { font-size: 13px; color: #1f2933; margin-top: 4px; }
  .doc-tipo .fecha { font-size: 11.5px; color: #64748b; margin-top: 4px; }
  .bloques { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 26px; }
  .bloque h3 { font-size: 10.5px; text-transform: uppercase; letter-spacing: 1.2px; color: #94a3b8; margin: 0 0 6px; font-weight: 700; }
  .bloque p { margin: 0; font-size: 13.5px; color: #1f2933; }
  table { width: 100%; border-collapse: collapse; }
  thead th {
    text-align: left; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.8px;
    color: #fff; background: #0f172a; padding: 10px 12px;
  }
  thead th.num { text-align: right; }
  tbody td { padding: 9px 12px; border-bottom: 1px solid #eef1f4; font-size: 13px; }
  tbody tr.par { background: #f8fafc; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  td.total-linea { font-weight: 600; }
  .resumen { margin-top: 18px; display: flex; justify-content: flex-end; }
  .resumen-caja { border: 2px solid #0f172a; border-radius: 8px; padding: 14px 22px; text-align: right; }
  .resumen-caja .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; }
  .resumen-caja .valor { font-size: 22px; font-weight: 800; color: #0f172a; }
  .aviso { margin-top: 24px; padding: 12px 16px; background: #f8fafc; border-radius: 8px; font-size: 12px; color: #64748b; }
</style>
</head>
<body>
  <div class="encabezado">
    <div class="marca-nombre">${escapeHtml(nombreEmpresa)}</div>
    <div class="doc-tipo">
      <div class="titulo">Cotizacion</div>
      <div class="numero">${numero}</div>
      <div class="fecha">${fecha}</div>
    </div>
  </div>

  <div class="bloques">
    <div class="bloque">
      <h3>Cliente</h3>
      <p>${escapeHtml(cotizacion.cliente ?? 'Sin especificar')}</p>
    </div>
    <div class="bloque">
      <h3>Valida hasta</h3>
      <p>${cotizacion.validaHasta ? new Date(cotizacion.validaHasta).toLocaleDateString('es-CO') : 'Sin vencimiento'}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Producto</th>
        <th class="num">Cantidad</th>
        <th class="num">Precio unitario</th>
        <th class="num">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${filas}
    </tbody>
  </table>

  <div class="resumen">
    <div class="resumen-caja">
      <div class="label">Total cotizado</div>
      <div class="valor">${formatearMoneda(subtotal)}</div>
    </div>
  </div>

  <div class="aviso">Esta cotizacion no constituye una factura ni un documento fiscal. Los precios pueden variar hasta el momento de confirmar la compra.</div>
</body>
</html>`;
}

function formatearMoneda(valor: number): string {
  return `$${valor.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`;
}

function escapeHtml(texto: string | null | undefined): string {
  if (!texto) return '';
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
