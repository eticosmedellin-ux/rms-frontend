import {useMiPlan} from '@/hooks/usePlataforma';
import {useSicom} from '@/features/sicom/api';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { puedeVerRuta, incluidaEnPlan, incluidaEnPlanDirecta } from '@/lib/permisos';

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const esSuperadmin = useAuthStore((state) => state.esSuperadmin);
  const permisos = useAuthStore((state) => state.permisos);
  const location = useLocation();
  const {data:plan}=useMiPlan();
  const {data:cfg,isLoading,isError}=useSicom();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if(isLoading)return <p className="p-6">Verificando acceso…</p>;
  if(isError)return <p className="p-6">No se pudo verificar el acceso. Recarga la página.</p>;
  if(cfg?.facturador && location.pathname!=='/app/facturacion')return <Navigate to="/app/facturacion" replace/>;
  if (location.pathname.startsWith('/mis-clientes-contables') && !useAuthStore.getState().accesoClientesContables) return <Navigate to="/" replace />;
  const rutaActual = '/' + location.pathname.split('/')[1];
  if (!esSuperadmin && !puedeVerRuta(permisos, rutaActual)) {
    return <Navigate to="/" replace />;
  }

  if (!esSuperadmin && plan?.estadoLicencia==='ACTIVA') {
    const rutaPlan=['/app/mesero','/app/cocina'].includes(location.pathname)?'/restaurante':rutaActual;
    const rutas=plan.rutasHabilitadas;
    const permitido=rutaPlan==='/servicios'
      ? incluidaEnPlanDirecta(rutas,'servicios-citas')||incluidaEnPlanDirecta(rutas,'servicios-ordenes')
      : incluidaEnPlan(rutas,rutaPlan);
    if(!permitido)return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
