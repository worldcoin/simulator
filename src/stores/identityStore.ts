import { getIdentityProfile } from "@/lib/identity-persona";
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
const IDENTITY_STORE_VERSION = 1;
type PersistedIdentityStore = Pick<
  IdentityStore,
  "activeIdentityID" | "identities"
>;

function migrateIdentity(identity: Identity): Identity {
  return {
    ...identity,
    profile: getIdentityProfile(identity),
  };
}

function migrateIdentityStoreState(state: unknown): PersistedIdentityStore {
  const persisted =
    typeof state === "object" && state !== null
      ? (state as Partial<PersistedIdentityStore>)
      : {};

  return {
    activeIdentityID: persisted.activeIdentityID ?? null,
    identities: (persisted.identities ?? []).map(migrateIdentity),
  };
}

export const useIdentityStore = create<IdentityStore>()(
  persist<IdentityStore, [], [], PersistedIdentityStore>(
    (set) => ({
      activeIdentityID: null,
      identities: [],
      setActiveIdentityID: (id) => set({ activeIdentityID: id }),
      insertIdentity: (identity) =>
        set((state) => ({
          identities: [migrateIdentity(identity), ...state.identities],
        })),
      replaceIdentity: (identity) =>
        set((state) => ({
          identities: state.identities.map((i) => {
            if (i.id === identity.id) {
              return migrateIdentity(identity);
            }
            return i;
          }),
        })),
      reset: () =>
        set(() => ({
          identities: [],
          activeIdentityID: null,
        })),
    }),
    {
      name: IDENTITY_STORE_STORAGE_KEY,
      version: IDENTITY_STORE_VERSION,
      partialize: (state) => ({
        activeIdentityID: state.activeIdentityID,
        identities: state.identities,
      }),
      migrate: migrateIdentityStoreState,
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<PersistedIdentityStore>;
        return {
          ...currentState,
          activeIdentityID: persisted.activeIdentityID ?? null,
          identities: (persisted.identities ?? []).map(migrateIdentity),
        };
      },
    },
  ),
);
