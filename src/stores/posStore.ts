import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PosState {
  sucursalId: number | null;
  setSucursalId: (id: number) => void;
  reset: () => void;
}

export const usePosStore = create<PosState>()(
  persist(
    (set) => ({
      sucursalId: null,
      setSucursalId: (id) => set({ sucursalId: id }),
      reset: () => set({ sucursalId: null }),
    }),
    { name: 'rms-pos' }
  )
);
