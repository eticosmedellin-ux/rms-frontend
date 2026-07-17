import { useState } from 'react';
import { Plus, Users, MapPin, History as HistoryIcon, QrCode, ChefHat, Sparkles } from 'lucide-react';
import { useMesas, useComandasHistorial, useComandasActivas, useCambiarEstadoMesa, useCambiarEstadoItem } from '@/hooks/useRestaurante';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { Modal } from '@/components/ui/Modal';
import { MesaFormModal } from '@/pages/restaurante/MesaFormModal';
import { ComandaModal } from '@/pages/restaurante/ComandaModal';
import type { Mesa, EstadoItemComanda } from '@/api/restaurante';

const ESTADO_TONOS: Record<Mesa['estado'], string> = {
  LIBRE: 'border-success-200 bg-success-50 hover:border-success-300',
  OCUPADA: 'border-amber-300 bg-amber-50 hover:border-amber-400',
  RESERVADA: 'border-ink-300 bg-ink-50 hover:border-ink-400',
  LIMPIEZA: 'border-blue-200 bg-blue-50 hover:border-blue-300',
};

const ESTADO_LABELS: Record<Mesa['estado'], string> = {
  LIBRE: 'Libre',
  OCUPADA: 'Ocupada',
  RESERVADA: 'Reservada',
  LIMPIEZA: 'Limpieza',
};

