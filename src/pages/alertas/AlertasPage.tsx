import { useState } from 'react';
import { RefreshCw, X, Settings2 } from 'lucide-react';
import {
  useAlertas,
  useGenerarAlertas,
  useDescartarAlerta,
  useConfiguracionAlertas,
  useGuardarConfiguracionAlerta,
} from '@/hooks/useGestion';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { Modal } from '@/components/ui/Modal';
import type { TipoAlerta } from '@/types/gestion';

const TIPO_LABELS: Record<TipoAlerta, string> = {
  STOCK_BAJO: 'Stock bajo',
  PRODUCTO_AGOTADO: 'Producto agotado',
  SIN_MOVIMIENTO: 'Sin movimiento',
  COMPRA_PENDIENTE: 'Compra pendiente',
  CAJA_SIN_CERRAR: 'Caja sin cerrar',
  CXP_POR_VENCER: 'Cuenta por pagar próxima a vencer',
  CXC_POR_VENCER: 'Cuenta por cobrar próxima a vencer',
  EFECTIVO_MAXIMO_CAJA: 'Efectivo máximo en caja',
  CAJA_DIFERENCIA_CIERRE: 'Descuadre en cierre de caja',
  NOMINA_PAGO_PROXIMO: 'Pago de nómina próximo',
  PRESTAMO_CUOTA_PROXIMA: 'Cuota de préstamo próxima',
  DOMICILIO_NUEVO: 'Nuevo pedido a domicilio',
  MESA_OCUPADA_MUCHO_TIEMPO: 'Mesa ocupada hace mucho',
  CITA_PROXIMA: 'Cita próxima',
  RESERVA_PROXIMA: 'Reserva próxima',
  CLIENTE_CUMPLEANOS: 'Cumpleaños de cliente',
};

const TIPO_TONES: Record<TipoAlerta, string> = {
  STOCK_BAJO: 'bg-amber-100 text-amber-700',
  PRODUCTO_AGOTADO: 'bg-danger-50 text-danger-600',
  SIN_MOVIMIENTO: 'bg-ink-100 text-ink-600',
  COMPRA_PENDIENTE: 'bg-amber-100 text-amber-700',
  CAJA_SIN_CERRAR: 'bg-danger-50 text-danger-600',
  CXP_POR_VENCER: 'bg-amber-100 text-amber-700',
  CXC_POR_VENCER: 'bg-amber-100 text-amber-700',
  EFECTIVO_MAXIMO_CAJA: 'bg-amber-100 text-amber-700',
  CAJA_DIFERENCIA_CIERRE: 'bg-danger-50 text-danger-600',
  NOMINA_PAGO_PROXIMO: 'bg-amber-100 text-amber-700',
  PRESTAMO_CUOTA_PROXIMA: 'bg-amber-100 text-amber-700',
  DOMICILIO_NUEVO: 'bg-blue-100 text-blue-700',
  MESA_OCUPADA_MUCHO_TIEMPO: 'bg-amber-100 text-amber-700',
  CITA_PROXIMA: 'bg-blue-100 text-blue-700',
  RESERVA_PROXIMA: 'bg-blue-100 text-blue-700',
  CLIENTE_CUMPLEANOS: 'bg-pink-100 text-pink-700',
};

export default function AlertasPage() {
  const { data: alertas, isLoading } = useAlertas();
  const generar = useGenerarAlertas();
  const descartar = useDescartarAlerta();
  const [modalConfigAbierto, setModalConfigAbierto] = useState(false);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-800">Alertas</h1>
          <p className="mt-1 text-sm text-ink-400">Stock bajo, cajas sin cerrar y cuentas por vencer.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setModalConfigAbierto(true)}
            className="flex items-center gap-1.5 rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50"
          >
            <Settings2 size={16} />
            Configurar
          </button>
          <button
            onClick={() => generar.mutate()}
            disabled={generar.isPending}
            className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
          >
            <RefreshCw size={16} className={generar.isPending ? 'animate-spin' : ''} />
            Revisar ahora
          </button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : alertas && alertas.length > 0 ? (
        <div className="space-y-2">
          {alertas.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-ink-100 bg-white px-4 py-3 shadow-card"
            >
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${TIPO_TONES[a.tipo]}`}>
                  {TIPO_LABELS[a.tipo] ?? a.tipo}
                </span>
                <p className="text-sm text-ink-700">{a.mensaje}</p>
              </div>
              <button
                onClick={() => descartar.mutate(a.id)}
                title="Descartar alerta"
                className="rounded-lg p-1.5 text-ink-300 hover:bg-ink-50 hover:text-ink-600"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Sin alertas activas"
          description="Dale a 'Revisar ahora' para escanear stock bajo, cajas sin cerrar y cuentas por vencer."
        />
      )}

      <ConfiguracionAlertasModal isOpen={modalConfigAbierto} onClose={() => setModalConfigAbierto(false)} />
    </div>
  );
}

const TIPOS_CONFIGURABLES: TipoAlerta[] = [
  'STOCK_BAJO',
  'PRODUCTO_AGOTADO',
  'CAJA_SIN_CERRAR',
  'CXP_POR_VENCER',
  'CXC_POR_VENCER',
  'EFECTIVO_MAXIMO_CAJA',
  'CAJA_DIFERENCIA_CIERRE',
  'NOMINA_PAGO_PROXIMO',
  'PRESTAMO_CUOTA_PROXIMA',
  'MESA_OCUPADA_MUCHO_TIEMPO',
  'CITA_PROXIMA',
  'RESERVA_PROXIMA',
  'CLIENTE_CUMPLEANOS',
];

function ConfiguracionAlertasModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data: configuraciones } = useConfiguracionAlertas();
  const guardar = useGuardarConfiguracionAlerta();

  function estaActiva(tipo: string): boolean {
    return configuraciones?.find((c) => c.tipoAlerta === tipo)?.activa ?? true;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configuración de alertas" size="md">
      <div className="space-y-3">
        <p className="text-sm text-ink-500">
          Activa o desactiva qué tipos de alerta quieres que se generen al revisar.
        </p>
        {TIPOS_CONFIGURABLES.map((tipo) => (
          <label key={tipo} className="flex items-center justify-between rounded-lg border border-ink-100 px-4 py-3">
            <span className="text-sm font-medium text-ink-700">{TIPO_LABELS[tipo]}</span>
            <input
              type="checkbox"
              checked={estaActiva(tipo)}
              onChange={(e) => guardar.mutate({ tipoAlerta: tipo, activa: e.target.checked })}
              className="h-4 w-4"
            />
          </label>
        ))}
      </div>
    </Modal>
  );
}
