import { useAuditoria } from '@/hooks/useGestion';
import { LoadingState, EmptyState } from '@/components/ui/States';

const ACCION_TONES: Record<string, string> = {
  CREAR: 'bg-success-50 text-success-600',
  EDITAR: 'bg-amber-100 text-amber-700',
  CAMBIO_PRECIO: 'bg-amber-100 text-amber-700',
  AJUSTE: 'bg-amber-100 text-amber-700',
  ABRIR: 'bg-success-50 text-success-600',
  CERRAR: 'bg-ink-100 text-ink-600',
};

export function AuditoriaTab() {
  const { data: registros, isLoading } = useAuditoria();

  if (isLoading) return <LoadingState />;
  if (!registros || registros.length === 0) {
    return (
      <EmptyState
        title="Sin registros de auditoría todavía"
        description="Aquí quedan las acciones sensibles: crear usuarios, cambios de precio, ajustes de inventario, apertura y cierre de caja."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white shadow-card">
      <table className="w-full text-sm">
        <thead className="border-b border-ink-100 bg-ink-50 text-xs text-ink-500">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Fecha</th>
            <th className="px-4 py-3 text-left font-medium">Usuario</th>
            <th className="px-4 py-3 text-left font-medium">Módulo</th>
            <th className="px-4 py-3 text-left font-medium">Acción</th>
            <th className="px-4 py-3 text-left font-medium">Entidad</th>
            <th className="px-4 py-3 text-left font-medium">Detalle</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-50">
          {registros.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-3 text-ink-500">
                {new Date(r.fecha).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
              </td>
              <td className="px-4 py-3 text-ink-700">{r.usuario}</td>
              <td className="px-4 py-3 text-ink-500">{r.modulo}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ACCION_TONES[r.accion] ?? 'bg-ink-100 text-ink-600'}`}>
                  {r.accion.replaceAll('_', ' ')}
                </span>
              </td>
              <td className="px-4 py-3 text-ink-500">
                {r.entidad}
                {r.entidadId ? ` #${r.entidadId}` : ''}
              </td>
              <td className="px-4 py-3 text-xs text-ink-400">
                {r.detalle ? Object.entries(r.detalle).map(([k, v]) => `${k}: ${v}`).join(', ') : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
