import type { EstadoCuentaCliente } from '@/types/pos';
import type { Empresa } from '@/types/gestion';
import { estiloPagina } from '@/lib/tamanoImpresion';

export function abrirEstadoCuenta(estado: EstadoCuentaCliente, empresa: Empresa) {
  const ventana = window.open('', '_blank', 'width=820,height=1000');
  if (!ventana) return;

  ventana.document.write(construirHtml(estado, empresa));
  ventana.document.close();
  ventana.focus();
  setTimeout(() => ventana.print(), 300);
}

function construirHtml(estado: EstadoCuentaCliente, empresa: Empresa): string {
  const nombreEmpresa = empresa.nombreComercial || empresa.nombre;
  const hoy = new Date().toLocaleDateString('es-CO', { dateStyle: 'long' });
  const pagina = estiloPagina(empresa);

  const filas = estado.movimientos
    .map(
      (m, i) => `
        <tr class="${i % 2 === 0 ? 'par' : ''}">
          <td>${new Date(m.fecha).toLocaleDateString('es-CO')}</td>
          <td>${m.documento}</td>
          <td>${escapeHtml(m.concepto)}</td>
          <td class="num">${m.cargo ? formatearMoneda(m.cargo) : '—'}</td>
          <td class="num">${m.abono ? formatearMoneda(m.abono) : '—'}</td>
          <td class="num total-linea">${formatearMoneda(m.saldoAcumulado)}</td>
        </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>Estado de cuenta - ${escapeHtml(estado.clienteNombre)}</title>
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
  .doc-tipo .fecha { font-size: 11.5px; color: #64748b; margin-top: 6px; }
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
  .resumen {
    margin-top: 18px; display: flex; justify-content: flex-end;
  }
  .resumen-caja {
    border: 2px solid #0f172a; border-radius: 8px; padding: 14px 22px; text-align: right;
  }
  .resumen-caja .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; }
  .resumen-caja .valor { font-size: 22px; font-weight: 800; color: #0f172a; }
</style>
</head>
<body>
  <div class="encabezado">
    <div class="marca-nombre">${escapeHtml(nombreEmpresa)}</div>
    <div class="doc-tipo">
      <div class="titulo">Estado de cuenta</div>
      <div class="fecha">Generado el ${hoy}</div>
    </div>
  </div>

  <div class="bloques">
    <div class="bloque">
      <h3>Cliente</h3>
      <p>${escapeHtml(estado.clienteNombre)}</p>
    </div>
    <div class="bloque">
      <h3>Límite de crédito</h3>
      <p>${formatearMoneda(estado.limiteCredito)}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Fecha</th>
        <th>Documento</th>
        <th>Concepto</th>
        <th class="num">Cargo</th>
        <th class="num">Abono</th>
        <th class="num">Saldo</th>
      </tr>
    </thead>
    <tbody>
      ${filas || '<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:20px;">Sin movimientos todavía</td></tr>'}
    </tbody>
  </table>

  <div class="resumen">
    <div class="resumen-caja">
      <div class="label">Saldo actual</div>
      <div class="valor">${formatearMoneda(estado.saldoActual)}</div>
    </div>
  </div>
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
