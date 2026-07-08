import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { puedeVerRuta } from '@/lib/permisos';

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const esSuperadmin = useAuthStore((state) => state.esSuperadmin);
  const permisos = useAuthStore((state) => state.permisos);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const rutaActual = '/' + location.pathname.split('/')[1];
  if (!esSuperadmin && !puedeVerRuta(permisos, rutaActual)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
