import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LoginResponse } from '@/types/auth';
import { usePosStore } from '@/stores/posStore';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  usuarioId: number | null;
  username: string | null;
  nombreCompleto: string | null;
  empresaId: number | null;
  nombreEmpresa: string | null;
  roles: string[];
  permisos: string[];
  esSuperadmin: boolean;
  esAdministradorTotal: boolean;
  isAuthenticated: boolean;
  setSession: (data: LoginResponse) => void;
  updateAccessToken: (accessToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      usuarioId: null,
      username: null,
      nombreCompleto: null,
      empresaId: null,
      nombreEmpresa: null,
      roles: [],
      permisos: [],
      esSuperadmin: false,
      esAdministradorTotal: false,
      isAuthenticated: false,

      setSession: (data) =>
        set({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          usuarioId: data.usuarioId,
          username: data.username,
          nombreCompleto: data.nombreCompleto,
          empresaId: data.empresaId,
          nombreEmpresa: data.nombreEmpresa,
          roles: data.roles,
          permisos: data.permisos,
          esSuperadmin: data.esSuperadmin,
          esAdministradorTotal: data.esAdministradorTotal,
          isAuthenticated: true,
        }),

      updateAccessToken: (accessToken) => set({ accessToken }),

      logout: () => {
        usePosStore.getState().reset();
        set({
          accessToken: null,
          refreshToken: null,
          usuarioId: null,
          username: null,
          nombreCompleto: null,
          empresaId: null,
          nombreEmpresa: null,
          roles: [],
          permisos: [],
          esSuperadmin: false,
          esAdministradorTotal: false,
          isAuthenticated: false,
        });
      },
    }),
    { name: 'rms-auth' }
  )
);
