import type { Identity } from "@/types/identity";
import { create } from "zustand";

export type IIdentityStore = {
  identity: Identity | null;
  setIdentity: (identity: Identity | null) => void;
};

export const useIdentityStore = create<IIdentityStore>((set) => ({
  identity: null,
  setIdentity: (identity) => set(() => ({ identity })),
}));
