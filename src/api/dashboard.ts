import { apiClient } from '@/api/client';
import type { DashboardResponse } from '@/types/dashboard';

export const obtenerDashboard = async (
  desde: string,
  hasta: string,
  sucursalId?: number | null
): Promise<DashboardResponse> =>
  (
    await apiClient.get<DashboardResponse>('/dashboard', {
      params: { desde, hasta, sucursalId: sucursalId ?? undefined },
    })
  ).data;
