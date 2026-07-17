import { useEffect, useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useCrearDomicilio } from '@/hooks/useDomicilios';
import { useSucursales } from '@/hooks/useSucursales';
import { useClientes } from '@/hooks/usePos';
import { useProductos } from '@/hooks/useInventario';
import { useUsuarios } from '@/hooks/useNucleo';
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
  productoId: string;
  cantidad: string;
}

export function DomicilioFormModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data: sucursales } = useSucursales();
  const { data: clientes } = useClientes();
  const { data: productos } = useProductos();
  const { data: usuarios } = useUsuarios();
  const crear = useCrearDomicilio();

  const [sucursalId, setSucursalId] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [canal, setCanal] = useState('TELEFONO');
  const [direccionEntrega, setDireccionEntrega] = useState('');
  const [telefonoContacto, setTelefonoContacto] = useState('');
  const [repartidorId, setRepartidorId] = useState('');
  const [notas, setNotas] = useState('');
  const [items, setItems] = useState<LineaItem[]>([{ productoId: '', cantidad: '1' }]);
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
      setItems([{ productoId: '', cantidad: '1' }]);
      setError(null);
    }
  }, [isOpen, sucursales]);

  function actualizarItem(i: number, campo: keyof LineaItem, valor: string) {
    setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, [campo]: valor } : item)));
  }

  async function handleCrear() {
    setError(null);
    const itemsValidos = items.filter((it) => it.productoId && Number(it.cantidad) > 0);
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
        items: itemsValidos.map((it) => ({ productoId: Number(it.productoId), cantidad: Number(it.cantidad) })),
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
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-[1fr_80px_auto] items-center gap-2">
                <select className="input text-sm" value={item.productoId} onChange={(e) => actualizarItem(i, 'productoId', e.target.value)}>
                  <option value="">Elegir producto...</option>
                  {productos?.filter((p) => p.estado).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  className="input text-sm"
                  value={item.cantidad}
                  onChange={(e) => actualizarItem(i, 'cantidad', e.target.value)}
                />
                <button
                  onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
                  className="rounded p-1.5 text-ink-300 hover:text-danger-500"
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setItems((prev) => [...prev, { productoId: '', cantidad: '1' }])}
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
