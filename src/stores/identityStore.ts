import type { Identity } from "@/types/identity";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type IdentityStore = {
  activeIdentityID: string | null;
  identities: Identity[];
  setActiveIdentityID: (id: string) => void;
  insertIdentity: (identity: Identity) => void;
  replaceIdentity: (identity: Identity) => void;
  reset: () => void;
};

const IDENTITY_STORE_STORAGE_KEY = "Simulator_Identity_Store_2";

export const useIdentityStore = create<IdentityStore>()(
  persist(
    (set, get) => ({
      activeIdentityID: null,
      identities: [],
      setActiveIdentityID: (id) => set({ activeIdentityID: id }),
      insertIdentity: (identity) =>
        set((state) => ({
          identities: [identity, ...state.identities],
        })),
      replaceIdentity: (identity) =>
        set((state) => ({
          identities: state.identities.map((i) => {
            if (i.id === identity.id) {
              return identity;
            }
            return i;
          }),
        })),
      reset: () =>
        set(() => ({
          identities: [],
          activeIdentity: null,
          activeIdentityID: null,
          lastIdentityNonce: 0,
        })),
    }),
    {
      name: IDENTITY_STORE_STORAGE_KEY,
    },
  ),
);
