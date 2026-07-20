/** Mapea cada ítem de navegación al módulo de permisos que lo protege en el backend.
 *  Debe reflejar exactamente RUTA_A_MODULO de ModuloAuthorizationFilter.java. */
export const RUTA_A_MODULO: Record<string, string> = {
  '/inventario': 'INVENTARIO',
  '/compras': 'COMPRAS',
  '/pos': 'VENTAS', // el POS usa endpoints de ventas, caja y clientes; VENTAS es el más representativo
  '/documentos': 'VENTAS',
  '/descuentos': 'DESCUENTOS',
  '/gastos': 'GASTOS',
  '/reportes': 'REPORTES',
  '/alertas': 'ALERTAS',
  '/administracion': 'USUARIOS',
  '/configuracion': 'CONFIGURACION',
  '/contabilidad': 'CONTABILIDAD',
  '/nomina': 'NOMINA',
  '/restaurante': 'RESTAURANTE',
  '/prestamos': 'PRESTAMOS',
  '/domicilios': 'DOMICILIOS',
};

/** "Servicios" en realidad son dos cosas independientes que un negocio puede tener una
 *  sin la otra: Citas (barbería, spa, consultorios) y Órdenes de trabajo/Casos (talleres,
 *  abogados, contadores) — antes compartían un solo módulo, lo que hacía que CUALQUIER
 *  plan con Servicios viera TODO, incluidos los casos legales de Abogados aunque el
 *  negocio fuera una barbería. Debe reflejar exactamente segmentoEfectivo() de
 *  ModuloAuthorizationFilter.java. */
export const MODULO_SERVICIOS_CITAS = 'SERVICIOS_CITAS';
export const MODULO_SERVICIOS_ORDENES = 'SERVICIOS_ORDENES';
export const PLAN_SERVICIOS_CITAS = 'servicios-citas';
export const PLAN_SERVICIOS_ORDENES = 'servicios-ordenes';

export function puedeVerServiciosCitas(permisos: string[], rutasHabilitadas: string[] | undefined): boolean {
  return puedeVerModulo(permisos, MODULO_SERVICIOS_CITAS) && incluidaEnPlanDirecta(rutasHabilitadas, PLAN_SERVICIOS_CITAS);
}

export function puedeVerServiciosOrdenes(permisos: string[], rutasHabilitadas: string[] | undefined): boolean {
  return puedeVerModulo(permisos, MODULO_SERVICIOS_ORDENES) && incluidaEnPlanDirecta(rutasHabilitadas, PLAN_SERVICIOS_ORDENES);
}

export function incluidaEnPlanDirecta(rutasHabilitadas: string[] | undefined, rutaPlan: string): boolean {
  if (!rutasHabilitadas) return true;
  return rutasHabilitadas.includes(rutaPlan);
}

export function moduloDePermiso(codigoPermiso: string): string {
  return codigoPermiso.split('_')[0];
}

export function puedeVerModulo(permisos: string[], modulo: string): boolean {
  return permisos.some((p) => moduloDePermiso(p) === modulo);
}

export function puedeVerRuta(permisos: string[], ruta: string): boolean {
  const modulo = RUTA_A_MODULO[ruta];
  if (!modulo) return true;
  return puedeVerModulo(permisos, modulo);
}

/** Aproximación de qué ítem del catálogo de planes representa mejor cada página del menú —
 *  el enforcement real y preciso vive en el backend (ModuloAuthorizationFilter); esto solo
 *  evita mostrar en el menú una página cuyo plan claramente no la incluye. */
export const RUTA_A_PLAN: Record<string, string> = {
  '/pos': 'ventas',
  '/descuentos': 'tipos-descuento',
  '/inventario': 'productos',
  '/compras': 'proveedores',
  '/gastos': 'gastos',
  '/reportes': 'reportes',
  '/alertas': 'alertas',
  '/administracion': 'usuarios',
  '/contabilidad': 'contabilidad',
  '/nomina': 'nomina',
  '/restaurante': 'restaurante',
  '/prestamos': 'prestamos',
  '/domicilios': 'domicilios',
};

export function incluidaEnPlan(rutasHabilitadas: string[] | undefined, ruta: string): boolean {
  const rutaPlan = RUTA_A_PLAN[ruta];
  if (!rutaPlan || !rutasHabilitadas) return true; // sin esa página en el catálogo, o plan aún sin cargar: no bloquear
  return rutasHabilitadas.includes(rutaPlan);
}

// Inverso de RUTA_A_MODULO — dado el módulo de un permiso (ej. "RESTAURANTE"), encuentra
// una ruta representativa para poder consultar si el plan de la empresa la incluye.
const MODULO_A_RUTA: Record<string, string> = Object.fromEntries(
  Object.entries(RUTA_A_MODULO).map(([ruta, modulo]) => [modulo, ruta])
);

/** Al crear/editar un rol, un usuario no debería poder asignar permisos de un módulo que
 *  el plan de su empresa ni siquiera tiene habilitado — evita configurar algo que después
 *  el sistema va a bloquear igual. Los módulos "core" (sin ruta gestionada por planes,
 *  como CAJA o CLIENTES) siempre se muestran. */
export function permisoIncluidoEnPlan(rutasHabilitadas: string[] | undefined, moduloPermiso: string): boolean {
  if (moduloPermiso === MODULO_SERVICIOS_CITAS) return incluidaEnPlanDirecta(rutasHabilitadas, PLAN_SERVICIOS_CITAS);
  if (moduloPermiso === MODULO_SERVICIOS_ORDENES) return incluidaEnPlanDirecta(rutasHabilitadas, PLAN_SERVICIOS_ORDENES);
  const ruta = MODULO_A_RUTA[moduloPermiso];
  if (!ruta) return true;
  return incluidaEnPlan(rutasHabilitadas, ruta);
}
