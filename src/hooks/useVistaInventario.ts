import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { useAuthStore } from '@/stores/authStore';

type Vista = { consolidada: boolean };
const url = '/inventario/vista-sucursales';

export function useVistaInventario() {
  const empresaId = useAuthStore(s => s.empresaId);
  const admin = useAuthStore(s => s.esAdministradorTotal || s.esSuperadmin);
  const cliente = useQueryClient();
  const queryKey = ['vista-inventario-sucursales', empresaId];
  const vista = useQuery({ queryKey, enabled: admin, queryFn: async () => (await apiClient.get<Vista>(url)).data });
  const guardar = useMutation({
    mutationFn: async (consolidada: boolean) => (await apiClient.put<Vista>(url, { consolidada })).data,
    onSuccess: data => cliente.setQueryData(queryKey, data),
  });
  return { vista, guardar, admin };
}
