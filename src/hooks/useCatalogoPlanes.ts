import { useQuery } from '@tanstack/react-query';
import { listarCatalogoPlanesPublico } from '@/api/catalogoPlanes';

export function useCatalogoPlanesPublico() {
  return useQuery({ queryKey: ['catalogo-planes-publico'], queryFn: listarCatalogoPlanesPublico });
}
