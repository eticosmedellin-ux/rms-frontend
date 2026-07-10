import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import LoginPage from '@/pages/LoginPage';
import RegistroEmpresaPage from '@/pages/RegistroEmpresaPage';
import OlvidePasswordPage from '@/pages/OlvidePasswordPage';
import RestablecerPasswordPage from '@/pages/RestablecerPasswordPage';
import DashboardPage from '@/pages/DashboardPage';
import NotFoundPage from '@/pages/NotFoundPage';
import InventarioPage from '@/pages/inventario/InventarioPage';
import ComprasPage from '@/pages/compras/ComprasPage';
import PosPage from '@/pages/pos/PosPage';
import GastosPage from '@/pages/gastos/GastosPage';
import ReportesPage from '@/pages/reportes/ReportesPage';
import AlertasPage from '@/pages/alertas/AlertasPage';
import ConfiguracionPage from '@/pages/configuracion/ConfiguracionPage';
import AdministracionPage from '@/pages/administracion/AdministracionPage';
import PlataformaPage from '@/pages/plataforma/PlataformaPage';
import DescuentosPage from '@/pages/descuentos/DescuentosPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegistroEmpresaPage />} />
      <Route path="/olvide-password" element={<OlvidePasswordPage />} />
      <Route path="/restablecer" element={<RestablecerPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/inventario" element={<InventarioPage />} />
          <Route path="/compras" element={<ComprasPage />} />
          <Route path="/pos" element={<PosPage />} />
          <Route path="/descuentos" element={<DescuentosPage />} />
          <Route path="/gastos" element={<GastosPage />} />
          <Route path="/reportes" element={<ReportesPage />} />
          <Route path="/alertas" element={<AlertasPage />} />
          <Route path="/administracion" element={<AdministracionPage />} />
          <Route path="/configuracion" element={<ConfiguracionPage />} />
          <Route path="/plataforma" element={<PlataformaPage />} />
        </Route>
      </Route>

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
