import { inclusionProof } from "@/services/sequencer";
import type { IIdentityStore } from "@/stores/identityStore";
import { useIdentityStore } from "@/stores/identityStore";
import type { Identity } from "@/types";
import { CredentialType } from "@/types";
import { Identity as ZkIdentity } from "@semaphore-protocol/identity";

const IDENTITY_STORAGE_KEY = "Identity";

const getStore = (store: IIdentityStore) => ({
  identity: store.identity,
  setIdentity: store.setIdentity,
});

const useIdentity = () => {
  const { identity, setIdentity } = useIdentityStore(getStore);

  const createIdentity = async () => {
    const identity = new ZkIdentity();
    return await updateIdentity(identity);
  };

  const storeIdentity = (id: string, identity: ZkIdentity) => {
    try {
      sessionStorage.setItem(
        IDENTITY_STORAGE_KEY,
        JSON.stringify({ id, identity: identity.toString() }),
      );
    } catch (error) {
      console.error(`Unable to persist semaphore identity, ${error}`);
    }
  };

  const retrieveIdentity = async () => {
    try {
      const storedIdentity = sessionStorage.getItem(IDENTITY_STORAGE_KEY);
      if (!storedIdentity) {
        return null;
      }

      const zkIdentity = new ZkIdentity(storedIdentity);
      const identity = await updateIdentity(zkIdentity);
      console.info("Restored serialized identity");

      return identity;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const updateIdentity = async (identity: ZkIdentity, persisted = false) => {
    const { commitment, trapdoor, nullifier } = identity;
    const encodedCommitment = encodeIdentityCommitment(commitment);
    const id = encodedCommitment.slice(0, 10);

    const proof = await getIdentityProof(encodedCommitment, CredentialType.Orb);

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
    storeIdentity(id, identity);
    return extendedIdentity;
  };

  const clearIdentity = () => {
    try {
      sessionStorage.removeItem(IDENTITY_STORAGE_KEY);
    } catch (error) {
      console.error(error);
    }
  };

  const encodeIdentityCommitment = (identityCommitment: bigint): string => {
    return identityCommitment.toString(16).padStart(64, "0");
  };

  const getIdentityProof = async (
    encodedCommitment: string,
    credentialType: CredentialType,
  ) => {
    try {
      const proof = await inclusionProof(encodedCommitment, credentialType);
      return proof;
    } catch (error) {
      console.error(
        `Unable to get identity proof for credential type '${credentialType}'`,
      );
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
    encodeIdentityCommitment,
  };
};

export default useIdentity;
