import { apiClient } from '@/api/client';

export interface CatalogoPlan {
  id: number;
  tipoNegocioId: number | null;
  tipoNegocioNombre: string;
  nivel: 'BASICO' | 'PROFESIONAL' | 'EMPRESARIAL';
  nombre: string;
  precioMensual: number;
  maxUsuarios: number | null;
  maxSucursales: number | null;
  rutasHabilitadas: string[];
  activo: boolean;
}

export const listarCatalogoPlanesPublico = async (): Promise<CatalogoPlan[]> =>
  (await apiClient.get<CatalogoPlan[]>('/catalogo-planes/publico')).data;
