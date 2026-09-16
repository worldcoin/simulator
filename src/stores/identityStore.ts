import type { Identity } from "@/types/identity";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type IdentityStore = {
  activeIdentityID: string | null;
  identities: Identity[];
  setActiveIdentityID: (id: string) => void;
  insertIdentity: (identity: Identity) => void;
  replaceIdentity: (identity: Identity) => void;
  removeIdentity: (id: string) => void;
  reset: () => void;
};

const IDENTITY_STORE_STORAGE_KEY = "Simulator_Identity_Store_2";

// `id` is the primary key of an identity. It is derived deterministically from
// the identity number, so the same identity can legitimately be produced more
// than once (e.g. seeding again after a reload); keep the first occurrence.
const uniqueById = (identities: Identity[]): Identity[] => {
  const seen = new Set<string>();
  return identities.filter((identity) => {
    if (seen.has(identity.id)) return false;
    seen.add(identity.id);
    return true;
  });
};

export const useIdentityStore = create<IdentityStore>()(
  persist(
    (set, get) => ({
      activeIdentityID: null,
      identities: [],
      setActiveIdentityID: (id) => set({ activeIdentityID: id }),
      // Idempotent by id: inserting an identity that already exists is a no-op,
      // so seeding or a double click can never create a duplicate row.
      insertIdentity: (identity) => {
        if (get().identities.some((i) => i.id === identity.id)) return;
        set((state) => ({ identities: [identity, ...state.identities] }));
      },
      replaceIdentity: (identity) =>
        set((state) => ({
          identities: state.identities.map((i) => {
            if (i.id === identity.id) {
              return identity;
            }
            return i;
          }),
        })),
      // Removing the active identity hands the active slot to the most recent
      // remaining one, so the home screen never points at a missing identity.
      removeIdentity: (id) =>
        set((state) => {
          const identities = state.identities.filter((i) => i.id !== id);
          return {
            identities,
            activeIdentityID:
              state.activeIdentityID === id
                ? identities[0]?.id ?? null
                : state.activeIdentityID,
          };
        }),
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
      // Persisted state is untrusted input: drop duplicate ids written by
      // earlier versions of the seeding logic and tolerate a malformed list.
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<IdentityStore>;
        return {
          ...currentState,
          ...persisted,
          identities: Array.isArray(persisted.identities)
            ? uniqueById(persisted.identities)
            : currentState.identities,
        };
      },
    },
  ),
);
