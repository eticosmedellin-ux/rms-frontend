import type { Empresa } from '@/types/gestion';

export interface EstiloPagina {
  /** Va dentro de un bloque @media print { @page { ... } } */
  reglaPagina: string;
  /** Ancho máximo recomendado para el contenido (además del tamaño real de página). */
  anchoMaximo: string;
  /** Tamaño de fuente base — más chico para tirillas térmicas angostas. */
  fontSize: string;
}

/** Traduce la configuración de impresión de la empresa (Configuración → Impresión) al CSS
 *  que hay que aplicar en cualquier documento imprimible del sistema: facturas, recibos,
 *  comprobantes, cotizaciones, compras, gastos y reportes. */
export function estiloPagina(empresa: Pick<Empresa, 'tamanoImpresion' | 'anchoPersonalizadoMm' | 'altoPersonalizadoMm'>): EstiloPagina {
  switch (empresa.tamanoImpresion) {
    case 'TERMICA_58':
      return { reglaPagina: 'size: 58mm auto; margin: 2mm;', anchoMaximo: '54mm', fontSize: '11px' };
    case 'TERMICA_80':
      return { reglaPagina: 'size: 80mm auto; margin: 3mm;', anchoMaximo: '76mm', fontSize: '12px' };
    case 'MEDIA_CARTA':
      return { reglaPagina: 'size: 5.5in 8.5in; margin: 10mm;', anchoMaximo: '100%', fontSize: '13px' };
    case 'CARTA':
      return { reglaPagina: 'size: letter; margin: 15mm;', anchoMaximo: '100%', fontSize: '13px' };
    case 'PERSONALIZADO':
      return {
        reglaPagina: `size: ${empresa.anchoPersonalizadoMm ?? 210}mm ${empresa.altoPersonalizadoMm ?? 297}mm; margin: 10mm;`,
        anchoMaximo: '100%',
        fontSize: '13px',
      };
    case 'A4':
    default:
      return { reglaPagina: 'size: A4; margin: 15mm;', anchoMaximo: '100%', fontSize: '13px' };
  }
}

export const ETIQUETAS_TAMANO_IMPRESION: Record<string, string> = {
  TERMICA_58: 'Tirilla térmica 58mm',
  TERMICA_80: 'Tirilla térmica 80mm',
  MEDIA_CARTA: 'Media carta',
  CARTA: 'Carta',
  A4: 'A4',
  PERSONALIZADO: 'Personalizado',
};
