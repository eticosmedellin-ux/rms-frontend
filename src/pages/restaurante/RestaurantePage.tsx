import { useState, type ChangeEvent } from 'react';
import { Plus, Users, MapPin, History as HistoryIcon, QrCode, ChefHat, Sparkles, CalendarPlus, X, Loader2 } from 'lucide-react';
import {
  useMesas, useComandasHistorial, useComandasActivas, useCambiarEstadoMesa, useCambiarEstadoItem,
  useReservas, useCrearReserva, useCambiarEstadoReserva,
} from '@/hooks/useRestaurante';
import { useSucursales } from '@/hooks/useSucursales';
import { useClientes } from '@/hooks/usePos';
import { getApiErrorMessage } from '@/api/errors';
import { comprimirImagen } from '@/api/imagen';
import { useMenuArchivos, useSubirArchivoMenu, useActivarArchivoMenu, useEliminarArchivoMenu } from '@/hooks/useMenu';
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
  const [vista, setVista] = useState<'mesas' | 'cocina' | 'reservas' | 'menu' | 'historial'>('mesas');

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
          onClick={() => setVista('reservas')}
          className={`flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            vista === 'reservas' ? 'border-ink-800 text-ink-800' : 'border-transparent text-ink-400 hover:text-ink-600'
          }`}
        >
          <CalendarPlus size={14} />
          Reservas
        </button>
        <button
          onClick={() => setVista('menu')}
          className={`flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            vista === 'menu' ? 'border-ink-800 text-ink-800' : 'border-transparent text-ink-400 hover:text-ink-600'
          }`}
        >
          <QrCode size={14} />
          Menú digital
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
      {vista === 'reservas' && <ReservasTab />}
      {vista === 'menu' && <MenuDigitalTab />}
      {vista === 'historial' && <HistorialComandas />}

      <MesaFormModal isOpen={formAbierto} onClose={() => setFormAbierto(false)} mesa={mesaEditar} />
      <ComandaModal isOpen={mesaSeleccionada !== null} onClose={() => setMesaSeleccionada(null)} mesa={mesaSeleccionada} />
      <QrMesaModal mesa={mesaQr} onClose={() => setMesaQr(null)} />
    </div>
  );
}

/** QR por mesa — enlaza al menú digital público (imágenes/PDF que el administrador sube
 *  desde "Menú digital"), NO al sistema interno — así el cliente lo ve sin iniciar sesión. */
