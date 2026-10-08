import {useSicom} from '@/features/sicom/api';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { puedeVerRuta } from '@/lib/permisos';

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const esSuperadmin = useAuthStore((state) => state.esSuperadmin);
  const permisos = useAuthStore((state) => state.permisos);
  const location = useLocation();
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

  return <Outlet />;
}
