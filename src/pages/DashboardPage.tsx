import { useState,createContext,useContext, type ReactNode } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { useAuthStore } from '@/stores/authStore';
import { useSucursales } from '@/hooks/useSucursales';
import { useDashboard } from '@/hooks/useDashboard';
import { useAlertas } from '@/hooks/useGestion';
import { useMiPlan } from '@/hooks/usePlataforma';
import {
  puedeVerRuta, incluidaEnPlan, incluidaEnPlanDirecta, puedeVerModulo,
  MODULO_SERVICIOS_CITAS, MODULO_SERVICIOS_ORDENES, PLAN_SERVICIOS_CITAS, PLAN_SERVICIOS_ORDENES,
} from '@/lib/permisos';
import { useMesas, useAnaliticaRestaurante } from '@/hooks/useRestaurante';
import { useCitas, useAnaliticaServicios } from '@/hooks/useServicios';
import { useDashboardPrestamos } from '@/hooks/usePrestamos';
import { useDomicilios } from '@/hooks/useDomicilios';
import {
  TrendingUp, TrendingDown, Package, AlertTriangle, Wallet, Users, ShoppingCart, Percent,
  UtensilsCrossed, CalendarClock, Landmark, Bike,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { DetalleReporte } from '@/features/reportes/DetalleReporte';
import { FiltrosReportes,useFiltrosReportes,hoy as fechaHoy,type Filtro } from '@/features/reportes/FiltrosReportes';
import { PendientesDashboard } from '@/features/reportes/PendientesDashboard';
import { getApiErrorMessage } from '@/api/errors';
import { Link } from 'react-router-dom';
import { LoadingState } from '@/components/ui/States';

const COLORES = ['#0f172a', '#f59e0b', '#0ea5e9', '#10b981', '#8b5cf6', '#f43f5e'];

function primerDiaDelMes(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}
function money(v: number) {
  if(v==null)return 'Restringido';
  return `$${v.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const AbrirIndicador=createContext<(label:string)=>void>(()=>{});
export default function DashboardPage(){const auth=useAuthStore();if(!auth.esSuperadmin&&!auth.esAdministradorTotal&&!auth.permisos.includes('REPORTES_CONSULTAR'))return <div><h1 className="font-display text-2xl font-semibold text-ink-800">Inicio</h1><p className="mt-2 text-sm text-ink-500">Usa el menú para abrir las operaciones autorizadas de tu perfil. Los indicadores financieros requieren permiso de reportes.</p></div>;return <DashboardResumen/>;}
function descargarDashboard(datos:unknown,f:Filtro){const filas:string[][]=[['Dashboard SICOM'],['Desde',f.desde,'Hasta',f.hasta,'Sucursal',f.sucursalId||'Todas'],['Nota','Los saldos son actuales. Los indicadores especializados históricos se identifican en pantalla.'],['Indicador','Valor']];function recorrer(x:unknown,p:string){if(x==null)return;if(Array.isArray(x)){x.forEach((v,i)=>recorrer(v,`${p} ${i+1}`));return;}if(typeof x==='object'){Object.entries(x).forEach(([k,v])=>recorrer(v,`${p} ${k.replace(/([A-Z])/g,' $1').toLowerCase()}`.trim()));return;}filas.push([p,typeof x==='number'?x.toLocaleString('es-CO',{maximumFractionDigits:3}):String(x)]);}recorrer(datos,'');const text='\uFEFF'+filas.map(a=>a.map(v=>'"'+v.replace(/^[=+@\t\r-]/,m=>"'"+m).replaceAll('"','""')+'"').join(';')).join('\r\n');const url=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download=`sicom-dashboard-${f.desde}-${f.hasta}.csv`;a.click();URL.revokeObjectURL(url);}
function DashboardResumen() {
  const nombreCompleto = useAuthStore((state) => state.nombreCompleto);
  const esAdministradorTotal = useAuthStore((state) => state.esAdministradorTotal);
  const permisos = useAuthStore((state) => state.permisos);
  const { data: miPlan } = useMiPlan();
  const { data: sucursales } = useSucursales();
  const {f:guardados,cambiar}=useFiltrosReportes();
  const f={...guardados,usuarioId:'',estado:''};const desde=f.desde,hasta=f.hasta,sucursalId=f.sucursalId?Number(f.sucursalId):null;
  const [detalle,setDetalle]=useState<{tipo:string;f:Filtro;nota?:string}|null>(null);
  const auth=useAuthStore();const costos=auth.esSuperadmin||auth.esAdministradorTotal||auth.permisos.includes('REPORTES_VER_COSTOS');
  function abrir(label:string){let tipo='ventas',ff={...f},nota='';switch(label){case 'Hoy':ff.desde=ff.hasta=fechaHoy();break;case 'Este mes':ff.desde=fechaHoy().slice(0,7)+'-01';ff.hasta=fechaHoy();break;case 'Este año':ff.desde=fechaHoy().slice(0,4)+'-01-01';ff.hasta=fechaHoy();break;case 'Stock bajo':tipo='inventario';ff.estado='BAJO';break;case 'Agotados':tipo='inventario';ff.estado='AGOTADO';break;case 'Valor del inventario':tipo='inventario';break;case 'Saldo actual':tipo='cajas';break;case 'Entradas':tipo='caja';ff.estado='INGRESO';break;case 'Salidas':tipo='caja';ff.estado='EGRESO';break;case 'Nuevos':tipo='clientes';nota='El indicador cuenta clientes activos creados en el período en toda la empresa; este directorio es actual y no filtra por creación.';break;case 'Frecuentes':tipo='ventas';nota='Frecuentes: clientes con dos o más ventas completadas en el período. Revisa sus ventas en el detalle.';break;case 'Con cartera':case 'Cuentas por cobrar':tipo='cxc';break;case 'Compras del período':tipo='compras';break;case 'Gastos del período':tipo='gastos';break;case 'Utilidad estimada':case 'Margen':tipo='utilidad';if(!costos)return;nota=label==='Margen'?'Margen = utilidad estimada / ventas sin impuestos × 100.':'';break;case 'Ticket promedio':nota='Ticket = total de ventas completadas / número de ventas.';break;case 'Productos vendidos':nota='Suma de cantidades en líneas vendidas. Puede mezclar unidades de distintos productos.';break;case 'Vs. período anterior':nota='Variación = (ventas del período − ventas del período anterior de igual duración) / ventas anteriores × 100. Si no hubo ventas anteriores, no se calcula porcentaje.';break;default:nota='Consulta las filas que componen este indicador.';}
   setDetalle({tipo,f:ff,nota});
  }
  const { data, isLoading,error } = useDashboard(desde, hasta, sucursalId);
  const { data: alertas } = useAlertas();

  function moduloHabilitado(ruta: string) {
    const tienePermiso = esAdministradorTotal || puedeVerRuta(permisos, ruta);
    return tienePermiso && incluidaEnPlan(miPlan?.rutasHabilitadas, ruta);
  }
  const mostrarRestaurante = moduloHabilitado('/restaurante');
  const mostrarServiciosCitas =
    incluidaEnPlanDirecta(miPlan?.rutasHabilitadas, PLAN_SERVICIOS_CITAS) &&
    (esAdministradorTotal || puedeVerModulo(permisos, MODULO_SERVICIOS_CITAS));
  const mostrarServiciosOrdenes =
    incluidaEnPlanDirecta(miPlan?.rutasHabilitadas, PLAN_SERVICIOS_ORDENES) &&
    (esAdministradorTotal || puedeVerModulo(permisos, MODULO_SERVICIOS_ORDENES));
  const mostrarServicios = mostrarServiciosCitas || mostrarServiciosOrdenes;
  const mostrarPrestamos = moduloHabilitado('/prestamos');
  const mostrarDomicilios = moduloHabilitado('/domicilios');
  const hayModuloEspecializado = mostrarRestaurante || mostrarServicios || mostrarPrestamos || mostrarDomicilios;

  const { data: mesas } = useMesas();
  const { data: citas } = useCitas();
  const { data: dashPrestamos } = useDashboardPrestamos();
  const { data: domicilios } = useDomicilios(true);
  const { data: analiticaRestaurante } = useAnaliticaRestaurante(desde, hasta, mostrarRestaurante);
  const { data: analiticaServicios } = useAnaliticaServicios(desde, hasta, mostrarServicios);

  return (
    <AbrirIndicador.Provider value={abrir}><div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-800">
            Hola, {nombreCompleto?.split(' ')[0]}
          </h1>
          <p className="mt-1 text-sm text-ink-400">Este es el estado de tu negocio.</p>
        </div>

        <div className="space-y-2"><FiltrosReportes f={f} cambiar={cambiar}/><button className="rounded border px-3 py-2 text-xs" disabled={!data||isLoading} onClick={()=>descargarDashboard({general:data,restaurante:analiticaRestaurante,servicios:analiticaServicios,prestamosHistorico:dashPrestamos},f)}>Descargar dashboard (CSV / Excel)</button></div>

      </div>

      <div className="mt-4"><PendientesDashboard f={f}/></div>
      {error&&<p role="alert" className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{getApiErrorMessage(error,'No se pudo cargar el dashboard')}</p>}
      {(alertas?.length ?? 0) > 0 && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">
            Tienes {alertas!.length} alerta{alertas!.length === 1 ? '' : 's'} activa{alertas!.length === 1 ? '' : 's'}.{' '}
            <Link to="/alertas" className="underline">
              Revisarlas
            </Link>
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="mt-8">
          <LoadingState />
        </div>
      ) : data ? (
        <div className="mt-6 space-y-8">
          {/* Ventas */}
          <Seccion titulo="Ventas">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <Kpi label="Hoy" value={money(data.ventas.hoy)} icon={TrendingUp} tone="text-success-500" />
              <Kpi label="Este mes" value={money(data.ventas.mes)} icon={TrendingUp} tone="text-ink-600" />
              <Kpi label="Este año" value={money(data.ventas.anio)} icon={TrendingUp} tone="text-ink-600" />
              <Kpi
                label="Vs. período anterior"
                value={data.ventas.comparativoPeriodoAnterior !== null ? `${data.ventas.comparativoPeriodoAnterior}%` : '—'}
                icon={data.ventas.comparativoPeriodoAnterior !== null && data.ventas.comparativoPeriodoAnterior < 0 ? TrendingDown : TrendingUp}
                tone={
                  data.ventas.comparativoPeriodoAnterior === null
                    ? 'text-ink-400'
                    : data.ventas.comparativoPeriodoAnterior >= 0
                      ? 'text-success-500'
                      : 'text-danger-500'
                }
              />
              <Kpi label="Ventas en el período" value={money(data.ventas.totalPeriodo)} icon={ShoppingCart} tone="text-ink-600" />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <GraficoBarras titulo="Productos más vendidos" datos={data.ventas.productosMasVendidos} />
              <GraficoBarras titulo="Categorías más vendidas ($)" datos={data.ventas.categoriasMasVendidas} formatoMoneda />
              <GraficoBarras titulo="Ventas por hora" datos={data.ventas.ventasPorHora} formatoMoneda />
            </div>
          </Seccion>

          {/* Inventario */}
          <Seccion titulo="Inventario">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Kpi label="Valor del inventario" value={money(data.inventario.valorTotal)} icon={Package} tone="text-ink-600" />
              <Kpi
                label="Stock bajo"
                value={String(data.inventario.productosStockBajo)}
                icon={AlertTriangle}
                tone={data.inventario.productosStockBajo > 0 ? 'text-amber-500' : 'text-ink-400'}
              />
              <Kpi
                label="Agotados"
                value={String(data.inventario.productosAgotados)}
                icon={AlertTriangle}
                tone={data.inventario.productosAgotados > 0 ? 'text-danger-500' : 'text-ink-400'}
              />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <GraficoBarras titulo="Mayor rotación" datos={data.inventario.mayorRotacion} />
              <GraficoBarras titulo="Menor rotación" datos={data.inventario.menorRotacion} />
            </div>
          </Seccion>

          {/* Caja */}
          <Seccion titulo="Caja">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Kpi label="Saldo actual" value={money(data.caja.saldoActual)} icon={Wallet} tone="text-success-500" />
              <Kpi label="Entradas" value={money(data.caja.ingresos)} icon={TrendingUp} tone="text-success-500" />
              <Kpi label="Salidas" value={money(data.caja.salidas)} icon={TrendingDown} tone="text-danger-500" />
            </div>
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2">
              <GraficoTorta
                titulo="Ingresos por método de pago"
                datos={[
                  { nombre: 'Efectivo', valor: data.caja.efectivo },
                  { nombre: 'Tarjeta', valor: data.caja.tarjeta },
                  { nombre: 'Transferencia', valor: data.caja.transferencia },
                  { nombre: 'Otros', valor: data.caja.otros },
                ].filter((d) => d.valor > 0)}
              />
            </div>
          </Seccion>

          {/* Clientes */}
          <Seccion titulo="Clientes">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Kpi label="Nuevos" value={String(data.clientes.nuevos)} icon={Users} tone="text-ink-600" />
              <Kpi label="Frecuentes" value={String(data.clientes.frecuentes)} icon={Users} tone="text-ink-600" />
              <Kpi label="Con cartera" value={String(data.clientes.conCartera)} icon={Users} tone="text-amber-500" />
              <Kpi label="Cuentas por cobrar" value={money(data.clientes.totalCuentasPorCobrar)} icon={Wallet} tone="text-amber-500" />
            </div>
          </Seccion>

          {/* Compras */}
          <Seccion titulo="Compras y gastos">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Kpi label="Compras del período" value={money(data.compras.totalCompras)} icon={ShoppingCart} tone="text-ink-600" />
              <Kpi label="Gastos del período" value={money(data.compras.totalGastos)} icon={TrendingDown} tone="text-danger-500" />
            </div>
            {data.compras.proveedoresPrincipales.length > 0 && (
              <div className="mt-4">
                <GraficoBarras titulo="Proveedores principales" datos={data.compras.proveedoresPrincipales} formatoMoneda />
              </div>
            )}
          </Seccion>

          {/* Indicadores */}
          <Seccion titulo="Indicadores">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <Kpi
                label="Utilidad estimada"
                value={money(data.indicadores.utilidadEstimada)}
                icon={data.indicadores.utilidadEstimada >= 0 ? TrendingUp : TrendingDown}
                tone={data.indicadores.utilidadEstimada >= 0 ? 'text-success-500' : 'text-danger-500'}
              />
              <Kpi
                label="Margen"
                value={`${data.indicadores.margenPorcentaje}%`}
                icon={Percent}
                tone={
                  data.indicadores.margenPorcentaje >= 20
                    ? 'text-success-600'
                    : data.indicadores.margenPorcentaje >= 5
                      ? 'text-amber-600'
                      : 'text-danger-500'
                }
              />
              <Kpi label="Ticket promedio" value={money(data.indicadores.ticketPromedio)} icon={ShoppingCart} tone="text-ink-600" />
              <Kpi label="Número de ventas" value={String(data.indicadores.numeroVentas)} icon={ShoppingCart} tone="text-ink-600" />
              <Kpi label="Productos vendidos" value={String(data.indicadores.cantidadProductosVendidos)} icon={Package} tone="text-ink-600" />
            </div>
          </Seccion>

          {/* Módulos especializados */}
          {hayModuloEspecializado && (
            <Seccion titulo="Tus módulos">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {mostrarRestaurante && mesas && (
                  <TarjetaModulo
                    to="/restaurante"
                    icon={UtensilsCrossed}
                    titulo="Restaurante"
                    valor={`${mesas.filter((m) => m.estado === 'OCUPADA').length} / ${mesas.length}`}
                    etiqueta="mesas ocupadas"
                  />
                )}
                {mostrarServicios && citas && (
                  <TarjetaModulo
                    to="/servicios"
                    icon={CalendarClock}
                    titulo="Servicios"
                    valor={String(citas.length)}
                    etiqueta="citas próximas"
                  />
                )}
                {mostrarPrestamos && dashPrestamos && (
                  <TarjetaModulo
                    to="/prestamos"
                    icon={Landmark}
                    titulo="Préstamos"
                    valor={String(dashPrestamos.prestamosActivos)}
                    etiqueta={`activos · ${dashPrestamos.prestamosEnMora} en mora`}
                    alerta={dashPrestamos.prestamosEnMora > 0}
                  />
                )}
                {mostrarDomicilios && domicilios && (
                  <TarjetaModulo
                    to="/domicilios"
                    icon={Bike}
                    titulo="Domicilios"
                    valor={String(domicilios.length)}
                    etiqueta="pedidos activos"
                  />
                )}
              </div>
            </Seccion>
          )}

          {/* Análisis por tipo de negocio — cada empresa ve solo las gráficas de lo que
              realmente hace, en vez de un dashboard genérico igual para todos. */}
          {mostrarRestaurante && analiticaRestaurante && (
            <AbrirIndicador.Provider value={()=>setDetalle({tipo:'restaurante',f,nota:'Detalle de comandas. Consumo y venta facturada son conceptos distintos; el tiempo de atención se calcula entre apertura y cierre.'})}><Seccion titulo="Análisis de Restaurante">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Kpi label="Ventas del período" value={money(analiticaRestaurante.ventasTotales)} icon={Wallet} tone="text-success-600" />
                <Kpi label="Ticket promedio" value={money(analiticaRestaurante.ticketPromedio)} icon={ShoppingCart} tone="text-ink-600" />
                <Kpi label="Comandas cerradas" value={String(analiticaRestaurante.numeroComandas)} icon={UtensilsCrossed} tone="text-ink-600" />
                <Kpi
                  label="Tiempo promedio"
                  value={analiticaRestaurante.tiempoPromedioAtencionMinutos != null ? `${Math.round(analiticaRestaurante.tiempoPromedioAtencionMinutos)} min` : '—'}
                  icon={CalendarClock}
                  tone="text-ink-600"
                />
              </div>
              {analiticaRestaurante.ventasPorHora.length > 0 && (
                <div className="mt-4 rounded-xl border border-ink-100 bg-white p-4 shadow-card">
                  <p className="mb-2 text-sm font-semibold text-ink-700">Ventas por hora</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={analiticaRestaurante.ventasPorHora.map((v) => ({ ...v, horaTexto: `${String(v.hora).padStart(2, '0')}:00` }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="horaTexto" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => money(v)} />
                      <Bar dataKey="total" fill="#16a34a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Seccion></AbrirIndicador.Provider>
          )}

          {mostrarServicios && analiticaServicios && (
            <AbrirIndicador.Provider value={label=>setDetalle({tipo:label.includes('Citas')?'citas':'ordenes',f,nota:'Detalle operativo de servicios. Una cita u orden completada no implica pago; consulta la venta vinculada para sus ingresos.'})}><Seccion titulo="Análisis de Servicios">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Kpi label="Ingresos del período" value={money(analiticaServicios.ingresosTotales)} icon={Wallet} tone="text-success-600" />
                <Kpi
                  label="Citas completadas"
                  value={`${analiticaServicios.citasCompletadas} / ${analiticaServicios.citasCompletadas + analiticaServicios.citasCanceladas + analiticaServicios.citasPendientes}`}
                  icon={CalendarClock}
                  tone={analiticaServicios.citasCanceladas === 0 ? 'text-success-600' : 'text-amber-600'}
                />
                <Kpi label="Órdenes entregadas" value={String(analiticaServicios.ordenesEntregadas)} icon={Package} tone="text-ink-600" />
                <Kpi
                  label="Tiempo promedio entrega"
                  value={analiticaServicios.tiempoPromedioEntregaDias != null ? `${analiticaServicios.tiempoPromedioEntregaDias.toFixed(1)} días` : '—'}
                  icon={CalendarClock}
                  tone="text-ink-600"
                />
              </div>
              {analiticaServicios.ingresosPorServicio.length > 0 && (
                <div className="mt-4 rounded-xl border border-ink-100 bg-white p-4 shadow-card">
                  <p className="mb-2 text-sm font-semibold text-ink-700">Ingresos por tipo de servicio</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={analiticaServicios.ingresosPorServicio}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => money(v)} />
                      <Bar dataKey="valor" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Seccion></AbrirIndicador.Provider>
          )}

          {mostrarPrestamos && dashPrestamos && (
            <AbrirIndicador.Provider value={()=>setDetalle({tipo:'prestamos',f,nota:'Los indicadores antiguos de préstamos son históricos y no usan este filtro de fechas. Este detalle muestra contratos por su fecha de inicio; los recaudos se consultan dentro de cada contrato.'})}><Seccion titulo="Análisis de Préstamos">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Kpi label="Capital recuperado" value={money(dashPrestamos.capitalRecuperado)} icon={Wallet} tone="text-success-600" />
                <Kpi label="Intereses generados" value={money(dashPrestamos.interesesGenerados)} icon={TrendingUp} tone="text-success-600" />
                <Kpi
                  label="En mora"
                  value={String(dashPrestamos.clientesEnMora)}
                  icon={AlertTriangle}
                  tone={dashPrestamos.clientesEnMora === 0 ? 'text-success-600' : dashPrestamos.clientesEnMora <= 3 ? 'text-amber-600' : 'text-danger-500'}
                />
                <Kpi label="Tasa de renovación" value={`${dashPrestamos.tasaRenovacion.toFixed(0)}%`} icon={Percent} tone="text-ink-600" />
              </div>
            </Seccion></AbrirIndicador.Provider>
          )}
        </div>
      ) : null}
      <Modal isOpen={!!detalle} onClose={()=>setDetalle(null)} title="Detalle del indicador" size="lg">{detalle&&<div className="space-y-3">{detalle.nota&&<p className="rounded bg-ink-50 p-3 text-sm">{detalle.nota}</p>}<DetalleReporte tipo={detalle.tipo} f={detalle.f}/></div>}</Modal>
    </div></AbrirIndicador.Provider>
  );
}

function TarjetaModulo({
  to,
  icon: Icon,
  titulo,
  valor,
  etiqueta,
  alerta,
}: {
  to: string;
  icon: typeof UtensilsCrossed;
  titulo: string;
  valor: string;
  etiqueta: string;
  alerta?: boolean;
}) {
  return (
    <Link
      to={to}
      className="rounded-xl border border-ink-100 bg-white p-4 shadow-card transition-colors hover:border-ink-200"
    >
      <div className="flex items-center justify-between">
        <span className={`rounded-lg p-1.5 ${alerta ? 'bg-danger-50 text-danger-600' : 'bg-ink-100 text-ink-600'}`}>
          <Icon size={16} />
        </span>
        <span className="text-xs font-medium text-ink-400">{titulo}</span>
      </div>
      <p className="mt-2 font-display text-xl font-bold text-ink-800">{valor}</p>
      <p className="text-xs text-ink-400">{etiqueta}</p>
    </Link>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 font-display text-base font-semibold text-ink-800">{titulo}</h2>
      {children}
    </section>
  );
}

function Kpi({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof TrendingUp;
  tone: string;
}) {
  const abrir=useContext(AbrirIndicador);
  const restringido=value==='Restringido'||value==='null%';
  return (
    <button disabled={restringido} onClick={()=>abrir(label)} className="rounded-xl border border-ink-100 bg-white p-4 shadow-card text-left hover:border-ink-300 disabled:cursor-default">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ink-400">{label}</span>
        <Icon size={16} className={tone} />
      </div>
      <p className="mt-2 font-display text-lg font-semibold text-ink-800">{value==='null%'?'Restringido':value}</p>
      <span className="mt-1 block text-xs text-ink-400">{restringido?'Sin permiso de costos':'Ver detalle'}</span>
    </button>
  );
}

function GraficoBarras({
  titulo,
  datos,
  formatoMoneda,
}: {
  titulo: string;
  datos: { nombre: string; valor: number }[];
  formatoMoneda?: boolean;
}) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
      <p className="mb-2 text-xs font-medium text-ink-500">{titulo}</p>
      {datos.length === 0 ? (
        <p className="py-8 text-center text-xs text-ink-300">Sin datos en este período</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={datos} layout="vertical" margin={{ left: 8, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="nombre" width={100} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(valor) => (formatoMoneda ? money(Number(valor)) : valor)} />
            <Bar dataKey="valor" fill="#0f172a" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function GraficoTorta({ titulo, datos }: { titulo: string; datos: { nombre: string; valor: number }[] }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
      <p className="mb-2 text-xs font-medium text-ink-500">{titulo}</p>
      {datos.length === 0 ? (
        <p className="py-8 text-center text-xs text-ink-300">Sin datos en este período</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={datos} dataKey="valor" nameKey="nombre" outerRadius={80}>
              {datos.map((_, i) => (
                <Cell key={i} fill={COLORES[i % COLORES.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(valor) => money(Number(valor))} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
