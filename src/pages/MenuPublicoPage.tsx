import { useSearchParams } from 'react-router-dom';
import { useMenuPublico } from '@/hooks/useMenu';

export default function MenuPublicoPage() {
  const [searchParams] = useSearchParams();
  const sucursalParam = searchParams.get('sucursal');
  const sucursalId = sucursalParam ? Number(sucursalParam) : null;
  const { data: archivos, isLoading, isError } = useMenuPublico(sucursalId);

  return (
    <div className="min-h-screen bg-ink-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-center font-display text-2xl font-bold text-ink-800">Menú</h1>

        {!sucursalId ? (
          <p className="mt-8 text-center text-sm text-ink-400">Enlace de menú inválido — falta indicar el negocio.</p>
        ) : isLoading ? (
          <p className="mt-8 text-center text-sm text-ink-400">Cargando menú...</p>
        ) : isError || !archivos || archivos.length === 0 ? (
          <p className="mt-8 text-center text-sm text-ink-400">
            Este negocio todavía no ha subido su menú digital — pregúntale a tu mesero.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {archivos.map((a) =>
              a.tipoArchivo === 'PDF' ? (
                <embed key={a.id} src={a.contenido} type="application/pdf" className="h-[80vh] w-full rounded-xl border border-ink-100 shadow-card" />
              ) : (
                <img key={a.id} src={a.contenido} alt={a.nombre} className="w-full rounded-xl border border-ink-100 shadow-card" />
              )
            )}
          </div>
        )}

        <p className="mt-10 text-center text-[11px] text-ink-300">Generado con SICOM — Sistema Integrado Comercial</p>
      </div>
    </div>
  );
}
