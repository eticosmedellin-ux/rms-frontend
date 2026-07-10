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
};

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
};

export function incluidaEnPlan(rutasHabilitadas: string[] | undefined, ruta: string): boolean {
  const rutaPlan = RUTA_A_PLAN[ruta];
  if (!rutaPlan || !rutasHabilitadas) return true; // sin esa página en el catálogo, o plan aún sin cargar: no bloquear
  return rutasHabilitadas.includes(rutaPlan);
}
