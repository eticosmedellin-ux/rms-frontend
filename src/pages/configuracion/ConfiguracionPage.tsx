import { useState, useEffect } from 'react';
import { Plus, Loader2, FileSignature } from 'lucide-react';
import {
  useMetodosPago,
  useCrearMetodoPago,
  useImpuestos,
  useCrearImpuesto,
  useEmpresa,
  useActualizarEmpresa,
  useConfiguracionFacturacionElectronica,
  useGuardarConfiguracionFacturacionElectronica,
} from '@/hooks/useGestion';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { getApiErrorMessage } from '@/api/errors';

export default function ConfiguracionPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-800">Configuración</h1>
      <p className="mt-1 text-sm text-ink-400">Datos de tu empresa, métodos de pago e impuestos.</p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MiEmpresaCard />
        <MetodosPagoCard />
        <ImpuestosCard />
        <FacturacionElectronicaCard />
      </div>
    </div>
  );
}

function MiEmpresaCard() {
  const { data: empresa, isLoading } = useEmpresa();
  const actualizar = useActualizarEmpresa();

  const [nombre, setNombre] = useState('');
  const [nombreComercial, setNombreComercial] = useState('');
  const [nit, setNit] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    if (empresa) {
      setNombre(empresa.nombre);
      setNombreComercial(empresa.nombreComercial ?? '');
      setNit(empresa.nit ?? '');
      setDireccion(empresa.direccion ?? '');
      setTelefono(empresa.telefono ?? '');
      setEmail(empresa.email ?? '');
    }
  }, [empresa]);

  async function handleGuardar() {
    setError(null);
    setGuardado(false);
    if (!nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    try {
      await actualizar.mutateAsync({
        nombre,
        nombreComercial: nombreComercial || undefined,
        nit: nit || undefined,
        direccion: direccion || undefined,
        telefono: telefono || undefined,
        email: email || undefined,
      });
      setGuardado(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo guardar la empresa'));
    }
  }

  if (isLoading) return <LoadingState />;

  return (
    <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-card lg:col-span-2">
      <h3 className="font-display text-base font-semibold text-ink-800">Mi empresa</h3>

      <div className="mt-3 grid grid-cols-2 gap-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Razón social</span>
          <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Nombre comercial</span>
          <input className="input" value={nombreComercial} onChange={(e) => setNombreComercial(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">NIT</span>
          <input className="input" value={nit} onChange={(e) => setNit(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Teléfono</span>
          <input className="input" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Dirección</span>
          <input className="input" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Email</span>
          <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
      </div>

      {error && <div className="mt-3 rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}
      {guardado && !error && (
        <div className="mt-3 rounded-lg bg-success-50 px-3 py-2.5 text-sm text-success-600">Guardado correctamente.</div>
      )}

      <button
        onClick={handleGuardar}
        disabled={actualizar.isPending}
        className="mt-4 flex items-center gap-2 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
      >
        {actualizar.isPending && <Loader2 size={16} className="animate-spin" />}
        Guardar cambios
      </button>
    </div>
  );
}

function MetodosPagoCard() {
  const { data: metodos, isLoading } = useMetodosPago();
  const crear = useCrearMetodoPago();
  const [nombre, setNombre] = useState('');

  async function handleAgregar() {
    if (!nombre.trim()) return;
    await crear.mutateAsync(nombre.trim());
    setNombre('');
  }

  return (
    <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-card">
      <h3 className="font-display text-base font-semibold text-ink-800">Métodos de pago</h3>

      <div className="mt-3 flex gap-2">
        <input
          className="input"
          placeholder="Ej: Nequi"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAgregar()}
        />
        <button
          onClick={handleAgregar}
          disabled={crear.isPending || !nombre.trim()}
          className="flex items-center gap-1 rounded-lg bg-ink-800 px-3 py-2 text-sm font-medium text-white hover:bg-ink-700 disabled:opacity-60"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <LoadingState />
        ) : metodos && metodos.length > 0 ? (
          <ul className="divide-y divide-ink-50">
            {metodos.map((m) => (
              <li key={m.id} className="py-2 text-sm text-ink-700">
                {m.nombre}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Sin métodos de pago configurados" />
        )}
      </div>
    </div>
  );
}

function FacturacionElectronicaCard() {
  const { data: config, isLoading } = useConfiguracionFacturacionElectronica();
  const guardar = useGuardarConfiguracionFacturacionElectronica();

  const [proveedor, setProveedor] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [resolucionNumero, setResolucionNumero] = useState('');
  const [resolucionPrefijo, setResolucionPrefijo] = useState('');
  const [resolucionRangoDesde, setResolucionRangoDesde] = useState('');
  const [resolucionRangoHasta, setResolucionRangoHasta] = useState('');
  const [resolucionFechaVencimiento, setResolucionFechaVencimiento] = useState('');
  const [activa, setActiva] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    if (config) {
      setProveedor(config.proveedor ?? '');
      setApiUrl(config.apiUrl ?? '');
      setResolucionNumero(config.resolucionNumero ?? '');
      setResolucionPrefijo(config.resolucionPrefijo ?? '');
      setResolucionRangoDesde(config.resolucionRangoDesde ? String(config.resolucionRangoDesde) : '');
      setResolucionRangoHasta(config.resolucionRangoHasta ? String(config.resolucionRangoHasta) : '');
      setResolucionFechaVencimiento(config.resolucionFechaVencimiento ?? '');
      setActiva(config.activa);
    }
  }, [config]);

  async function handleGuardar() {
    setError(null);
    setGuardado(false);
    try {
      await guardar.mutateAsync({
        proveedor: proveedor || undefined,
        apiUrl: apiUrl || undefined,
        apiKey: apiKey || undefined, // vacío = no cambiar la que ya está guardada
        resolucionNumero: resolucionNumero || undefined,
        resolucionPrefijo: resolucionPrefijo || undefined,
        resolucionRangoDesde: resolucionRangoDesde ? Number(resolucionRangoDesde) : undefined,
        resolucionRangoHasta: resolucionRangoHasta ? Number(resolucionRangoHasta) : undefined,
        resolucionFechaVencimiento: resolucionFechaVencimiento || undefined,
        activa,
      });
      setApiKey('');
      setGuardado(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo guardar la configuración'));
    }
  }

  if (isLoading) return <LoadingState />;

  return (
    <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-card lg:col-span-2">
      <div className="flex items-center gap-2">
        <FileSignature size={18} className="text-ink-400" />
        <h3 className="font-display text-base font-semibold text-ink-800">Facturación electrónica</h3>
      </div>
      <p className="mt-1 text-sm text-ink-400">
        Arquitectura lista para conectar un proveedor tecnológico (Factus, Alegra, Siigo, etc.) autorizado por la
        DIAN. Mientras no actives esto, el sistema sigue funcionando exactamente igual.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Proveedor</span>
          <input
            className="input"
            placeholder="Ej: FACTUS, ALEGRA, SIIGO…"
            value={proveedor}
            onChange={(e) => setProveedor(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">URL de la API del proveedor</span>
          <input className="input" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">
            API key {config?.apiKeyConfigurada && <span className="text-xs text-success-600">(ya configurada)</span>}
          </span>
          <input
            type="password"
            className="input"
            placeholder={config?.apiKeyConfigurada ? '•••••••• (déjalo vacío para no cambiarla)' : ''}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Número de resolución DIAN</span>
          <input className="input" value={resolucionNumero} onChange={(e) => setResolucionNumero(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Prefijo</span>
          <input className="input" value={resolucionPrefijo} onChange={(e) => setResolucionPrefijo(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Vence</span>
          <input
            type="date"
            className="input"
            value={resolucionFechaVencimiento}
            onChange={(e) => setResolucionFechaVencimiento(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Rango autorizado desde</span>
          <input
            type="number"
            className="input"
            value={resolucionRangoDesde}
            onChange={(e) => setResolucionRangoDesde(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Rango autorizado hasta</span>
          <input
            type="number"
            className="input"
            value={resolucionRangoHasta}
            onChange={(e) => setResolucionRangoHasta(e.target.value)}
          />
        </label>
      </div>

      <label className="mt-4 flex items-center gap-2 rounded-lg border border-ink-100 bg-ink-50/60 p-3">
        <input type="checkbox" checked={activa} onChange={(e) => setActiva(e.target.checked)} className="h-4 w-4" />
        <span className="text-sm text-ink-700">
          Activar el envío real a la DIAN
          <span className="ml-1 text-xs text-ink-400">
            (no la marques hasta que hayas conectado un proveedor real — mientras tanto, cualquier intento de envío
            explicará con claridad que falta configurarlo)
          </span>
        </span>
      </label>

      {error && <div className="mt-3 rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}
      {guardado && !error && (
        <div className="mt-3 rounded-lg bg-success-50 px-3 py-2.5 text-sm text-success-600">Guardado correctamente.</div>
      )}

      <button
        onClick={handleGuardar}
        disabled={guardar.isPending}
        className="mt-4 flex items-center gap-2 rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
      >
        {guardar.isPending && <Loader2 size={16} className="animate-spin" />}
        Guardar configuración
      </button>
    </div>
  );
}

function ImpuestosCard() {
  const { data: impuestos, isLoading } = useImpuestos();
  const crear = useCrearImpuesto();
  const [nombre, setNombre] = useState('');
  const [porcentaje, setPorcentaje] = useState('');

  async function handleAgregar() {
    if (!nombre.trim() || !porcentaje) return;
    await crear.mutateAsync({ nombre: nombre.trim(), porcentaje: Number(porcentaje) });
    setNombre('');
    setPorcentaje('');
  }

  return (
    <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-card">
      <h3 className="font-display text-base font-semibold text-ink-800">Impuestos</h3>

      <div className="mt-3 flex gap-2">
        <input className="input" placeholder="Ej: IVA 19%" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <input
          type="number"
          className="input w-24"
          placeholder="%"
          value={porcentaje}
          onChange={(e) => setPorcentaje(e.target.value)}
        />
        <button
          onClick={handleAgregar}
          disabled={crear.isPending || !nombre.trim() || !porcentaje}
          className="flex items-center gap-1 rounded-lg bg-ink-800 px-3 py-2 text-sm font-medium text-white hover:bg-ink-700 disabled:opacity-60"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <LoadingState />
        ) : impuestos && impuestos.length > 0 ? (
          <ul className="divide-y divide-ink-50">
            {impuestos.map((i) => (
              <li key={i.id} className="flex items-center justify-between py-2 text-sm text-ink-700">
                <span>
                  {i.nombre} {i.esDefault && <span className="ml-1 text-xs text-amber-600">(default)</span>}
                </span>
                <span className="font-medium">{i.porcentaje}%</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Sin impuestos configurados" />
        )}
      </div>
    </div>
  );
}
