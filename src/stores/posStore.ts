import {createJSONStorage} from 'zustand/middleware';
import {almacenamientoPestana} from './pestanaEmpresa';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PosState {
  sucursalId: number | null;
  cajaFisicaId: number | null;
  setCajaFisicaId: (id: number | null) => void;
  setSucursalId: (id: number | null) => void;
  reset: () => void;
}

export const usePosStore = create<PosState>()(
  persist(
    (set) => ({
      sucursalId: null,
      cajaFisicaId: null,
      setCajaFisicaId: (id) => set({ cajaFisicaId: id }),
      setSucursalId: (id) => set(s => s.sucursalId === id ? s : { sucursalId: id, cajaFisicaId: null }),
      reset: () => set({ sucursalId: null, cajaFisicaId: null }),
    }),
    { name: 'rms-pos', storage: createJSONStorage(almacenamientoPestana) }
  )
);