const ESTADO_ITEM_LABELS: Record<EstadoItemComanda, string> = {
  PENDIENTE: 'Pendiente',
  PREPARANDO: 'Preparando',
  LISTO: 'Listo',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

const SIGUIENTE_ESTADO_ITEM: Partial<Record<EstadoItemComanda, EstadoItemComanda>> = {
  PENDIENTE: 'PREPARANDO',
  PREPARANDO: 'LISTO',
  LISTO: 'ENTREGADO',
};

function formatoMoneda(v: number) {
  return v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

export default function RestaurantePage() {
  const { data: mesas, isLoading } = useMesas();
  const cambiarEstadoMesa = useCambiarEstadoMesa();
  const [formAbierto, setFormAbierto] = useState(false);
  const [mesaEditar, setMesaEditar] = useState<Mesa | null>(null);
  const [mesaSeleccionada, setMesaSeleccionada] = useState<Mesa | null>(null);
  const [mesaQr, setMesaQr] = useState<Mesa | null>(null);
  const [vista, setVista] = useState<'mesas' | 'cocina' | 'historial'>('mesas');

  function manejarClicMesa(m: Mesa) {
    // Una mesa en Limpieza no tiene comanda que gestionar — clic rápido la libera.
    if (m.estado === 'LIMPIEZA') {
      cambiarEstadoMesa.mutate({ id: m.id, estado: 'LIBRE' });
      return;
    }
    setMesaSeleccionada(m);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-800">Restaurante</h1>
          <p className="mt-1 text-sm text-ink-400">Mesas y comandas en tiempo real.</p>
        </div>
        <button
          onClick={() => {
            setMesaEditar(null);
            setFormAbierto(true);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700"
        >
          <Plus size={16} />
          Nueva mesa
        </button>
      </div>

      <div className="mt-4 flex gap-1 border-b border-ink-100">
        <button
          onClick={() => setVista('mesas')}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            vista === 'mesas' ? 'border-ink-800 text-ink-800' : 'border-transparent text-ink-400 hover:text-ink-600'
          }`}
        >
          Mesas
        </button>
        <button
          onClick={() => setVista('cocina')}
          className={`flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            vista === 'cocina' ? 'border-ink-800 text-ink-800' : 'border-transparent text-ink-400 hover:text-ink-600'
          }`}
        >
          <ChefHat size={14} />
          Cocina / Bar
        </button>
        <button
          onClick={() => setVista('historial')}
          className={`flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            vista === 'historial' ? 'border-ink-800 text-ink-800' : 'border-transparent text-ink-400 hover:text-ink-600'
          }`}
        >
          <HistoryIcon size={14} />
          Historial
        </button>
      </div>

      {vista === 'mesas' && (
        <div className="mt-6">
          {isLoading ? (
            <LoadingState />
          ) : mesas && mesas.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {mesas.map((m) => (
                <div
                  key={m.id}
                  onClick={() => manejarClicMesa(m)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setMesaEditar(m);
                    setFormAbierto(true);
                  }}
                  className={`relative cursor-pointer rounded-xl border-2 p-4 text-left shadow-card transition-colors ${ESTADO_TONOS[m.estado]}`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMesaQr(m);
                    }}
                    title="Ver código QR de la mesa"
                    className="absolute right-2 top-2 rounded-lg bg-white/70 p-1 text-ink-500 hover:text-ink-800"
                  >
                    <QrCode size={14} />
                  </button>
                  <div className="flex w-full items-center justify-between pr-6">
                    <span className="font-display text-lg font-bold text-ink-800">Mesa {m.numero}</span>
                  </div>
                  <span className="mt-1 inline-block rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-600">
                    {ESTADO_LABELS[m.estado]}
                  </span>
                  {m.zona && (
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-ink-500">
                      <MapPin size={12} />
                      {m.zona}
                    </p>
                  )}
                  {m.capacidad && (
                    <p className="flex items-center gap-1 text-xs text-ink-500">
                      <Users size={12} />
                      {m.capacidad} personas
                    </p>
                  )}
                  {m.estado === 'LIMPIEZA' && (
                    <p className="mt-1.5 flex items-center gap-1 text-[11px] text-blue-600">
                      <Sparkles size={11} />
                      Clic para marcar libre
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Sin mesas configuradas" description="Agrega tu primera mesa para empezar a tomar comandas." />
          )}
          <p className="mt-3 text-xs text-ink-400">Clic para abrir/gestionar la comanda · clic derecho para editar la mesa.</p>
        </div>
      )}

      {vista === 'cocina' && <PantallaCocina />}
      {vista === 'historial' && <HistorialComandas />}

      <MesaFormModal isOpen={formAbierto} onClose={() => setFormAbierto(false)} mesa={mesaEditar} />
      <ComandaModal isOpen={mesaSeleccionada !== null} onClose={() => setMesaSeleccionada(null)} mesa={mesaSeleccionada} />
      <QrMesaModal mesa={mesaQr} onClose={() => setMesaQr(null)} />
    </div>
  );
}

/** QR por mesa — de momento enlaza a la vista de Restaurante del sistema (uso interno del
 *  personal); cuando exista un menú digital público, este mismo botón se puede apuntar
 *  a esa URL sin tocar nada más. */
function QrMesaModal({ mesa, onClose }: { mesa: Mesa | null; onClose: () => void }) {
  if (!mesa) return null;
  const contenido = `${window.location.origin}/restaurante?mesa=${mesa.id}`;
  const urlQr = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(contenido)}`;

  return (
    <Modal isOpen={mesa !== null} onClose={onClose} title={`Código QR — Mesa ${mesa.numero}`} size="sm">
      <div className="flex flex-col items-center gap-3 py-2">
        <img src={urlQr} alt={`QR de la mesa ${mesa.numero}`} className="rounded-lg border border-ink-100" />
        <p className="text-center text-xs text-ink-400">Imprime y pega este código en la mesa {mesa.numero}.</p>
      </div>
    </Modal>
  );
}

/** Pantalla de Cocina/Bar (Kitchen Display) — todos los ítems pendientes/en preparación
 *  de TODAS las mesas abiertas, en una sola lista para el equipo de cocina, sin tener
 *  que abrir mesa por mesa. */
function PantallaCocina() {
  const { data: comandas, isLoading } = useComandasActivas();
  const cambiarEstadoItem = useCambiarEstadoItem();

  const items = (comandas ?? [])
    .flatMap((c) =>
      c.items
        .filter((i) => i.estado !== 'CANCELADO' && i.estado !== 'ENTREGADO')
        .map((i) => ({ ...i, mesaNumero: c.mesaNumero, comandaId: c.id }))
    )
    .sort((a, b) => a.id - b.id);

  return (
    <div className="mt-6">
      {isLoading ? (
        <LoadingState />
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-ink-800 px-2.5 py-1 text-xs font-bold text-white">Mesa {item.mesaNumero}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    item.estado === 'PENDIENTE' ? 'bg-ink-100 text-ink-600' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {ESTADO_ITEM_LABELS[item.estado]}
                </span>
              </div>
              <p className="mt-2 font-display text-base font-semibold text-ink-800">
                {item.cantidad}× {item.productoNombre}
              </p>
              {item.notas && <p className="text-xs text-ink-400">{item.notas}</p>}
              {SIGUIENTE_ESTADO_ITEM[item.estado] && (
                <button
                  onClick={() =>
                    cambiarEstadoItem.mutate({ comandaId: item.comandaId, itemId: item.id, estado: SIGUIENTE_ESTADO_ITEM[item.estado]! })
                  }
                  className="mt-3 w-full rounded-lg bg-success-600 py-2 text-sm font-semibold text-white hover:bg-success-700"
                >
                  Marcar {ESTADO_ITEM_LABELS[SIGUIENTE_ESTADO_ITEM[item.estado]!]}
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="Sin pedidos pendientes" description="Aquí aparecen los ítems de todas las mesas mientras se preparan." />
      )}
    </div>
  );
}

function HistorialComandas() {
  const { data: comandas, isLoading } = useComandasHistorial();

  return (
    <div className="mt-6">
      {isLoading ? (
        <LoadingState />
      ) : comandas && comandas.length > 0 ? (
        <div className="space-y-2">
          {comandas.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-xl border border-ink-100 bg-white px-4 py-3 shadow-card">
              <div>
                <p className="text-sm font-medium text-ink-800">Mesa {c.mesaNumero}</p>
                <p className="text-xs text-ink-400">
                  {c.meseroNombre} · {c.fechaCierre ? new Date(c.fechaCierre).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                  {c.ventaId ? ` · Venta #${c.ventaId}` : ''}
                  {c.propina ? ` · Propina ${formatoMoneda(c.propina)}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-ink-700">{formatoMoneda(c.total)}</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    c.estado === 'CERRADA' ? 'bg-success-50 text-success-600' : 'bg-danger-50 text-danger-500'
                  }`}
                >
                  {c.estado === 'CERRADA' ? 'Facturada' : 'Cancelada'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="Sin historial todavía" description="Aquí verás las comandas ya cerradas o canceladas." />
      )}
    </div>
  );
}
