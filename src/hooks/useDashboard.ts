import { useQuery } from '@tanstack/react-query';
import { obtenerDashboard } from '@/api/dashboard';

export function useDashboard(desde: string, hasta: string, sucursalId?: number | null) {
  return useQuery({
    queryKey: ['dashboard', desde, hasta, sucursalId],
    queryFn: () => obtenerDashboard(desde, hasta, sucursalId),
    refetchInterval: 60_000, // se actualiza solo cada minuto mientras la pantalla esté abierta
  });
}
