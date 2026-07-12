import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as backupApi from '@/api/backup';
import type { ConfiguracionBackupRequest } from '@/types/backup';

export function useBackups() {
  return useQuery({ queryKey: ['backups'], queryFn: backupApi.listarBackups });
}

export function useCrearBackup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: backupApi.crearBackup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['backups'] }),
  });
}

export function useEliminarBackup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => backupApi.eliminarBackup(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['backups'] }),
  });
}

export function useConfiguracionBackup() {
  return useQuery({ queryKey: ['configuracion-backup'], queryFn: backupApi.obtenerConfiguracionBackup });
}

export function useActualizarConfiguracionBackup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ConfiguracionBackupRequest) => backupApi.actualizarConfiguracionBackup(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['configuracion-backup'] }),
  });
}
