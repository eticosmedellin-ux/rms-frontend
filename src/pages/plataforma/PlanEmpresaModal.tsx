import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useCatalogoRutas, usePlanEmpresa, useActualizarPlanEmpresa } from '@/hooks/usePlataforma';
import { LoadingState } from '@/components/ui/States';
import { getApiErrorMessage } from '@/api/errors';
import { Loader2 } from 'lucide-react';
import type { EstadoLicencia } from '@/types/gestion';

const PLANTILLAS: Record<string, string[]> = {
  Básico: ['ventas', 'productos', 'caja', 'documentos-caja'],
  Profesional: [
    'ventas', 'productos', 'caja', 'documentos-caja', 'cotizaciones', 'tipos-descuento',
    'clientes', 'cuentas-por-cobrar', 'proveedores', 'cuentas-por-pagar', 'reportes', 'alertas', 'nomina',
  ],
};

export function PlanEmpresaModal({
  isOpen,
  onClose,
  empresaId,
  empresaNombre,
}: {
  isOpen: boolean;
  onClose: () => void;
  empresaId: number | null;
  empresaNombre: string;
}) {
  const { data: catalogo, isLoading: cargandoCatalogo } = useCatalogoRutas();
  const { data: plan, isLoading: cargandoPlan } = usePlanEmpresa(empresaId);
  const actualizar = useActualizarPlanEmpresa();

  const [nombrePlan, setNombrePlan] = useState('Personalizado');
  const [estadoLicencia, setEstadoLicencia] = useState<EstadoLicencia>('ACTIVA');
  const [maxSucursales, setMaxSucursales] = useState('');
  const [maxUsuarios, setMaxUsuarios] = useState('');
  const [rutas, setRutas] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    if (plan) {
      setNombrePlan(plan.nombrePlan);
      setEstadoLicencia(plan.estadoLicencia);
      setMaxSucursales(plan.maxSucursales ? String(plan.maxSucursales) : '');
      setMaxUsuarios(plan.maxUsuarios ? String(plan.maxUsuarios) : '');
      setRutas(new Set(plan.rutasHabilitadas));
    }
    setGuardado(false);
    setError(null);
  }, [plan, isOpen]);

  const categorias = useMemo(() => {
    const mapa = new Map<string, { ruta: string; etiqueta: string }[]>();
    for (const r of catalogo ?? []) {
      if (!mapa.has(r.categoria)) mapa.set(r.categoria, []);
      mapa.get(r.categoria)!.push({ ruta: r.ruta, etiqueta: r.etiqueta });
    }
    return mapa;
  }, [catalogo]);

  function toggleRuta(ruta: string) {
    setRutas((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(ruta)) nuevo.delete(ruta);
      else nuevo.add(ruta);
      return nuevo;
    });
  }

  function aplicarPlantilla(nombre: string) {
    setNombrePlan(nombre);
    if (nombre === 'Empresarial') {
      setRutas(new Set((catalogo ?? []).map((r) => r.ruta)));
    } else {
      setRutas(new Set(PLANTILLAS[nombre] ?? []));
    }
  }

  async function handleGuardar() {
    if (!empresaId) return;
    setError(null);
    setGuardado(false);
    try {
      await actualizar.mutateAsync({
        empresaId,
        data: {
          nombrePlan,
          estadoLicencia,
          maxSucursales: maxSucursales ? Number(maxSucursales) : null,
          maxUsuarios: maxUsuarios ? Number(maxUsuarios) : null,
          rutasHabilitadas: Array.from(rutas),
        },
      });
      setGuardado(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo guardar el plan'));
    }
  }

  const cargando = cargandoCatalogo || cargandoPlan;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Plan de ${empresaNombre}`} size="lg">
      {cargando ? (
        <LoadingState />
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2">
            {['Básico', 'Profesional', 'Empresarial'].map((p) => (
              <button
                key={p}
                onClick={() => aplicarPlantilla(p)}
                className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-50"
              >
                Usar plantilla {p}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-700">Nombre del plan</span>
              <input className="input" value={nombrePlan} onChange={(e) => setNombrePlan(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-700">Estado de la licencia</span>
              <select
                className="input"
                value={estadoLicencia}
                onChange={(e) => setEstadoLicencia(e.target.value as EstadoLicencia)}
              >
                <option value="ACTIVA">Activa</option>
                <option value="SUSPENDIDA">Suspendida</option>
                <option value="VENCIDA">Vencida</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-700">Máximo de sucursales</span>
              <input
                type="number"
                min={1}
                className="input"
                placeholder="Ilimitado"
                value={maxSucursales}
                onChange={(e) => setMaxSucursales(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-700">Máximo de usuarios</span>
              <input
                type="number"
                min={1}
                className="input"
                placeholder="Ilimitado"
                value={maxUsuarios}
                onChange={(e) => setMaxUsuarios(e.target.value)}
              />
            </label>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-ink-700">Funciones habilitadas</p>
            <div className="max-h-72 space-y-3 overflow-y-auto rounded-lg border border-ink-100 p-3">
              {Array.from(categorias.entries()).map(([categoria, items]) => (
                <div key={categoria}>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-400">{categoria}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {items.map((item) => (
                      <label key={item.ruta} className="flex items-center gap-2 text-sm text-ink-700">
                        <input
                          type="checkbox"
                          checked={rutas.has(item.ruta)}
                          onChange={() => toggleRuta(item.ruta)}
                          className="h-4 w-4"
                        />
                        {item.etiqueta}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-ink-400">
              Configuración, roles, sucursales y auditoría siempre quedan accesibles — no se pueden desactivar,
              para que la empresa nunca quede bloqueada de administrar lo esencial de su cuenta.
            </p>
          </div>

          {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}
          {guardado && !error && (
            <div className="rounded-lg bg-success-50 px-3 py-2.5 text-sm text-success-600">
              Plan actualizado correctamente.
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50">
              Cerrar
            </button>
            <button
              onClick={handleGuardar}
              disabled={actualizar.isPending}
              className="flex items-center gap-2 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
            >
              {actualizar.isPending && <Loader2 size={16} className="animate-spin" />}
              Guardar plan
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
