import { useHistorialAcceso } from '@/hooks/useGestion';
import { LoadingState, EmptyState } from '@/components/ui/States';

export function HistorialAccesoTab() {
  const { data: registros, isLoading } = useHistorialAcceso();

  if (isLoading) return <LoadingState />;
  if (!registros || registros.length === 0) {
    return <EmptyState title="Sin registros de acceso todavía" />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white shadow-card">
      <table className="w-full text-sm">
        <thead className="border-b border-ink-100 bg-ink-50 text-xs text-ink-500">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Fecha</th>
            <th className="px-4 py-3 text-left font-medium">Usuario</th>
            <th className="px-4 py-3 text-left font-medium">IP</th>
            <th className="px-4 py-3 text-left font-medium">Dispositivo</th>
            <th className="px-4 py-3 text-left font-medium">Resultado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-50">
          {registros.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-3 text-ink-500">
                {new Date(r.fecha).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
              </td>
              <td className="px-4 py-3 text-ink-700">{r.usuario}</td>
              <td className="px-4 py-3 text-ink-500">{r.ip ?? '—'}</td>
              <td className="max-w-xs truncate px-4 py-3 text-xs text-ink-400">{r.dispositivo ?? '—'}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    r.exitoso ? 'bg-success-50 text-success-600' : 'bg-danger-50 text-danger-600'
                  }`}
                >
                  {r.exitoso ? 'Exitoso' : 'Fallido'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
