import assert from "node:assert/strict";
import { before, test } from "node:test";
import { VerificationLevel } from "@worldcoin/idkit-core";
import type { Identity } from "../src/types/identity";

// #region In-memory localStorage: the store hydrates from it when imported
const STORAGE_KEY = "Simulator_Identity_Store_2";
const backing = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  writable: true,
  value: {
    getItem: (key: string) => backing.get(key) ?? null,
    setItem: (key: string, value: string) => void backing.set(key, value),
    removeItem: (key: string) => void backing.delete(key),
  },
});

const makeIdentity = (idNumber: number): Identity => ({
  id: `0x${idNumber.toString(16).padStart(8, "0")}`,
  meta: { name: `Identity #${idNumber}`, idNumber },
  zkIdentity: `zk-identity-${idNumber}`,
  verified: {
    [VerificationLevel.Orb]: true,
    [VerificationLevel.Device]: true,
    [VerificationLevel.SecureDocument]: true,
    [VerificationLevel.Document]: true,
  },
  inclusionProof: null,
  proofGenerationTime: null,
});
const ids = (identities: Identity[]) => identities.map((i) => i.id);

const writePersisted = (state: unknown) =>
  backing.set(STORAGE_KEY, JSON.stringify({ state, version: 0 }));
const readPersistedIds = () =>
  ids(
    (
      JSON.parse(backing.get(STORAGE_KEY) ?? "{}") as {
        state: { identities: Identity[] };
      }
    ).state.identities,
  );
// #endregion

type StoreModule = typeof import("../src/stores/identityStore");
let useIdentityStore: StoreModule["useIdentityStore"];

// The profile of someone who already hit the duplicate-seeding bug: the five
// seeded identities persisted twice, newest first.
const seeded = [4, 3, 2, 1, 0].map(makeIdentity);

before(async () => {
  writePersisted({
    activeIdentityID: seeded[0].id,
    identities: [...seeded, ...seeded],
  });
  ({ useIdentityStore } = await import("../src/stores/identityStore"));
});

test("hydration keeps one identity per id", () => {
  assert.equal(useIdentityStore.persist.hasHydrated(), true);
  assert.deepEqual(ids(useIdentityStore.getState().identities), ids(seeded));
  assert.equal(useIdentityStore.getState().activeIdentityID, seeded[0].id);
});

test("insertIdentity ignores an id that is already present", () => {
  const { insertIdentity } = useIdentityStore.getState();

  // Seeding again with identities that already exist (the reload bug).
  for (const identity of seeded) insertIdentity(identity);
  assert.deepEqual(ids(useIdentityStore.getState().identities), ids(seeded));

  // A new id is inserted first; the same id again is dropped unchanged.
  const fresh = makeIdentity(5);
  insertIdentity(fresh);
  insertIdentity({ ...fresh, meta: { ...fresh.meta, name: "renamed" } });
  const { identities } = useIdentityStore.getState();
  assert.deepEqual(ids(identities), [fresh.id, ...ids(seeded)]);
  assert.equal(identities[0].meta.name, fresh.meta.name);

  // What was written back to storage has no duplicates either.
  assert.deepEqual(readPersistedIds(), ids(identities));
});

test("rehydration tolerates a malformed identities field", async () => {
  useIdentityStore.setState({ activeIdentityID: null, identities: [] });
  writePersisted({ activeIdentityID: seeded[1].id, identities: "corrupt" });

  await useIdentityStore.persist.rehydrate();

  const state = useIdentityStore.getState();
  assert.deepEqual(state.identities, []);
  assert.equal(state.activeIdentityID, seeded[1].id);
  assert.equal(typeof state.insertIdentity, "function");
});
