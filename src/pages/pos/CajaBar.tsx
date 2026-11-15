import {apiClient} from '@/api/client';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {listarCajasFisicas, crearCajaFisica} from '@/api/pos';
import {listarUsuarios} from '@/api/nucleo';
import {useAuthStore} from '@/stores/authStore';
import {useSicom} from '@/features/sicom/api';
import {PreviewPago} from '@/components/ui/PreviewPago';
import { useState, useEffect } from 'react';
import { Lock, Unlock, List, Plus, Loader2, AlertTriangle, Download } from 'lucide-react';
import { useSucursales } from '@/hooks/useSucursales';
import { usePosStore } from '@/stores/posStore';
import { useCajaAbierta, useAbrirCaja, useCerrarCaja, useMovimientosCaja, useRegistrarMovimientoCaja, useResumenCierre } from '@/hooks/usePos';
import { Modal } from '@/components/ui/Modal';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { getApiErrorMessage } from '@/api/errors';
import { descargarArchivo } from '@/lib/descargarArchivo';

export function CajaBar() {
  const {data:cfg}=useSicom();
  const puedeOperarCaja = useAuthStore(s => s.esSuperadmin || s.esAdministradorTotal || s.permisos.includes('CAJA_ABRIR_CERRAR'));
  const { data: sucursales } = useSucursales();
  const { sucursalId, setSucursalId, cajaFisicaId, setCajaFisicaId } = usePosStore();
  const usuarioId = useAuthStore(s => s.usuarioId);
  const administra = useAuthStore(s => s.esSuperadmin || s.esAdministradorTotal);
  const qc = useQueryClient();
  const fisicas = useQuery({queryKey:['cajas-fisicas',sucursalId,usuarioId],
    queryFn:()=>listarCajasFisicas(sucursalId!),enabled:sucursalId !== null});
  const crearFisica = useMutation({mutationFn:crearCajaFisica,
    onSuccess: async (c,variables)=>{await qc.invalidateQueries({queryKey:['cajas-fisicas',variables.sucursalId]});
      if(usePosStore.getState().sucursalId===variables.sucursalId) setCajaFisicaId(c.id);}});
  const [nombreCaja,setNombreCaja]=useState('');
  const [asignadaA,setAsignadaA]=useState('');
  const [modalFisica,setModalFisica]=useState(false);
  const [modalLimites,setModalLimites]=useState(false);
  const [faltante,setFaltante]=useState('');
  const [sobrante,setSobrante]=useState('');
  const limitesUrl = `/caja/fisicas/${cajaFisicaId}/limites`;
  const limites = useQuery({queryKey:['limites-caja',usuarioId,sucursalId,cajaFisicaId],
    queryFn:async()=> (await apiClient.get<{faltante:number|null;sobrante:number|null}>(limitesUrl,{params:{sucursalId}})).data,
    enabled:administra && modalLimites && !!cajaFisicaId});
  useEffect(()=>{if(limites.data){setFaltante(String(limites.data.faltante ?? ''));setSobrante(String(limites.data.sobrante ?? ''));}},[limites.data]);
  const guardarLimites = useMutation({mutationFn:()=>apiClient.put(limitesUrl,
    {faltante:faltante===''?null:Number(faltante),sobrante:sobrante===''?null:Number(sobrante)},{params:{sucursalId}}),
    onSuccess:()=>{void qc.invalidateQueries({queryKey:['limites-caja']});setModalLimites(false);}});
  const empleados=useQuery({queryKey:['cajas-trabajadores',usuarioId],queryFn:listarUsuarios,enabled:administra && modalFisica});

  useEffect(()=>{
    if(fisicas.data && !fisicas.data.some(c=>c.id===cajaFisicaId))
      setCajaFisicaId(fisicas.data.length===1 ? fisicas.data[0].id : null);
  },[fisicas.data,cajaFisicaId,setCajaFisicaId]);
  const [modalAbrir, setModalAbrir] = useState(false);
  const [modalCerrar, setModalCerrar] = useState(false);
  const [modalMovimientos, setModalMovimientos] = useState(false);

  useEffect(() => {
    if (sucursales && !sucursales.some(s => s.id === sucursalId)) {
      setSucursalId(sucursales[0]?.id ?? null);
    }
  }, [sucursalId, sucursales, setSucursalId]);

  const { data: caja, isLoading } = useCajaAbierta(sucursalId);
  const { data: movimientos } = useMovimientosCaja(caja?.id ?? null);
  const sucursalActual = sucursales?.find((s) => s.id === sucursalId);

  const efectivoActual =
    caja && movimientos
      ? caja.montoApertura +
        movimientos.filter((m) => m.tipo === 'INGRESO').reduce((acc, m) => acc + m.monto, 0) -
        movimientos.filter((m) => m.tipo === 'EGRESO').reduce((acc, m) => acc + m.monto, 0)
      : 0;

  const efectivoSuperado =
    !!caja &&
    !!sucursalActual?.alertaEfectivoActiva &&
    !!sucursalActual?.montoMaximoEfectivo &&
    efectivoActual >= sucursalActual.montoMaximoEfectivo;

  return (
    <div>
      {efectivoSuperado && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle size={18} className="shrink-0" />
          <p>
            Esta caja tiene <span className="font-semibold">${efectivoActual.toLocaleString('es-CO')}</span> en
            efectivo, superando el máximo recomendado de{' '}
            <span className="font-semibold">${sucursalActual!.montoMaximoEfectivo!.toLocaleString('es-CO')}</span>.
            Considera hacer una consignación o transferencia bancaria pronto.
          </p>
        </div>
      )}

      <div className="mb-5 flex items-center justify-between rounded-xl border border-ink-100 bg-white px-4 py-3 shadow-card">
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <span className="font-medium text-ink-700">Sucursal:</span>
          <select
            className="input max-w-xs"
            value={sucursalId ?? ''}
            onChange={(e) => setSucursalId(Number(e.target.value))}
          >
            {sucursales?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </label>

        {Boolean(fisicas.data?.length) && <label className="flex items-center gap-2 text-sm">
          Caja física
          <select className="input" value={cajaFisicaId ?? ''} onChange={e=>setCajaFisicaId(e.target.value ? Number(e.target.value) : null)}>
            <option value="">Selecciona una caja</option>
            {fisicas.data?.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </label>}
        {fisicas.isError && <span role="alert" className="text-sm text-danger-600">{getApiErrorMessage(fisicas.error,'No se pudo consultar las cajas físicas')}</span>}
        {!isLoading && (
          <span
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              caja ? 'bg-success-50 text-success-600' : 'bg-ink-100 text-ink-500'
            }`}
          >
            {caja ? <Unlock size={14} /> : <Lock size={14} />}
            {caja?.cierrePendiente ? 'Cierre de jornada pendiente' : caja ? `Caja abierta (apertura: $${caja.montoApertura.toLocaleString('es-CO')})` : 'Caja cerrada'}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {administra && cajaFisicaId && <button className="rounded-lg border px-3 py-2 text-sm" onClick={()=>{guardarLimites.reset();setModalLimites(true);}}>Límites de caja</button>}
        {administra && sucursalId && <button className="rounded-lg border px-3 py-2 text-sm" onClick={()=>{crearFisica.reset();setModalFisica(true);}}>Nueva caja</button>}
        {caja && !cfg?.facturador && (
          <button
            onClick={() => setModalMovimientos(true)}
            className="flex items-center gap-1.5 rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50"
          >
            <List size={16} />
            Movimientos
          </button>
        )}
        {caja ? (puedeOperarCaja && (
          <button
            onClick={() => setModalCerrar(true)}
            className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50"
          >
            Cerrar caja
          </button>
        )) : (puedeOperarCaja && (
          <button
            onClick={() => setModalAbrir(true)}
            disabled={!sucursalId || !fisicas.isSuccess || isLoading || (fisicas.data.length > 1 && !cajaFisicaId)}
            className="rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
          >
            Abrir caja
          </button>
        ))}
      </div>
      </div>

      <Modal isOpen={modalLimites} onClose={()=>setModalLimites(false)} title="Límites de descuadre" size="sm">
        {limites.isLoading ? <LoadingState /> : limites.isError ? <p role="alert">{getApiErrorMessage(limites.error,'No se pudieron consultar los límites')}</p> :
          <form className="space-y-3" onSubmit={e=>{e.preventDefault();guardarLimites.mutate();}}>
            <p className="text-sm">Deja un campo vacío para no aplicar ese límite. Cero exige que no haya diferencia de ese tipo.</p>
            <label className="block text-sm">Faltante máximo<input type="number" min="0" step="0.01" className="input" value={faltante} onChange={e=>setFaltante(e.target.value)}/></label>
            <label className="block text-sm">Sobrante máximo<input type="number" min="0" step="0.01" className="input" value={sobrante} onChange={e=>setSobrante(e.target.value)}/></label>
            {guardarLimites.isError && <p role="alert">{getApiErrorMessage(guardarLimites.error,'No se pudieron guardar los límites')}</p>}
            <button disabled={!limites.isSuccess || guardarLimites.isPending} className="rounded border px-3 py-2">Guardar</button>
          </form>}
      </Modal>
      <Modal isOpen={modalFisica} onClose={()=>setModalFisica(false)} title="Nueva caja física" size="sm">
        <form className="space-y-3" onSubmit={async e=>{e.preventDefault();if(!sucursalId)return;
          try {await crearFisica.mutateAsync({sucursalId,nombre:nombreCaja,asignadaA:asignadaA?Number(asignadaA):undefined});
            setModalFisica(false);setNombreCaja('');setAsignadaA('');
          } catch { /* El error se muestra en el formulario. */ }
        }}>
          <label className="block text-sm">Nombre<input required maxLength={60} className="input" value={nombreCaja} onChange={e=>setNombreCaja(e.target.value)}/></label>
          <label className="block text-sm">Trabajador asignado
            <select className="input" value={asignadaA} onChange={e=>setAsignadaA(e.target.value)}>
              <option value="">Libre</option>
              {empleados.data?.filter(u=>u.estado && sucursalId !== null && u.sucursalIds?.includes(sucursalId))
                .map(u=><option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>)}
            </select>
          </label>
          {crearFisica.isError && <p role="alert">{getApiErrorMessage(crearFisica.error,'No se pudo crear la caja')}</p>}
          <button disabled={crearFisica.isPending} className="rounded border px-3 py-2">Crear caja</button>
        </form>
      </Modal>
      <AbrirCajaModal isOpen={modalAbrir} onClose={() => setModalAbrir(false)} sucursalId={sucursalId} cajaFisicaId={cajaFisicaId ?? undefined} />
      {caja && (
        <>
          <CerrarCajaModal isOpen={modalCerrar} onClose={() => setModalCerrar(false)} cajaId={caja.id} />
          <MovimientosCajaModal
            isOpen={modalMovimientos}
            onClose={() => setModalMovimientos(false)}
            cajaId={caja.id}
          />
        </>
      )}
    </div>
  );
}

function MovimientosCajaModal({
  isOpen,
  onClose,
  cajaId,
}: {
  isOpen: boolean;
  onClose: () => void;
  cajaId: number;
}) {
  const { data: movimientos, isLoading } = useMovimientosCaja(cajaId);
  const registrar = useRegistrarMovimientoCaja();
  const [mostrarForm, setMostrarForm] = useState(false);
  const [tipo, setTipo] = useState<'INGRESO' | 'EGRESO'>('EGRESO');
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleRegistrar() {
    setError(null);
    if (!concepto.trim() || !monto) {
      setError('Completa el concepto y el monto');
      return;
    }
    try {
      await registrar.mutateAsync({ id: cajaId, data: { tipo, concepto, monto: Number(monto) } });
      setConcepto('');
      setMonto('');
      setMostrarForm(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo registrar el movimiento'));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Movimientos de caja" size="md">
      <div className="space-y-4">
        {!mostrarForm ? (
          <button
            onClick={() => setMostrarForm(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-ink-700 hover:text-ink-900"
          >
            <Plus size={16} />
            Registrar ingreso/egreso manual
          </button>
        ) : (
          <div className="rounded-lg border border-ink-100 bg-ink-50 p-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-600">Tipo</span>
                <select
                  className="input"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as 'INGRESO' | 'EGRESO')}
                >
                  <option value="EGRESO">Egreso (sale dinero)</option>
                  <option value="INGRESO">Ingreso (entra dinero)</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-600">Monto</span>
                <input type="number" className="input" value={monto} onChange={(e) => setMonto(e.target.value)} />
              </label>
            </div>
            <label className="mt-3 block">
              <span className="mb-1 block text-xs font-medium text-ink-600">Concepto</span>
              <input
                className="input"
                placeholder="Ej: Compra de bolsas, propina repartida…"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
              />
            </label>
            {error && <p className="mt-2 text-xs text-danger-500">{error}</p>}
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => setMostrarForm(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-ink-500 hover:bg-ink-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegistrar}
                disabled={registrar.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
              >
                {registrar.isPending && <Loader2 size={14} className="animate-spin" />}
                Registrar
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <LoadingState />
        ) : movimientos && movimientos.length > 0 ? (
          <div className="max-h-72 overflow-x-auto overflow-y-auto rounded-lg border border-ink-100">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-ink-50 text-xs text-ink-500">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Concepto</th>
                  <th className="px-3 py-2 text-left font-medium">Tipo</th>
                  <th className="px-3 py-2 text-right font-medium">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {movimientos.map((m) => (
                  <tr key={m.id}>
                    <td className="px-3 py-2 text-ink-700">{m.concepto ?? '—'}</td>
                    <td className={`px-3 py-2 font-medium ${m.tipo === 'INGRESO' ? 'text-success-500' : 'text-danger-500'}`}>
                      {m.tipo}
                    </td>
                    <td className="px-3 py-2 text-right text-ink-800">${m.monto.toLocaleString('es-CO')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="Sin movimientos todavía" />
        )}
      </div>
    </Modal>
  );
}

function AbrirCajaModal({
  isOpen,
  onClose,
  sucursalId,
  cajaFisicaId,
}: {
  isOpen: boolean;
  onClose: () => void;
  sucursalId: number | null;
  cajaFisicaId?: number;
}) {
  const abrir = useAbrirCaja();
  const [montoApertura, setMontoApertura] = useState('0');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (!sucursalId) return;
    try {
      await abrir.mutateAsync({ sucursalId, montoApertura: Number(montoApertura), cajaFisicaId });
      setMontoApertura('0');
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo abrir la caja'));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Abrir caja" size="sm">
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-700">Monto de apertura (efectivo inicial)</span>
          <input
            type="number"
            className="input"
            value={montoApertura}
            onChange={(e) => setMontoApertura(e.target.value)}
          />
        </label>

        {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={abrir.isPending}
            className="rounded-lg bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
          >
            Abrir caja
          </button>
        </div>
      </div>
    </Modal>
  );
}

function CerrarCajaModal({ isOpen, onClose, cajaId }: { isOpen: boolean; onClose: () => void; cajaId: number }) {
  const cerrar = useCerrarCaja();
  const { data: resumen, isLoading: cargandoResumen } = useResumenCierre(isOpen ? cajaId : null);
  const [montoReal, setMontoReal] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cerrado, setCerrado] = useState(false);
  const [pidiendoConfirmacion, setPidiendoConfirmacion] = useState(false);

  const diferenciaActual =
    resumen?.resumenCompleto && montoReal
      ? Number(montoReal) - (resumen.montoCierreSistema ?? 0)
      : 0;

  async function handleSubmit() {
    setError(null);
    // Si hay diferencia y todavía no se confirmó explícitamente, se detiene aquí y se
    // muestra la advertencia — el cierre real solo pasa cuando el usuario dice que sí.
    if (resumen?.resumenCompleto && diferenciaActual !== 0 && !pidiendoConfirmacion) {
      setPidiendoConfirmacion(true);
      return;
    }
    try {
      await cerrar.mutateAsync({ id: cajaId, montoCierreReal: Number(montoReal), observaciones: observaciones || undefined });
      setCerrado(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo cerrar la caja'));
    }
  }

  function handleClose() {
    setMontoReal('');
    setObservaciones('');
    setCerrado(false);
    setPidiendoConfirmacion(false);
    onClose();
  }

  function money(v: number | null) {
    return `$${(v ?? 0).toLocaleString('es-CO')}`;
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Cierre de caja" size="md"><PreviewPago pagoId={cajaId} corte/>
      {cargandoResumen ? (
        <LoadingState />
      ) : !resumen ? null : cerrado ? (
        <div className="space-y-3">
          <div className="rounded-lg bg-success-50 px-3 py-2.5 text-sm text-success-600">
            Caja cerrada correctamente.
          </div>
          <ResumenTabla resumen={resumen} montoReal={Number(montoReal)} money={money} />
          {resumen.resumenCompleto && (
            <button
              onClick={() => descargarArchivo(`/caja/${cajaId}/resumen-cierre/exportar`, `cierre-caja-${cajaId}.xlsx`)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-ink-200 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50"
            >
              <Download size={15} />
              Descargar en Excel
            </button>
          )}
          <button onClick={handleClose} className="w-full rounded-lg bg-ink-800 py-2 text-sm font-semibold text-white hover:bg-ink-700">
            Listo
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <ResumenTabla resumen={resumen} montoReal={montoReal ? Number(montoReal) : null} money={money} />

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Efectivo contado físicamente</span>
            <input
              type="number"
              className="input"
              value={montoReal}
              onChange={(e) => {
                setMontoReal(e.target.value);
                setPidiendoConfirmacion(false);
              }}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Observaciones (opcional)</span>
            <textarea
              className="input"
              rows={2}
              placeholder="Explica cualquier diferencia, si la hay…"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </label>

          {error && <div className="rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-600">{error}</div>}

          {pidiendoConfirmacion && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">El efectivo contado no cuadra con lo esperado</p>
                <p className="mt-0.5">
                  Diferencia de {money(diferenciaActual)}. Puedes cerrar así de todas formas (queda registrada la
                  diferencia y el administrador recibe una alerta), o cancelar y volver a contar.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => (pidiendoConfirmacion ? setPidiendoConfirmacion(false) : handleClose())}
              className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50"
            >
              {pidiendoConfirmacion ? 'No, volver a contar' : 'Cancelar'}
            </button>
            <button
              onClick={handleSubmit}
              disabled={cerrar.isPending || !montoReal}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${
                pidiendoConfirmacion ? 'bg-amber-600 hover:bg-amber-700' : 'bg-ink-800 hover:bg-ink-700'
              }`}
            >
              {cerrar.isPending && <Loader2 size={15} className="animate-spin" />}
              {pidiendoConfirmacion ? 'Sí, cerrar de todas formas' : 'Confirmar cierre'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function ResumenTabla({
  resumen,
  montoReal,
  money,
}: {
  resumen: import('@/types/pos').ResumenCierreCaja;
  montoReal: number | null;
  money: (v: number | null) => string;
}) {
  if (!resumen.resumenCompleto) {
    // Sin el permiso "Caja: Ver resumen financiero" el cajero cuenta a ciegas: no ve
    // ventas por medio de pago, ingresos/egresos ni el monto esperado en sistema.
    return (
      <div className="space-y-3 rounded-lg border border-ink-100 bg-ink-50/60 p-4 text-sm">
        <div className="flex justify-between text-ink-600">
          <span>Apertura</span>
          <span className="font-medium text-ink-800">{money(resumen.montoApertura)}</span>
        </div>
        <p className="border-t border-ink-100 pt-2 text-xs text-ink-400">
          Cuenta el efectivo físico de la caja y escribe el total abajo. Tu rol no tiene permiso para ver el
          desglose financiero de este cierre.
        </p>
      </div>
    );
  }

  const diferencia = montoReal !== null ? montoReal - (resumen.montoCierreSistema ?? 0) : resumen.diferencia;
  return (
    <div className="space-y-3 rounded-lg border border-ink-100 bg-ink-50/60 p-4 text-sm">
      <div className="flex justify-between text-ink-600">
        <span>Apertura</span>
        <span className="font-medium text-ink-800">{money(resumen.montoApertura)}</span>
      </div>
      <div className="border-t border-ink-100 pt-2">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-400">
          Ventas ({resumen.numeroVentas})
        </p>
        <div className="flex justify-between text-ink-600"><span>Efectivo</span><span>{money(resumen.ventasEfectivo)}</span></div>
        <div className="flex justify-between text-ink-600"><span>Tarjeta</span><span>{money(resumen.ventasTarjeta)}</span></div>
        <div className="flex justify-between text-ink-600"><span>Transferencia</span><span>{money(resumen.ventasTransferencia)}</span></div>
        <div className="flex justify-between text-ink-600"><span>Crédito</span><span>{money(resumen.ventasCredito)}</span></div>
        {resumen.ventasOtros > 0 && (
          <div className="flex justify-between text-ink-600"><span>Otros</span><span>{money(resumen.ventasOtros)}</span></div>
        )}
        <div className="mt-1 flex justify-between font-medium text-ink-800"><span>Total ventas</span><span>{money(resumen.ventasTotal)}</span></div>
      </div>
      <div className="border-t border-ink-100 pt-2">
        <div className="flex justify-between text-ink-600"><span>Ingresos manuales</span><span>{money(resumen.ingresosManuales)}</span></div>
        <div className="flex justify-between text-ink-600"><span>Egresos manuales</span><span>{money(resumen.egresosManuales)}</span></div>
      </div>
      <div className="border-t border-ink-100 pt-2 font-medium text-ink-800">
        <div className="flex justify-between"><span>Efectivo esperado en caja</span><span>{money(resumen.montoCierreSistema)}</span></div>
        {montoReal !== null && (
          <>
            <div className="flex justify-between"><span>Efectivo contado</span><span>{money(montoReal)}</span></div>
            <div className={`flex justify-between ${diferencia === 0 ? 'text-success-600' : 'text-amber-600'}`}>
              <span>Diferencia</span><span>{money(diferencia)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
