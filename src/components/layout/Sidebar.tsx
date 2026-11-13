import {useMenuAplicaciones} from '@/features/aplicaciones/api';
import {LogoAplicacion} from '@/features/aplicaciones/iconos';




import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Store,
  Receipt,
  BarChart3,
  Settings,
  Bell,
  Users,
  ShieldAlert,
  Tag,
  FileStack,
  Calculator,
  Users2,
  UtensilsCrossed,
  CalendarClock,
  Landmark,
  Bike,

  Briefcase,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { puedeVerRuta, incluidaEnPlan, puedeVerServiciosCitas, puedeVerServiciosOrdenes, incluidaEnPlanDirecta } from '@/lib/permisos';
import { useMiPlan } from '@/hooks/usePlataforma';

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; end?: boolean; fichaIcono?:string };

const NAV_GROUPS_DEF: { titulo: string | null; items: NavItem[] }[] = [
  {
    titulo: null,
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    titulo: 'Ventas',
    items: [
      { to: '/pos', label: 'Punto de venta', icon: Store },
      { to: '/documentos', label: 'Documentos', icon: FileStack },
      { to: '/descuentos', label: 'Descuentos', icon: Tag },
    ],
  },
  {
    titulo: 'Operación',
    items: [
      { to: '/inventario', label: 'Inventario', icon: Package },
      { to: '/compras', label: 'Compras', icon: ShoppingCart },
      { to: '/gastos', label: 'Gastos', icon: Receipt },
      { to: '/restaurante', label: 'Restaurante', icon: UtensilsCrossed },
      { to: '/servicios', label: 'Servicios', icon: CalendarClock },
      { to: '/prestamos', label: 'Préstamos', icon: Landmark },
      { to: '/domicilios', label: 'Domicilios', icon: Bike },
    ],
  },
  {
    titulo: 'Análisis',
    items: [
      { to: '/reportes', label: 'Reportes', icon: BarChart3 },
      { to: '/alertas', label: 'Alertas', icon: Bell },
      { to: '/contabilidad', label: 'Contabilidad', icon: Calculator },
      { to: '/mis-clientes-contables', label: 'Mis clientes contables', icon: Briefcase },
      { to: '/nomina', label: 'Nómina', icon: Users2 },
    ],
  },
  {
    titulo: 'Sistema',
    items: [
      { to: '/administracion', label: 'Administración', icon: Users },
      { to: '/configuracion', label: 'Configuración', icon: Settings },
      { to: '/aplicaciones', label: 'Tienda de aplicaciones', icon: Package },
    ],
  },
];

export function useModulosInicio(){
  const esSuperadmin = useAuthStore((state) => state.esSuperadmin);
  const esAdministradorTotal = useAuthStore((state) => state.esAdministradorTotal);
  const permisos = useAuthStore((state) => state.permisos);
  const { data: fichas } = useMenuAplicaciones();
  const { data: miPlan } = useMiPlan();

  const gruposVisibles = NAV_GROUPS_DEF.map((grupo) => ({
    ...grupo,
    items: grupo.items.filter((item) => {
      if (item.to === "/aplicaciones") return esAdministradorTotal && !esSuperadmin;
      if (item.to === "/mis-clientes-contables") return useAuthStore.getState().accesoClientesContables === true;
      if (esSuperadmin) return true;
      if (!miPlan) return false;
      // "Servicios" son dos módulos independientes (Citas y Órdenes de trabajo/Casos) —
      // el enlace se muestra si tiene al menos uno de los dos habilitados en su plan,
      // y (salvo que sea administrador total) el permiso de rol correspondiente.
      if (item.to === '/servicios') {
        const enPlan =
          incluidaEnPlanDirecta(miPlan?.rutasHabilitadas, 'servicios-citas') ||
          incluidaEnPlanDirecta(miPlan?.rutasHabilitadas, 'servicios-ordenes');
        const tienePermisoServicios =
          esAdministradorTotal || puedeVerServiciosCitas(permisos, miPlan?.rutasHabilitadas) || puedeVerServiciosOrdenes(permisos, miPlan?.rutasHabilitadas);
        return enPlan && tienePermisoServicios;
      }
      // El administrador general de la empresa siempre ve todo lo que el PLAN permite,
      // sin depender de si el permiso puntual quedó bien sincronizado en su rol.
      const tienePermiso = esAdministradorTotal || puedeVerRuta(permisos, item.to);
      return tienePermiso && incluidaEnPlan(miPlan?.rutasHabilitadas, item.to);
    }).flatMap(item=>{
      if(item.to==='/servicios'&&(fichas?.['/servicios?tab=citas']||fichas?.['/servicios?tab=ordenes'])){
        const servicios=[
          {to:'/servicios?tab=citas',label:'Citas',visible:esSuperadmin||puedeVerServiciosCitas(permisos,miPlan?.rutasHabilitadas)||
            esAdministradorTotal&&incluidaEnPlanDirecta(miPlan?.rutasHabilitadas,'servicios-citas')},
          {to:'/servicios?tab=ordenes',label:'Órdenes de trabajo',visible:esSuperadmin||puedeVerServiciosOrdenes(permisos,miPlan?.rutasHabilitadas)||
            esAdministradorTotal&&incluidaEnPlanDirecta(miPlan?.rutasHabilitadas,'servicios-ordenes')},
        ];
        return servicios.filter(s=>s.visible).map(s=>({...item,to:s.to,label:fichas?.[s.to]?.nombre??s.label,fichaIcono:fichas?.[s.to]?.icono}));
      }
      return [item];
    }).map(item=>{
      const ficha=item.to==='/'?(fichas?.['/dashboard']??fichas?.['/']):fichas?.[item.to];
      return ficha?{...item,label:ficha.nombre||item.label,fichaIcono:ficha.icono}:item;
    }),
  })).filter((grupo) => grupo.items.length > 0);

  return [...gruposVisibles.flatMap(g=>g.items).map(i=>i.to==='/'?{...i,to:'/dashboard'}:i),
   ...(esSuperadmin?[{to:'/plataforma',label:'Plataforma',icon:ShieldAlert}]:[])];
}

export function InicioModulos({modulos,abrir}:{modulos:ReturnType<typeof useModulosInicio>;abrir:(ruta:string,nueva:boolean)=>void}){
 return <section className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
  <h1 className="mb-2 text-3xl font-bold text-ink-900 dark:text-white">Inicio</h1>
  <p className="mb-8 text-sm text-ink-600 dark:text-ink-300">Selecciona una aplicación. Usa el botón + para abrir otra copia.</p>
  <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
   {modulos.map(({to,label,icon,fichaIcono})=><li key={to} className="relative rounded-2xl border border-ink-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-ink-800">
    <button type="button" onClick={()=>abrir(to,false)} className="flex min-h-28 w-full flex-col items-center justify-center gap-3 rounded-2xl px-2 py-4 text-center text-sm font-semibold text-ink-800 focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-white">
     <span className="rounded-2xl bg-emerald-50 p-3 text-emerald-800"><LogoAplicacion codigo={fichaIcono} alternativo={icon} size={27}/></span>{label}
    </button>
    <button type="button" onClick={()=>abrir(to,true)} aria-label={`Abrir otra pestaña de ${label}`} className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full border border-ink-100 bg-white font-semibold text-ink-700 hover:bg-emerald-50">+</button>
   </li>)}
  </ul>
 </section>;
}
