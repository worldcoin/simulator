import { create } from "zustand";

export type CacheStore = {
  complete: boolean;
  setComplete: (complete: boolean) => void;
};

export const useCacheStore = create<CacheStore>((set) => ({
  complete: false,
  setComplete: (complete) => set(() => ({ complete })),
}));
