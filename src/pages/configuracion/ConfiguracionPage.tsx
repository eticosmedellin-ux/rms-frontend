import { useState, useEffect } from 'react';
import { Plus, Loader2, FileSignature, Printer } from 'lucide-react';
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
        <RedesYBancoCard />
        <SistemaCard />
        <VentasGeneralCard />
        <InventarioGeneralCard />
        <ImpresionCard />
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
  const [ciudad, setCiudad] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [sitioWeb, setSitioWeb] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    if (empresa) {
      setNombre(empresa.nombre);
      setNombreComercial(empresa.nombreComercial ?? '');
      setNit(empresa.nit ?? '');
      setDireccion(empresa.direccion ?? '');
      setCiudad(empresa.ciudad ?? '');
      setTelefono(empresa.telefono ?? '');
      setEmail(empresa.email ?? '');
      setSitioWeb(empresa.sitioWeb ?? '');
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
        ciudad: ciudad || undefined,
        telefono: telefono || undefined,
        email: email || undefined,
        sitioWeb: sitioWeb || undefined,
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
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Ciudad</span>
          <input className="input" value={ciudad} onChange={(e) => setCiudad(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Email</span>
          <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Sitio web (opcional)</span>
          <input className="input" placeholder="https://..." value={sitioWeb} onChange={(e) => setSitioWeb(e.target.value)} />
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
  const [clienteIdProveedor, setClienteIdProveedor] = useState('');
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
      setClienteIdProveedor(config.clienteIdProveedor ?? '');
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
        clienteIdProveedor: clienteIdProveedor || undefined,
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
        Conectado con MATIAS API (matias-api.com), pensado para "Casa de Software" — cada empresa se habilita como
        su propio NIT ante la DIAN. Mientras no actives esto, el sistema sigue funcionando exactamente igual.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Proveedor</span>
          <select className="input" value={proveedor} onChange={(e) => setProveedor(e.target.value)}>
            <option value="">Sin proveedor</option>
            <option value="MATIAS">MATIAS API</option>
            <option value="OTRO">Otro</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">URL de la API</span>
          <input
            className="input"
            placeholder="https://sandbox-api.matias-api.com/api/ubl2.1 (pruebas) o https://api.matias-api.com/api/ubl2.1 (producción)"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
          />
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
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">ID de cliente en MATIAS (opcional)</span>
          <input
            className="input"
            placeholder="Solo si Héctor administra varias empresas desde una sola cuenta MATIAS"
            value={clienteIdProveedor}
            onChange={(e) => setClienteIdProveedor(e.target.value)}
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

function ImpresionCard() {
  const { data: empresa, isLoading } = useEmpresa();
  const actualizar = useActualizarEmpresa();

  const [tamanoImpresion, setTamanoImpresion] = useState('A4');
  const [anchoPersonalizadoMm, setAnchoPersonalizadoMm] = useState('');
  const [altoPersonalizadoMm, setAltoPersonalizadoMm] = useState('');
  const [mensajeAgradecimiento, setMensajeAgradecimiento] = useState('');
  const [infoAdicionalDocumentos, setInfoAdicionalDocumentos] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    if (empresa) {
      setTamanoImpresion(empresa.tamanoImpresion);
      setAnchoPersonalizadoMm(empresa.anchoPersonalizadoMm ? String(empresa.anchoPersonalizadoMm) : '');
      setAltoPersonalizadoMm(empresa.altoPersonalizadoMm ? String(empresa.altoPersonalizadoMm) : '');
      setMensajeAgradecimiento(empresa.mensajeAgradecimiento ?? '');
      setInfoAdicionalDocumentos(empresa.infoAdicionalDocumentos ?? '');
    }
  }, [empresa]);

  async function handleGuardar() {
    setError(null);
    setGuardado(false);
    if (!empresa) return;
    try {
      await actualizar.mutateAsync({
        nombre: empresa.nombre,
        tamanoImpresion,
        anchoPersonalizadoMm: tamanoImpresion === 'PERSONALIZADO' && anchoPersonalizadoMm ? Number(anchoPersonalizadoMm) : null,
        altoPersonalizadoMm: tamanoImpresion === 'PERSONALIZADO' && altoPersonalizadoMm ? Number(altoPersonalizadoMm) : null,
        mensajeAgradecimiento: mensajeAgradecimiento || undefined,
        infoAdicionalDocumentos: infoAdicionalDocumentos || undefined,
      });
      setGuardado(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo guardar la configuración de impresión'));
    }
  }

  if (isLoading) return <LoadingState />;

  return (
    <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-card lg:col-span-2">
      <div className="flex items-center gap-2">
        <Printer size={18} className="text-ink-400" />
        <h3 className="font-display text-base font-semibold text-ink-800">Impresión</h3>
      </div>
      <p className="mt-1 text-sm text-ink-400">
        Se aplica a facturas, cotizaciones, recibos, comprobantes, notas y reportes de todo el sistema.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Tamaño del documento</span>
          <select className="input" value={tamanoImpresion} onChange={(e) => setTamanoImpresion(e.target.value)}>
            <option value="TERMICA_58">Tirilla térmica 58mm</option>
            <option value="TERMICA_80">Tirilla térmica 80mm</option>
            <option value="MEDIA_CARTA">Media carta</option>
            <option value="CARTA">Carta</option>
            <option value="A4">A4</option>
            <option value="PERSONALIZADO">Personalizado</option>
          </select>
        </label>

        {tamanoImpresion === 'PERSONALIZADO' && (
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-700">Ancho (mm)</span>
              <input type="number" min={1} className="input" value={anchoPersonalizadoMm} onChange={(e) => setAnchoPersonalizadoMm(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-700">Alto (mm)</span>
              <input type="number" min={1} className="input" value={altoPersonalizadoMm} onChange={(e) => setAltoPersonalizadoMm(e.target.value)} />
            </label>
          </div>
        )}
      </div>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-sm font-medium text-ink-700">Mensaje de agradecimiento (opcional)</span>
        <input
          className="input"
          placeholder="Ej: ¡Gracias por tu compra!"
          value={mensajeAgradecimiento}
          onChange={(e) => setMensajeAgradecimiento(e.target.value)}
        />
      </label>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-sm font-medium text-ink-700">Información adicional al final del documento (opcional)</span>
        <textarea
          className="input"
          rows={2}
          placeholder="Ej: Horario de atención, política de garantía, redes sociales…"
          value={infoAdicionalDocumentos}
          onChange={(e) => setInfoAdicionalDocumentos(e.target.value)}
        />
      </label>

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
        Guardar configuración de impresión
      </button>
    </div>
  );
}

function RedesYBancoCard() {
  const { data: empresa, isLoading } = useEmpresa();
  const actualizar = useActualizarEmpresa();

  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [bancoNombre, setBancoNombre] = useState('');
  const [bancoTipoCuenta, setBancoTipoCuenta] = useState('');
  const [bancoNumeroCuenta, setBancoNumeroCuenta] = useState('');
  const [bancoTitular, setBancoTitular] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    if (empresa) {
      setFacebook(empresa.facebook ?? '');
      setInstagram(empresa.instagram ?? '');
      setWhatsapp(empresa.whatsapp ?? '');
      setBancoNombre(empresa.bancoNombre ?? '');
      setBancoTipoCuenta(empresa.bancoTipoCuenta ?? '');
      setBancoNumeroCuenta(empresa.bancoNumeroCuenta ?? '');
      setBancoTitular(empresa.bancoTitular ?? '');
    }
  }, [empresa]);

  async function handleGuardar() {
    setError(null);
    setGuardado(false);
    if (!empresa) return;
    try {
      await actualizar.mutateAsync({
        nombre: empresa.nombre,
        facebook: facebook || undefined,
        instagram: instagram || undefined,
        whatsapp: whatsapp || undefined,
        bancoNombre: bancoNombre || undefined,
        bancoTipoCuenta: bancoTipoCuenta || undefined,
        bancoNumeroCuenta: bancoNumeroCuenta || undefined,
        bancoTitular: bancoTitular || undefined,
      });
      setGuardado(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo guardar'));
    }
  }

  if (isLoading) return <LoadingState />;

  return (
    <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-card lg:col-span-2">
      <h3 className="font-display text-base font-semibold text-ink-800">Redes sociales y datos bancarios</h3>
      <p className="mt-1 text-sm text-ink-400">
        Aparecen en tus facturas y demás documentos, para que tus clientes te encuentren y te puedan pagar por
        transferencia directamente.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Facebook (opcional)</span>
          <input className="input" placeholder="facebook.com/tunegocio" value={facebook} onChange={(e) => setFacebook(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Instagram (opcional)</span>
          <input className="input" placeholder="@tunegocio" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">WhatsApp (opcional)</span>
          <input className="input" placeholder="+57 300 000 0000" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
        </label>
      </div>

      <div className="mt-5 border-t border-ink-100 pt-4">
        <p className="mb-3 text-sm font-medium text-ink-700">Información bancaria (opcional)</p>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Banco</span>
            <input className="input" value={bancoNombre} onChange={(e) => setBancoNombre(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Tipo de cuenta</span>
            <select className="input" value={bancoTipoCuenta} onChange={(e) => setBancoTipoCuenta(e.target.value)}>
              <option value="">Selecciona…</option>
              <option value="AHORROS">Ahorros</option>
              <option value="CORRIENTE">Corriente</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Número de cuenta</span>
            <input className="input" value={bancoNumeroCuenta} onChange={(e) => setBancoNumeroCuenta(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">A nombre de</span>
            <input className="input" value={bancoTitular} onChange={(e) => setBancoTitular(e.target.value)} />
          </label>
        </div>
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
        Guardar
      </button>
    </div>
  );
}

function SistemaCard() {
  const { data: empresa, isLoading } = useEmpresa();
  const actualizar = useActualizarEmpresa();

  const [moneda, setMoneda] = useState('COP');
  const [zonaHoraria, setZonaHoraria] = useState('America/Bogota');
  const [idioma, setIdioma] = useState('es');
  const [tema, setTema] = useState<'CLARO' | 'OSCURO'>('CLARO');
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    if (empresa) {
      setMoneda(empresa.moneda);
      setZonaHoraria(empresa.zonaHoraria);
      setIdioma(empresa.idioma);
      setTema(empresa.tema);
    }
  }, [empresa]);

  async function handleGuardar() {
    setError(null);
    setGuardado(false);
    if (!empresa) return;
    try {
      await actualizar.mutateAsync({ nombre: empresa.nombre, moneda, zonaHoraria, idioma, tema });
      setGuardado(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo guardar la configuración del sistema'));
    }
  }

  if (isLoading) return <LoadingState />;

  return (
    <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-card">
      <h3 className="font-display text-base font-semibold text-ink-800">Sistema</h3>

      <div className="mt-4 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Moneda</span>
          <select className="input" value={moneda} onChange={(e) => setMoneda(e.target.value)}>
            <option value="COP">Peso colombiano (COP)</option>
            <option value="USD">Dólar (USD)</option>
            <option value="MXN">Peso mexicano (MXN)</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Zona horaria</span>
          <select className="input" value={zonaHoraria} onChange={(e) => setZonaHoraria(e.target.value)}>
            <option value="America/Bogota">Bogotá (GMT-5)</option>
            <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
            <option value="America/Lima">Lima (GMT-5)</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Idioma</span>
          <select className="input" value={idioma} onChange={(e) => setIdioma(e.target.value)}>
            <option value="es">Español</option>
          </select>
          <span className="mt-1 block text-xs text-ink-400">
            El sistema hoy solo tiene textos en español — queda preparado para más idiomas en el futuro.
          </span>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Tema</span>
          <div className="flex gap-1 rounded-lg bg-ink-50 p-1 text-sm font-medium">
            <button
              onClick={() => setTema('CLARO')}
              className={`flex-1 rounded-md py-1.5 transition-colors ${tema === 'CLARO' ? 'bg-white text-ink-800 shadow-sm' : 'text-ink-400'}`}
            >
              Claro
            </button>
            <button
              onClick={() => setTema('OSCURO')}
              className={`flex-1 rounded-md py-1.5 transition-colors ${tema === 'OSCURO' ? 'bg-white text-ink-800 shadow-sm' : 'text-ink-400'}`}
            >
              Oscuro
            </button>
          </div>
          <span className="mt-1 block text-xs text-ink-400">
            Cambia el fondo general del sistema. Algunas pantallas puntuales todavía no se adaptan al modo oscuro.
          </span>
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
        Guardar
      </button>
    </div>
  );
}

function VentasGeneralCard() {
  const { data: empresa, isLoading } = useEmpresa();
  const actualizar = useActualizarEmpresa();

  const [permitirStockNegativo, setPermitirStockNegativo] = useState(false);
  const [confirmarAntesDeVenta, setConfirmarAntesDeVenta] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    if (empresa) {
      setPermitirStockNegativo(empresa.permitirStockNegativo);
      setConfirmarAntesDeVenta(empresa.confirmarAntesDeVenta);
    }
  }, [empresa]);

  async function handleGuardar() {
    setError(null);
    setGuardado(false);
    if (!empresa) return;
    try {
      await actualizar.mutateAsync({ nombre: empresa.nombre, permitirStockNegativo, confirmarAntesDeVenta });
      setGuardado(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo guardar la configuración de ventas'));
    }
  }

  if (isLoading) return <LoadingState />;

  return (
    <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-card">
      <h3 className="font-display text-base font-semibold text-ink-800">Ventas</h3>
      <p className="mt-1 text-xs text-ink-400">
        Los descuentos y los métodos de pago múltiples ya están siempre disponibles según el plan de la empresa —
        se administran en Descuentos y en Plataforma, no aquí.
      </p>

      <div className="mt-4 space-y-3">
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={permitirStockNegativo}
            onChange={(e) => setPermitirStockNegativo(e.target.checked)}
            className="mt-0.5 h-4 w-4"
          />
          <span>
            <span className="block text-sm font-medium text-ink-700">Permitir stock negativo</span>
            <span className="block text-xs text-ink-400">
              Si lo activas, el sistema deja vender un producto aunque el inventario quede en negativo (útil si el
              conteo puede estar desactualizado). Por defecto, el sistema bloquea la venta.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={confirmarAntesDeVenta}
            onChange={(e) => setConfirmarAntesDeVenta(e.target.checked)}
            className="mt-0.5 h-4 w-4"
          />
          <span>
            <span className="block text-sm font-medium text-ink-700">Confirmar antes de finalizar una venta</span>
            <span className="block text-xs text-ink-400">
              Muestra un cuadro de confirmación en el POS antes de cerrar cada venta.
            </span>
          </span>
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
        Guardar
      </button>
    </div>
  );
}

function InventarioGeneralCard() {
  const { data: empresa, isLoading } = useEmpresa();
  const actualizar = useActualizarEmpresa();

  const [stockMinimoDefault, setStockMinimoDefault] = useState('5');
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    if (empresa) setStockMinimoDefault(String(empresa.stockMinimoDefault));
  }, [empresa]);

  async function handleGuardar() {
    setError(null);
    setGuardado(false);
    if (!empresa) return;
    try {
      await actualizar.mutateAsync({ nombre: empresa.nombre, stockMinimoDefault: Number(stockMinimoDefault) || 0 });
      setGuardado(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo guardar la configuración de inventario'));
    }
  }

  if (isLoading) return <LoadingState />;

  return (
    <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-card">
      <h3 className="font-display text-base font-semibold text-ink-800">Inventario</h3>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-sm font-medium text-ink-700">Inventario mínimo por defecto</span>
        <input
          type="number"
          min={0}
          className="input"
          value={stockMinimoDefault}
          onChange={(e) => setStockMinimoDefault(e.target.value)}
        />
        <span className="mt-1 block text-xs text-ink-400">
          Se usa como referencia para la alerta de stock bajo cuando creas un producto nuevo — luego puedes ajustarlo
          producto por producto desde el kardex.
        </span>
      </label>

      <p className="mt-4 text-xs text-ink-400">
        Las notificaciones de inventario bajo/agotado y el comportamiento de combos y servicios se activan y
        configuran en Alertas y en Inventario → Combos respectivamente.
      </p>

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
        Guardar
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
