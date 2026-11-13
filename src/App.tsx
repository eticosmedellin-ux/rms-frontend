import {lazy,Suspense} from 'react';
const EntradaEmpresa=lazy(()=>import('@/pages/plataforma/EntradaEmpresa'));
const AppFacturacion=lazy(()=>import('@/features/sicom/AppFacturacion'));
const LoginGeneralPage=lazy(()=>import('@/pages/LoginGeneralPage'));
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
const TiendaAplicaciones=lazy(()=>import('@/features/aplicaciones/TiendaAplicaciones'));
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

const modulos=[{path:"/dashboard",element:<DashboardPage/>},{path:"/inventario",element:<InventarioPage/>},{path:"/compras",element:<ComprasPage/>},{path:"/pos",element:<PosPage/>},{path:"/descuentos",element:<DescuentosPage/>},{path:"/documentos",element:<DocumentosPage/>},{path:"/contabilidad",element:<ContabilidadPage/>},{path:"/mis-clientes-contables",element:<MisClientesContablesPage/>},{path:"/nomina",element:<NominaPage/>},{path:"/restaurante",element:<RestaurantePage/>},{path:"/servicios",element:<ServiciosPage/>},{path:"/prestamos",element:<PrestamosPage/>},{path:"/domicilios",element:<DomiciliosPage/>},{path:"/gastos",element:<GastosPage/>},{path:"/reportes",element:<ReportesPage/>},{path:"/alertas",element:<AlertasPage/>},{path:"/administracion",element:<AdministracionPage/>},{path:"/aplicaciones",element:<TiendaAplicaciones/>},{path:"/configuracion",element:<ConfiguracionPage/>},{path:"/plataforma",element:<PlataformaPage/>}];

export default function App() {
  return (
    <Suspense fallback={<p className="p-6">Cargando módulo…</p>}><Routes>
      <Route path="/entrada-empresa" element={<EntradaEmpresa />} />
      <Route path="/empresa/:acceso" element={<PerfilesLogin />} />
      <Route path="/login" element={<LoginPage />} /><Route path="/acceso-general" element={<LoginGeneralPage />} />
      <Route path="/registro" element={<RegistroEmpresaPage />} />
      <Route path="/olvide-password" element={<OlvidePasswordPage />} />
      <Route path="/restablecer" element={<RestablecerPasswordPage />} />
      <Route path="/menu" element={<MenuPublicoPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout modulos={modulos} />}><Route path="/" element={null}/><Route path="/dashboard" element={null}/><Route path="/inventario" element={null}/><Route path="/compras" element={null}/><Route path="/pos" element={null}/><Route path="/descuentos" element={null}/><Route path="/documentos" element={null}/><Route path="/contabilidad" element={null}/><Route path="/mis-clientes-contables" element={null}/><Route path="/nomina" element={null}/><Route path="/restaurante" element={null}/><Route path="/servicios" element={null}/><Route path="/prestamos" element={null}/><Route path="/domicilios" element={null}/><Route path="/gastos" element={null}/><Route path="/reportes" element={null}/><Route path="/alertas" element={null}/><Route path="/administracion" element={null}/><Route path="/aplicaciones" element={null}/><Route path="/configuracion" element={null}/><Route path="/plataforma" element={null}/>
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
