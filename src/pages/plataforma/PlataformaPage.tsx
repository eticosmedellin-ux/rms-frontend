import { useEmpresasPlataforma, useSuspenderEmpresa, useActivarEmpresa } from '@/hooks/usePlataforma';
import { LoadingState, EmptyState } from '@/components/ui/States';

export default function PlataformaPage() {
  const { data: empresas, isLoading } = useEmpresasPlataforma();
  const suspender = useSuspenderEmpresa();
  const activar = useActivarEmpresa();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-800">Plataforma</h1>
      <p className="mt-1 text-sm text-ink-400">
        Todas las empresas que rentan el sistema. Este panel solo lo ves tú, como superadministrador.
      </p>

      {isLoading ? (
        <div className="mt-6">
          <LoadingState />
        </div>
      ) : empresas && empresas.length > 0 ? (
        <div className="mt-6 overflow-x-auto rounded-xl border border-ink-100 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs text-ink-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Empresa</th>
                <th className="px-4 py-3 text-left font-medium">NIT</th>
                <th className="px-4 py-3 text-right font-medium">Usuarios</th>
                <th className="px-4 py-3 text-left font-medium">Registrada</th>
                <th className="px-4 py-3 text-left font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {empresas.map((e) => (
                <tr key={e.id} className="hover:bg-ink-50/60">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-800">{e.nombreComercial ?? e.nombre}</p>
                    <p className="text-xs text-ink-400">{e.nombre}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-500">{e.nit ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-ink-700">{e.cantidadUsuarios}</td>
                  <td className="px-4 py-3 text-ink-500">
                    {new Date(e.creadoEn).toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        e.estado ? 'bg-success-50 text-success-600' : 'bg-danger-50 text-danger-600'
                      }`}
                    >
                      {e.estado ? 'Activa' : 'Suspendida'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {e.estado ? (
                      <button
                        onClick={() => suspender.mutate(e.id)}
                        className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 hover:border-danger-500 hover:text-danger-500"
                      >
                        Suspender
                      </button>
                    ) : (
                      <button
                        onClick={() => activar.mutate(e.id)}
                        className="rounded-lg bg-ink-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink-700"
                      >
                        Reactivar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState title="Sin empresas registradas todavía" />
        </div>
      )}
    </div>
  );
}
