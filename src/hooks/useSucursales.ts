import { useQuery } from '@tanstack/react-query';
import { listarSucursales } from '@/api/sucursales';

export function useSucursales() {
  return useQuery({
    queryKey: ['sucursales'],
    queryFn: listarSucursales,
    staleTime: 5 * 60 * 1000, // las sucursales casi no cambian, cache de 5 min
  });
}
