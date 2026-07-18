import { useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useImportarProductos } from '@/hooks/useInventario';
import { getApiErrorMessage } from '@/api/errors';
import type { FilaImportacionProducto, ImportacionResultado } from '@/types/inventario';

const EJEMPLO = `codigoInterno,nombre,precioCompra,precioVenta,categoria,marca
PROD-010,Aceite 1L,4500,6000,Abarrotes,Genérica
PROD-011,Panela 500g,1800,2500,Abarrotes,Genérica`;

export function ImportarProductosModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const importar = useImportarProductos();
  const [texto, setTexto] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ImportacionResultado | null>(null);

  function parsearCsv(texto: string): FilaImportacionProducto[] {
    const lineas = texto.trim().split('\n').filter((l) => l.trim().length > 0);
    if (lineas.length < 2) return [];

    const encabezados = lineas[0].split(',').map((h) => h.trim());
    return lineas.slice(1).map((linea) => {
      const valores = linea.split(',').map((v) => v.trim());
      const fila: Record<string, string> = {};
      encabezados.forEach((h, i) => {
        fila[h] = valores[i] ?? '';
      });
      return {
        codigoInterno: fila.codigoInterno ?? '',
        codigoBarras: fila.codigoBarras || undefined,
        nombre: fila.nombre ?? '',
        categoria: fila.categoria || undefined,
        marca: fila.marca || undefined,
        unidadMedida: fila.unidadMedida || undefined,
        precioCompra: fila.precioCompra ? Number(fila.precioCompra) : undefined,
        precioVenta: fila.precioVenta ? Number(fila.precioVenta) : undefined,
      };
    });
  }

  async function handleSubmit() {
    setError(null);
    setResultado(null);
    const filas = parsearCsv(texto);
    if (filas.length === 0) {
      setError('Pega al menos una fila de datos (con encabezado + una línea por producto)');
      return;
    }

    try {
      const res = await importar.mutateAsync({ archivoNombre: 'importacion_manual.csv', filas });
      setResultado(res);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo procesar la importación'));
    }
  }

  function handleClose() {
    setTexto('');
    setResultado(null);
    setError(null);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importar productos" size="lg">
      {resultado ? (
        <div className="space-y-4">
          <div
            className={`rounded-lg px-4 py-3 text-sm ${
              resultado.estado === 'COMPLETADA' ? 'bg-success-50 text-success-600' : 'bg-amber-50 text-amber-700'
            }`}
          >
            {resultado.filasExitosas} de {resultado.totalFilas} productos importados correctamente.
            {resultado.filasFallidas > 0 && ` ${resultado.filasFallidas} fila(s) con error.`}
          </div>

          {resultado.errores.length > 0 && (
            <div className="max-h-56 overflow-x-auto overflow-y-auto rounded-lg border border-danger-50">
              <table className="w-full text-sm">
                <thead className="bg-danger-50 text-xs text-danger-600">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Fila</th>
                    <th className="px-3 py-2 text-left font-medium">Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-50">
                  {resultado.errores.map((e, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-ink-600">{e.fila}</td>
                      <td className="px-3 py-2 text-ink-600">{e.mensajeError}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <button
            onClick={handleClose}
            className="w-full rounded-lg bg-ink-800 py-2 text-sm font-semibold text-white hover:bg-ink-700"
          >
            Listo
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-ink-500">
            Pega el contenido separado por comas, con encabezado en la primera línea. Las filas con error no
            bloquean el resto — se importa lo válido y te decimos qué falló.
          </p>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Datos (formato CSV)</span>
            <textarea
              className="input font-mono text-xs"
              rows={8}
              placeholder={EJEMPLO}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
          </label>

          <button onClick={() => setTexto(EJEMPLO)} className="text-xs font-medium text-ink-500 hover:text-ink-800">
            Usar ejemplo
          </button>

          {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={handleClose}
              className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={importar.isPending}
              className="flex items-center gap-2 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
            >
              {importar.isPending ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              Importar
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
