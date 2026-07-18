import { useEffect, useState } from 'react';
import { Loader2, Plus, X, Package2, ImageOff } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useCrearDomicilio } from '@/hooks/useDomicilios';
import { useSucursales } from '@/hooks/useSucursales';
import { useClientes } from '@/hooks/usePos';
import { useUsuarios } from '@/hooks/useNucleo';
import { SelectorProductoOCombo, type ItemSeleccionable } from '@/components/SelectorProductoOCombo';
import { getApiErrorMessage } from '@/api/errors';

const CANALES = ['TELEFONO', 'WHATSAPP', 'PAGINA_WEB', 'RAPPI', 'OTRO'];
const CANAL_LABELS: Record<string, string> = {
  TELEFONO: 'Teléfono',
  WHATSAPP: 'WhatsApp',
  PAGINA_WEB: 'Página web',
  RAPPI: 'Rappi',
  OTRO: 'Otro',
};

interface LineaItem {
  item: ItemSeleccionable | null;
  cantidad: string;
}

export function DomicilioFormModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data: sucursales } = useSucursales();
  const { data: clientes } = useClientes();
  const { data: usuarios } = useUsuarios();
  const crear = useCrearDomicilio();

  const [sucursalId, setSucursalId] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [canal, setCanal] = useState('TELEFONO');
  const [direccionEntrega, setDireccionEntrega] = useState('');
  const [telefonoContacto, setTelefonoContacto] = useState('');
  const [repartidorId, setRepartidorId] = useState('');
  const [notas, setNotas] = useState('');
  const [items, setItems] = useState<LineaItem[]>([{ item: null, cantidad: '1' }]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSucursalId(sucursales?.[0] ? String(sucursales[0].id) : '');
      setClienteId('');
      setCanal('TELEFONO');
      setDireccionEntrega('');
      setTelefonoContacto('');
      setRepartidorId('');
      setNotas('');
      setItems([{ item: null, cantidad: '1' }]);
      setError(null);
    }
  }, [isOpen, sucursales]);

  function actualizarItem(i: number, cambios: Partial<LineaItem>) {
    setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, ...cambios } : item)));
  }

  async function handleCrear() {
    setError(null);
    const itemsValidos = items.filter((it) => it.item && Number(it.cantidad) > 0);
    if (!sucursalId || !direccionEntrega.trim() || itemsValidos.length === 0) {
      setError('Sucursal, dirección de entrega y al menos un producto son obligatorios');
      return;
    }
    try {
      await crear.mutateAsync({
        sucursalId: Number(sucursalId),
        clienteId: clienteId ? Number(clienteId) : undefined,
        canal,
        direccionEntrega,
        telefonoContacto: telefonoContacto || undefined,
        repartidorUsuarioId: repartidorId ? Number(repartidorId) : undefined,
        notas: notas || undefined,
        items: itemsValidos.map((it) => ({
          productoId: it.item!.tipo === 'PRODUCTO' ? it.item!.id : undefined,
          comboId: it.item!.tipo === 'COMBO' ? it.item!.id : undefined,
          cantidad: Number(it.cantidad),
        })),
      });
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo crear el pedido'));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo pedido a domicilio" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-600">Sucursal</span>
            <select className="input" value={sucursalId} onChange={(e) => setSucursalId(e.target.value)}>
              {sucursales?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-600">Canal</span>
            <select className="input" value={canal} onChange={(e) => setCanal(e.target.value)}>
              {CANALES.map((c) => (
                <option key={c} value={c}>
                  {CANAL_LABELS[c]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-600">Cliente (opcional)</span>
            <select className="input" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
              <option value="">Sin registrar</option>
              {clientes?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-600">Teléfono de contacto</span>
            <input className="input" value={telefonoContacto} onChange={(e) => setTelefonoContacto(e.target.value)} />
          </label>
          <label className="col-span-2 block">
            <span className="mb-1 block text-xs font-medium text-ink-600">Dirección de entrega</span>
            <input className="input" value={direccionEntrega} onChange={(e) => setDireccionEntrega(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-600">Repartidor (opcional)</span>
            <select className="input" value={repartidorId} onChange={(e) => setRepartidorId(e.target.value)}>
              <option value="">Sin asignar</option>
              {usuarios?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre} {u.apellido ?? ''}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="border-t border-ink-100 pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Productos</p>
          <div className="space-y-3">
            {items.map((linea, i) => (
              <div key={i} className="rounded-lg border border-ink-100 bg-ink-50 p-2">
                {linea.item ? (
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white">
                      {linea.item.imagen ? (
                        <img src={linea.item.imagen} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-ink-300">
                          {linea.item.tipo === 'COMBO' ? <Package2 size={16} /> : <ImageOff size={16} />}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-800">{linea.item.nombre}</p>
                      <button onClick={() => actualizarItem(i, { item: null })} className="text-xs font-medium text-ink-500 hover:text-ink-800">
                        Cambiar
                      </button>
                    </div>
                    <input
                      type="number"
                      min={1}
                      className="input w-16 text-sm"
                      value={linea.cantidad}
                      onChange={(e) => actualizarItem(i, { cantidad: e.target.value })}
                    />
                    <button
                      onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
                      className="rounded p-1.5 text-ink-300 hover:text-danger-500"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <SelectorProductoOCombo onSeleccionar={(item) => actualizarItem(i, { item })} />
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => setItems((prev) => [...prev, { item: null, cantidad: '1' }])}
            className="mt-2 flex items-center gap-1 text-xs font-medium text-ink-600 hover:text-ink-800"
          >
            <Plus size={13} />
            Agregar producto
          </button>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-600">Notas (opcional)</span>
          <input className="input" value={notas} onChange={(e) => setNotas(e.target.value)} />
        </label>

        {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50">
            Cancelar
          </button>
          <button
            onClick={handleCrear}
            disabled={crear.isPending}
            className="flex items-center gap-2 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
          >
            {crear.isPending && <Loader2 size={16} className="animate-spin" />}
            Registrar pedido
          </button>
        </div>
      </div>
    </Modal>
  );
}
