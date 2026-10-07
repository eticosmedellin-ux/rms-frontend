import {lazy,Suspense} from 'react';
const AppFacturacion=lazy(()=>import('@/features/sicom/AppFacturacion'));
const PerfilesLogin=lazy(()=>import('@/features/sicom/PerfilesLogin'));
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
const LoginPage=lazy(()=>import('@/pages/LoginPage'));
const RegistroEmpresaPage=lazy(()=>import('@/pages/RegistroEmpresaPage'));
const OlvidePasswordPage=lazy(()=>import('@/pages/OlvidePasswordPage'));
const RestablecerPasswordPage=lazy(()=>import('@/pages/RestablecerPasswordPage'));
const MenuPublicoPage=lazy(()=>import('@/pages/MenuPublicoPage'));
const DashboardPage=lazy(()=>import('@/pages/DashboardPage'));
const NotFoundPage=lazy(()=>import('@/pages/NotFoundPage'));
const InventarioPage=lazy(()=>import('@/pages/inventario/InventarioPage'));
const ComprasPage=lazy(()=>import('@/pages/compras/ComprasPage'));
const PosPage=lazy(()=>import('@/pages/pos/PosPage'));
const GastosPage=lazy(()=>import('@/pages/gastos/GastosPage'));
const ReportesPage=lazy(()=>import('@/pages/reportes/ReportesPage'));
const AlertasPage=lazy(()=>import('@/pages/alertas/AlertasPage'));
const ConfiguracionPage=lazy(()=>import('@/pages/configuracion/ConfiguracionPage'));
const AdministracionPage=lazy(()=>import('@/pages/administracion/AdministracionPage'));
const PlataformaPage=lazy(()=>import('@/pages/plataforma/PlataformaPage'));
const DescuentosPage=lazy(()=>import('@/pages/descuentos/DescuentosPage'));
const DocumentosPage=lazy(()=>import('@/pages/documentos/DocumentosPage'));
const ContabilidadPage=lazy(()=>import('@/pages/contabilidad/ContabilidadPage'));
const MisClientesContablesPage=lazy(()=>import('@/pages/contabilidad/MisClientesContablesPage'));
const NominaPage=lazy(()=>import('@/pages/nomina/NominaPage'));
const RestaurantePage=lazy(()=>import('@/pages/restaurante/RestaurantePage'));
const ServiciosPage=lazy(()=>import('@/pages/servicios/ServiciosPage'));
const PrestamosPage=lazy(()=>import('@/pages/prestamos/PrestamosPage'));
const DomiciliosPage=lazy(()=>import('@/pages/domicilios/DomiciliosPage'));
const AppMeseroPage=lazy(()=>import('@/pages/restaurante/AppMeseroPage'));
const AppCocinaPage=lazy(()=>import('@/pages/restaurante/AppCocinaPage'));

export default function App() {
  return (
    <Suspense fallback={<p className="p-6">Cargando módulo…</p>}><Routes>
      <Route path="/empresa/:acceso" element={<PerfilesLogin />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegistroEmpresaPage />} />
      <Route path="/olvide-password" element={<OlvidePasswordPage />} />
      <Route path="/restablecer" element={<RestablecerPasswordPage />} />
      <Route path="/menu" element={<MenuPublicoPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/inventario" element={<InventarioPage />} />
          <Route path="/compras" element={<ComprasPage />} />
          <Route path="/pos" element={<PosPage />} />
          <Route path="/descuentos" element={<DescuentosPage />} />
          <Route path="/documentos" element={<DocumentosPage />} />
          <Route path="/contabilidad" element={<ContabilidadPage />} />
          <Route path="/mis-clientes-contables" element={<MisClientesContablesPage />} />
          <Route path="/nomina" element={<NominaPage />} />
          <Route path="/restaurante" element={<RestaurantePage />} />
          <Route path="/servicios" element={<ServiciosPage />} />
          <Route path="/prestamos" element={<PrestamosPage />} />
          <Route path="/domicilios" element={<DomiciliosPage />} />
          <Route path="/gastos" element={<GastosPage />} />
          <Route path="/reportes" element={<ReportesPage />} />
          <Route path="/alertas" element={<AlertasPage />} />
          <Route path="/administracion" element={<AdministracionPage />} />
          <Route path="/configuracion" element={<ConfiguracionPage />} />
          <Route path="/plataforma" element={<PlataformaPage />} />
        </Route>

        {/* Apps simplificadas de pantalla completa — protegidas por sesión, pero SIN el
            layout administrativo (sidebar/topbar), para dejar montadas en la tablet de
            cocina o en el celular del mesero. */}
        <Route path="/app/facturacion" element={<AppFacturacion />} />
        <Route path="/app/mesero" element={<AppMeseroPage />} />
        <Route path="/app/cocina" element={<AppCocinaPage />} />
      </Route>

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes></Suspense>
  );
}
