import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PosState {
  sucursalId: number | null;
  setSucursalId: (id: number) => void;
}

export const usePosStore = create<PosState>()(
  persist(
    (set) => ({
      sucursalId: null,
      setSucursalId: (id) => set({ sucursalId: id }),
    }),
    { name: 'rms-pos' }
  )
);
