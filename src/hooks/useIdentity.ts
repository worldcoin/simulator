import { encode } from "@/lib/utils";
import type { IIdentityStore } from "@/stores/identityStore";
import { useIdentityStore } from "@/stores/identityStore";
import type {
  Chain,
  Identity,
  InclusionProofResponse,
  StoredIdentity,
} from "@/types";
import { CredentialType } from "@/types";
import { Identity as ZkIdentity } from "@semaphore-protocol/identity";

const IDENTITY_STORAGE_KEY = "Identity";

const getStore = (store: IIdentityStore) => ({
  identity: store.identity,
  setIdentity: store.setIdentity,
});

const useIdentity = () => {
  const { identity, setIdentity } = useIdentityStore(getStore);

  const createIdentity = async (chain: Chain) => {
    const zkIdentity = new ZkIdentity();
    const identity: Identity = {
      id: "",
      zkIdentity,
      chain,
      persisted: false,
      verified: {
        [CredentialType.Orb]: false,
        [CredentialType.Phone]: false,
      },
      inclusionProof: {
        [CredentialType.Orb]: null,
        [CredentialType.Phone]: null,
      },
    };
    return await updateIdentity(identity);
  };

  const storeIdentity = (identity: Identity) => {
    try {
      const storedIdentity: StoredIdentity = {
        ...identity,
        zkIdentity: identity.zkIdentity.toString(),
      };
      sessionStorage.setItem(
        IDENTITY_STORAGE_KEY,
        JSON.stringify(storedIdentity),
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

      const storedIdentity = JSON.parse(storage) as StoredIdentity;
      const zkIdentity = new ZkIdentity(storedIdentity.zkIdentity);
      const identity: Identity = {
        ...storedIdentity,
        zkIdentity,
      };
      await updateIdentity(identity);
      console.info("Restored serialized identity");

      return identity;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const updateIdentity = async (identity: Identity) => {
    // Generate id value
    const { commitment } = identity.zkIdentity;
    const encodedCommitment = encode(commitment);
    const id = encodedCommitment.slice(0, 10);

    // Retrieve inclusion proofs
    const orbProof = await getIdentityProof(
      identity.chain,
      CredentialType.Orb,
      encodedCommitment,
    );
    const phoneProof = await getIdentityProof(
      identity.chain,
      CredentialType.Phone,
      encodedCommitment,
    );

    // Build updated identity object
    const newIdentity: Identity = {
      ...identity,
      id,
      verified: {
        [CredentialType.Orb]: orbProof !== null,
        [CredentialType.Phone]: phoneProof !== null,
      },
      inclusionProof: {
        [CredentialType.Orb]: orbProof,
        [CredentialType.Phone]: phoneProof,
      },
    };

    setIdentity(newIdentity);
    storeIdentity(newIdentity);
    return newIdentity;
  };

  const clearIdentity = () => {
    try {
      sessionStorage.removeItem(IDENTITY_STORAGE_KEY);
    } catch (error) {
      console.error(error);
    }
  };

  const getIdentityProof = async (
    chain: Chain,
    credentialType: CredentialType,
    encodedCommitment: string,
  ): Promise<InclusionProofResponse | null> => {
    try {
      const response = await fetch("/api/sequencer/inclusionProof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chain,
          credentialType,
          commitment: encodedCommitment,
        }),
      });

      if (response.status === 200) {
        return response.json() as unknown as InclusionProofResponse; // TODO: fix this
      }
    } catch (error) {
      console.error(
        `Unable to get identity proof for credential type '${credentialType}' on chain '${chain}'. Error: ${error}`,
      );
    }
    return null;
  };

  return {
    identity,
    createIdentity,
    retrieveIdentity,
    updateIdentity,
    clearIdentity,
  };
};

export default useIdentity;
