import { apiClient } from '@/api/client';
import type { BackupInfo, ConfiguracionBackup, ConfiguracionBackupRequest } from '@/types/backup';

export const listarBackups = async (): Promise<BackupInfo[]> =>
  (await apiClient.get<BackupInfo[]>('/plataforma/backups')).data;

export const crearBackup = async (): Promise<BackupInfo> =>
  (await apiClient.post<BackupInfo>('/plataforma/backups')).data;

export const eliminarBackup = async (id: number): Promise<void> => {
  await apiClient.delete(`/plataforma/backups/${id}`);
};

export const obtenerConfiguracionBackup = async (): Promise<ConfiguracionBackup> =>
  (await apiClient.get<ConfiguracionBackup>('/plataforma/backups/configuracion')).data;

export const actualizarConfiguracionBackup = async (data: ConfiguracionBackupRequest): Promise<ConfiguracionBackup> =>
  (await apiClient.put<ConfiguracionBackup>('/plataforma/backups/configuracion', data)).data;
