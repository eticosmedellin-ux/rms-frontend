export interface BackupInfo {
  id: number;
  nombreArchivo: string;
  tamanoBytes: number;
  tipo: 'MANUAL' | 'AUTOMATICO';
  estado: 'COMPLETADO' | 'ERROR';
  mensaje: string | null;
  fechaCreacion: string;
}

export type FrecuenciaBackup = 'MANUAL' | 'DIARIA' | 'SEMANAL' | 'MENSUAL';

export interface ConfiguracionBackup {
  frecuencia: FrecuenciaBackup;
  horaEjecucion: number;
  ultimaEjecucionAutomatica: string | null;
}

export interface ConfiguracionBackupRequest {
  frecuencia: FrecuenciaBackup;
  horaEjecucion: number;
}