function QrMesaModal({ mesa, onClose }: { mesa: Mesa | null; onClose: () => void }) {
  if (!mesa) return null;
  const contenido = `${window.location.origin}/menu?sucursal=${mesa.sucursalId}`;
  const urlQr = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(contenido)}`;

  return (
    <Modal isOpen={mesa !== null} onClose={onClose} title={`Código QR — Mesa ${mesa.numero}`} size="sm">
      <div className="flex flex-col items-center gap-3 py-2">
        <img src={urlQr} alt={`QR de la mesa ${mesa.numero}`} className="rounded-lg border border-ink-100" />
        <p className="text-center text-xs text-ink-400">
          Imprime y pega este código en la mesa {mesa.numero}. Abre tu menú digital — súbelo desde la pestaña
          "Menú digital" si todavía no lo has hecho.
        </p>
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
                {item.cantidad}× {item.comboNombre ?? item.productoNombre}
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

const ESTADO_RESERVA_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  CONFIRMADA: 'Confirmada',
  CUMPLIDA: 'Cumplida',
  CANCELADA: 'Cancelada',
  NO_ASISTIO: 'No asistió',
};

const ESTADO_RESERVA_TONOS: Record<string, string> = {
  PENDIENTE: 'bg-ink-100 text-ink-600',
  CONFIRMADA: 'bg-blue-100 text-blue-700',
  CUMPLIDA: 'bg-success-50 text-success-600',
  CANCELADA: 'bg-danger-50 text-danger-500',
  NO_ASISTIO: 'bg-danger-50 text-danger-500',
};

function ReservasTab() {
  const { data: reservas, isLoading } = useReservas();
  const { data: sucursales } = useSucursales();
  const { data: clientes } = useClientes();
  const crear = useCrearReserva();
  const cambiarEstado = useCambiarEstadoReserva();

  const [mostrarForm, setMostrarForm] = useState(false);
  const [sucursalId, setSucursalId] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [nombreContacto, setNombreContacto] = useState('');
  const [telefonoContacto, setTelefonoContacto] = useState('');
  const [fechaHora, setFechaHora] = useState('');
  const [numeroPersonas, setNumeroPersonas] = useState('2');
  const [error, setError] = useState<string | null>(null);

  async function handleCrear() {
    setError(null);
    if (!sucursalId || !fechaHora) {
      setError('Sucursal y fecha/hora son obligatorias');
      return;
    }
    try {
      await crear.mutateAsync({
        sucursalId: Number(sucursalId),
        clienteId: clienteId ? Number(clienteId) : undefined,
        nombreContacto: nombreContacto || undefined,
        telefonoContacto: telefonoContacto || undefined,
        fechaHora: new Date(fechaHora).toISOString(),
        numeroPersonas: Number(numeroPersonas) || 1,
      });
      setMostrarForm(false);
      setClienteId('');
      setNombreContacto('');
      setTelefonoContacto('');
      setFechaHora('');
      setNumeroPersonas('2');
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo crear la reserva'));
    }
  }

  return (
    <div className="mt-6">
      <div className="flex justify-end">
        <button
          onClick={() => {
            setSucursalId(sucursales?.[0] ? String(sucursales[0].id) : '');
            setMostrarForm(true);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700"
        >
          <Plus size={16} />
          Nueva reserva
        </button>
      </div>

      {mostrarForm && (
        <div className="mt-4 rounded-xl border border-ink-100 bg-ink-50 p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink-600">Sucursal</span>
              <select className="input text-sm" value={sucursalId} onChange={(e) => setSucursalId(e.target.value)}>
                {sucursales?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink-600">Cliente (opcional)</span>
              <select className="input text-sm" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                <option value="">Sin registrar</option>
                {clientes?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink-600">Nombre de contacto</span>
              <input className="input text-sm" value={nombreContacto} onChange={(e) => setNombreContacto(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink-600">Teléfono</span>
              <input className="input text-sm" value={telefonoContacto} onChange={(e) => setTelefonoContacto(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink-600">Fecha y hora</span>
              <input type="datetime-local" className="input text-sm" value={fechaHora} onChange={(e) => setFechaHora(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink-600">Personas</span>
              <input type="number" min={1} className="input text-sm" value={numeroPersonas} onChange={(e) => setNumeroPersonas(e.target.value)} />
            </label>
          </div>
          {error && <p className="mt-2 text-xs text-danger-500">{error}</p>}
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={() => setMostrarForm(false)} className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-white">
              Cancelar
            </button>
            <button
              onClick={handleCrear}
              disabled={crear.isPending}
              className="rounded-lg bg-ink-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink-700"
            >
              Crear reserva
            </button>
          </div>
        </div>
      )}

      <div className="mt-4">
        {isLoading ? (
          <LoadingState />
        ) : reservas && reservas.length > 0 ? (
          <div className="space-y-2">
            {reservas.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border border-ink-100 bg-white px-4 py-3 shadow-card">
                <div>
                  <p className="text-sm font-medium text-ink-800">
                    {r.clienteNombre ?? r.nombreContacto ?? 'Sin nombre'} · {r.numeroPersonas} personas
                  </p>
                  <p className="text-xs text-ink-400">
                    {new Date(r.fechaHora).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}
                    {r.mesaNumero ? ` · Mesa ${r.mesaNumero}` : ''}
                    {r.telefonoContacto ? ` · ${r.telefonoContacto}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {r.estado === 'PENDIENTE' && (
                    <button
                      onClick={() => cambiarEstado.mutate({ id: r.id, estado: 'CONFIRMADA' })}
                      className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-600 hover:bg-ink-200"
                    >
                      Confirmar
                    </button>
                  )}
                  {(r.estado === 'PENDIENTE' || r.estado === 'CONFIRMADA') && (
                    <>
                      <button
                        onClick={() => cambiarEstado.mutate({ id: r.id, estado: 'CUMPLIDA' })}
                        className="rounded-full bg-success-50 px-2.5 py-1 text-xs font-medium text-success-600 hover:bg-success-100"
                      >
                        Cumplida
                      </button>
                      <button
                        onClick={() => cambiarEstado.mutate({ id: r.id, estado: 'CANCELADA' })}
                        className="rounded p-1 text-ink-300 hover:text-danger-500"
                      >
                        <X size={14} />
                      </button>
                    </>
                  )}
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_RESERVA_TONOS[r.estado]}`}>
                    {ESTADO_RESERVA_LABELS[r.estado]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Sin reservas" description="Crea la primera reserva de mesa." />
        )}
      </div>
    </div>
  );
}

function leerArchivoComoBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onerror = () => reject(new Error('No se pudo leer el archivo'));
    lector.onload = () => resolve(lector.result as string);
    lector.readAsDataURL(file);
  });
}

function MenuDigitalTab() {
  const { data: archivos, isLoading } = useMenuArchivos();
  const { data: sucursales } = useSucursales();
  const subir = useSubirArchivoMenu();
  const activar = useActivarArchivoMenu();
  const eliminar = useEliminarArchivoMenu();
  const [sucursalId, setSucursalId] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleArchivo(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    setError(null);
    setSubiendo(true);
    try {
      const esPdf = archivo.type === 'application/pdf';
      const contenido = esPdf ? await leerArchivoComoBase64(archivo) : await comprimirImagen(archivo, 1200, 0.85);
      await subir.mutateAsync({
        nombre: archivo.name,
        tipoArchivo: esPdf ? 'PDF' : 'IMAGEN',
        contenido,
        sucursalId: sucursalId ? Number(sucursalId) : undefined,
      });
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo subir el archivo'));
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="mt-6">
      <p className="text-sm text-ink-400">
        Sube tu carta/menú como foto o PDF — esto es justo lo que ven tus clientes al escanear el código QR de la
        mesa, sin necesidad de entrar al sistema. Puedes subir un menú general (deja "Todas las sucursales") o uno
        distinto por sucursal.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-ink-100 bg-ink-50 p-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-600">Sucursal (opcional)</span>
          <select className="input text-sm" value={sucursalId} onChange={(e) => setSucursalId(e.target.value)}>
            <option value="">Todas las sucursales</option>
            {sucursales?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700">
          {subiendo && <Loader2 size={15} className="animate-spin" />}
          Subir foto o PDF
          <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleArchivo} disabled={subiendo} />
        </label>
        <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-white">
          Tomar foto
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleArchivo} disabled={subiendo} />
        </label>
      </div>
      {error && <p className="mt-2 text-xs text-danger-500">{error}</p>}

      <div className="mt-4">
        {isLoading ? (
          <LoadingState />
        ) : archivos && archivos.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {archivos.map((a) => (
              <div key={a.id} className={`rounded-xl border border-ink-100 bg-white p-2 shadow-card ${!a.activo ? 'opacity-50' : ''}`}>
                {a.tipoArchivo === 'PDF' ? (
                  <div className="flex h-32 items-center justify-center rounded-lg bg-ink-50 text-xs text-ink-400">Archivo PDF</div>
                ) : (
                  <img src={a.contenido} alt={a.nombre} className="h-32 w-full rounded-lg object-cover" />
                )}
                <p className="mt-1.5 truncate text-xs font-medium text-ink-700">{a.nombre}</p>
                <p className="text-[10px] text-ink-400">{a.sucursalNombre ?? 'Todas las sucursales'}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <button
                    onClick={() => activar.mutate({ id: a.id, activo: !a.activo })}
                    className="text-[11px] font-medium text-ink-500 hover:text-ink-800"
                  >
                    {a.activo ? 'Desactivar' : 'Activar'}
                  </button>
                  <button onClick={() => eliminar.mutate(a.id)} className="rounded p-1 text-ink-300 hover:text-danger-500">
                    <X size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Sin menú digital todavía" description="Sube tu primera foto o PDF del menú." />
        )}
      </div>
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
