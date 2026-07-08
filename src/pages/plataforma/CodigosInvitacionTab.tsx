import { useState } from 'react';
import { Plus, Copy, Check } from 'lucide-react';
import { useCodigosInvitacion, useGenerarCodigoInvitacion } from '@/hooks/usePlataforma';
import { LoadingState, EmptyState } from '@/components/ui/States';

export function CodigosInvitacionTab() {
  const { data: codigos, isLoading } = useCodigosInvitacion();
  const generar = useGenerarCodigoInvitacion();
  const [nota, setNota] = useState('');
  const [copiado, setCopiado] = useState<number | null>(null);

  async function handleGenerar() {
    await generar.mutateAsync(nota || undefined);
    setNota('');
  }

  function copiar(codigo: string, id: number) {
    navigator.clipboard.writeText(codigo);
    setCopiado(id);
    setTimeout(() => setCopiado(null), 1500);
  }

  return (
    <div>
      <p className="mb-4 text-sm text-ink-500">
        Solo alguien con un código válido y sin usar puede registrar una empresa nueva en el sistema.
      </p>

      <div className="mb-5 flex gap-2">
        <input
          className="input"
          placeholder="Nota (opcional, ej: 'Ferretería El Tornillo')"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
        />
        <button
          onClick={handleGenerar}
          disabled={generar.isPending}
          className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
        >
          <Plus size={16} />
          Generar código
        </button>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : codigos && codigos.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs text-ink-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Código</th>
                <th className="px-4 py-3 text-left font-medium">Nota</th>
                <th className="px-4 py-3 text-left font-medium">Estado</th>
                <th className="px-4 py-3 text-left font-medium">Empresa creada</th>
                <th className="px-4 py-3 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {codigos.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-mono font-medium text-ink-800">{c.codigo}</td>
                  <td className="px-4 py-3 text-ink-500">{c.nota ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        c.usado ? 'bg-ink-100 text-ink-500' : 'bg-success-50 text-success-600'
                      }`}
                    >
                      {c.usado ? 'Usado' : 'Disponible'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-500">{c.empresaCreada ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    {!c.usado && (
                      <button
                        onClick={() => copiar(c.codigo, c.id)}
                        title="Copiar código"
                        className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                      >
                        {copiado === c.id ? <Check size={16} className="text-success-500" /> : <Copy size={16} />}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="Sin códigos generados todavía" description="Genera uno arriba para compartirlo con tu próximo cliente." />
      )}
    </div>
  );
}
