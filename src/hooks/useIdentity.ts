import { inclusionProof } from "@/services/sequencer";
import type { IIdentityStore } from "@/stores/identityStore";
import { useIdentityStore } from "@/stores/identityStore";
import type { Identity, RawIdentity, StoredIdentity } from "@/types";
import { Strategy, ZkIdentity } from "@zk-kit/identity";

const IDENTITY_STORAGE_KEY = "Identity";

const getStore = (store: IIdentityStore) => ({
  identity: store.identity,
  setIdentity: store.setIdentity,
});

const useIdentity = () => {
  const { identity, setIdentity } = useIdentityStore(getStore);

  const createIdentity = async () => {
    const identity = new ZkIdentity(Strategy.RANDOM);
    return await updateIdentity(identity);
  };

  const storeIdentity = ({ id, zkIdentity }: RawIdentity) => {
    const identity = {
      id,
      zkIdentity: zkIdentity.serializeIdentity(),
    };

    try {
      sessionStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(identity));
    } catch {
      console.error("Unable to persist semaphore identity");
    }
  };

  const retrieveIdentity = async () => {
    try {
      const storedIdentity = sessionStorage.getItem(IDENTITY_STORAGE_KEY);
      if (!storedIdentity) {
        return null;
      }

      const parsedIdentity = JSON.parse(storedIdentity) as StoredIdentity;
      const zkIdentity = new ZkIdentity(
        Strategy.SERIALIZED,
        parsedIdentity.zkIdentity,
      );

      const identity = await updateIdentity(zkIdentity);
      console.log("Restored serialized identity");

      return identity;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const updateIdentity = async (identity: ZkIdentity, persisted = false) => {
    const commitment = identity.genIdentityCommitment();
    const trapdoor = identity.getTrapdoor();
    const nullifier = identity.getNullifier();

    const encodedCommitment = encodeIdentityCommitment(commitment);
    const id = encodedCommitment.slice(0, 10);

    const proof = await getIdentityProof(encodedCommitment);

    const extendedIdentity: Identity = {
      ...identity,
      commitment,
      trapdoor,
      nullifier,
      id,
      verified: proof ? true : false,
      persisted,
      inclusionProof: proof,
    };

    setIdentity(extendedIdentity);
    storeIdentity({ id, zkIdentity: identity });
    return extendedIdentity;
  };

  const clearIdentity = () => {
    try {
      sessionStorage.removeItem(IDENTITY_STORAGE_KEY);
    } catch (error) {
      console.log(error);
    }
  };

  const encodeIdentityCommitment = (identityCommitment: bigint): string => {
    return identityCommitment.toString(16).padStart(64, "0");
  };

  const getIdentityProof = async (encodedCommitment: string) => {
    try {
      const proof = await inclusionProof(encodedCommitment);
      return proof;
    } catch (error) {
      console.error("Unable to get identity proof");
      return null;
    }
  };

  return {
    identity,
    setIdentity,
    createIdentity,
    storeIdentity,
    retrieveIdentity,
    updateIdentity,
    clearIdentity,
  };
};

export default useIdentity;
