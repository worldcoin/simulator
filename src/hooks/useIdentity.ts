import { inclusionProof } from "@/services/sequencer";
import type { IIdentityStore } from "@/stores/identityStore";
import { useIdentityStore } from "@/stores/identityStore";
import type { Identity, RawIdentity } from "@/types";
import { Chain, CredentialType } from "@/types";
import { Identity as ZkIdentity } from "@semaphore-protocol/identity";

const IDENTITY_STORAGE_KEY = "Identity";

const getStore = (store: IIdentityStore) => ({
  identity: store.identity,
  setIdentity: store.setIdentity,
});

const useIdentity = () => {
  const { identity, setIdentity } = useIdentityStore(getStore);

  const createIdentity = async (chain: Chain) => {
    const identity = new ZkIdentity();
    return await updateIdentity(identity, chain);
  };

  const storeIdentity = (id: string, identity: ZkIdentity) => {
    try {
      sessionStorage.setItem(
        IDENTITY_STORAGE_KEY,
        JSON.stringify({ id, zkIdentity: identity.toString() }),
      );
      console.info("Stored identity");
    } catch (error) {
      console.error(`Unable to persist semaphore identity, ${error}`);
    }
  };

  const retrieveIdentity = async () => {
    try {
      const storage = sessionStorage.getItem(IDENTITY_STORAGE_KEY);
      if (!storage) {
        return null;
      }

      const rawIdentity = JSON.parse(storage) as RawIdentity;
      const zkIdentity = new ZkIdentity(rawIdentity.zkIdentity.toString());
      const identity = await updateIdentity(zkIdentity);
      console.info("Restored serialized identity");

      return identity;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const updateIdentity = async (
    identity: ZkIdentity,
    chain = Chain.Polygon,
    persisted = false,
  ) => {
    const { commitment, trapdoor, nullifier } = identity;
    const encodedCommitment = encodeIdentityCommitment(commitment);
    const id = encodedCommitment.slice(0, 10);

    const orbProof = await getIdentityProof(
      chain,
      CredentialType.Orb,
      encodedCommitment,
    );
    const phoneProof = await getIdentityProof(
      chain,
      CredentialType.Phone,
      encodedCommitment,
    );

    const extendedIdentity: Identity = {
      ...identity,
      id,
      commitment,
      trapdoor,
      nullifier,
      chain,
      persisted,
      verified: {
        [CredentialType.Orb]: orbProof !== null,
        [CredentialType.Phone]: phoneProof !== null,
      },
      inclusionProof: {
        [CredentialType.Orb]: orbProof,
        [CredentialType.Phone]: phoneProof,
      },
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
    chain: Chain,
    credentialType: CredentialType,
    encodedCommitment: string,
  ) => {
    try {
      const proof = await inclusionProof(
        chain,
        credentialType,
        encodedCommitment,
      );
      return proof;
    } catch (error) {
      console.error(
        `Unable to get identity proof for credential type '${credentialType}' on chain '${chain}'`,
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
