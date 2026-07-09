import { apiClient } from '@/api/client';

export const solicitarRecuperacion = async (email: string): Promise<void> => {
  await apiClient.post('/auth/olvide-password', { email });
};

export const restablecerPassword = async (token: string, nuevaPassword: string): Promise<void> => {
  await apiClient.post('/auth/restablecer-password', { token, nuevaPassword });
};
