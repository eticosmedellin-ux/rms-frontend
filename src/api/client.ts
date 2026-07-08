import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';
import type { LoginResponse } from '@/types/auth';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Adjunta el access token vigente a cada petición saliente.
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const { refreshToken, updateAccessToken, logout } = useAuthStore.getState();
  if (!refreshToken) {
    logout();
    throw new Error('No hay refresh token disponible');
  }

  const response = await axios.post<LoginResponse>(
    `${import.meta.env.VITE_API_BASE_URL ?? '/api'}/auth/refresh`,
    { refreshToken }
  );
  updateAccessToken(response.data.accessToken);
  return response.data.accessToken;
}

// Si una petición responde 401, intenta refrescar el token UNA sola vez y reintenta.
// Si el refresh también falla, cierra la sesión (el ProtectedRoute redirige al login).
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
        const newToken = await refreshPromise;
        originalRequest.headers.set('Authorization', `Bearer ${newToken}`);
        return apiClient(originalRequest);
      } catch {
        useAuthStore.getState().logout();
      }
    }

    return Promise.reject(error);
  }
);
