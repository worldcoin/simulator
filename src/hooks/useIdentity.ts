import { EMOJIS } from "@/lib/constants";
import { encode } from "@/lib/utils";
import type { IdentityStore } from "@/stores/identityStore";
import { useIdentityStore } from "@/stores/identityStore";
import type { Identity, InclusionProofResponse } from "@/types";
import { Chain, CredentialType } from "@/types";
import { Identity as ZkIdentity } from "@semaphore-protocol/identity";
import { useMemo } from "react";

const getStore = (store: IdentityStore) => ({
  activeIdentityID: store.activeIdentityID,
  identities: store.identities,
  setActiveIdentityID: store.setActiveIdentityID,
  insertIdentity: store.insertIdentity,
  replaceIdentity: store.replaceIdentity,
  lastIdentityNonce: store.lastIdentityNonce,
  reset: store.reset,
});

const useIdentity = () => {
  const {
    activeIdentityID,
    identities,
    setActiveIdentityID,
    insertIdentity,
    replaceIdentity,
    reset,
  } = useIdentityStore(getStore);

  const resetIdentityStore = () => {
    reset();
  };

  const updateIdentity = async (identity: Identity) => {
    // Deserialize zkIdentity
    const zkIdentity = new ZkIdentity(identity.zkIdentity);
    // Generate id value
    const { commitment } = zkIdentity;
    const encodedCommitment = encode(commitment);
    const id = encodedCommitment.slice(0, 10);

    // Retrieve inclusion proofs
    const orbProofOptimism = await getIdentityProof(
      Chain.Optimism,
      CredentialType.Orb,
      encodedCommitment,
    );
    const orbProofPolygon = await getIdentityProof(
      Chain.Polygon,
      CredentialType.Orb,
      encodedCommitment,
    );
    const phoneProofPolygon = await getIdentityProof(
      Chain.Polygon,
      CredentialType.Phone,
      encodedCommitment,
    );

    console.log(
      `orbProofOptimism: ${orbProofOptimism != null}\n orbProofPolygon: ${
        orbProofPolygon != null
      }\n phoneProofPolygon: ${phoneProofPolygon != null}`,
    );

    // Build updated identity object
    const newIdentity: Identity = {
      ...identity,
      id,
      verified: {
        [CredentialType.Orb]:
          orbProofPolygon !== null && orbProofOptimism !== null,
        [CredentialType.Phone]: phoneProofPolygon !== null,
      },
      // inclusionProof: {
      //   [CredentialType.Orb]: orbProof,
      //   [CredentialType.Phone]: phoneProof,
      // },
      inclusionProof: {
        [Chain.Optimism]: {
          [CredentialType.Orb]: orbProofOptimism,
          [CredentialType.Phone]: null,
        },
        [Chain.Polygon]: {
          [CredentialType.Orb]: orbProofPolygon,
          [CredentialType.Phone]: phoneProofPolygon,
        },
      },
    };

    // Store updated identity
    replaceIdentity(newIdentity);

    return newIdentity;
  };

  const generateNextIdentity = async (chain: Chain) => {
    const zkIdentity = new ZkIdentity();

    const emoji = EMOJIS[identities.length];
    const name = `${identities.length + 1}`;
    const encodedCommitment = encode(zkIdentity.commitment);
    const id = encodedCommitment.slice(0, 10);

    const identity: Identity = {
      id,
      meta: {
        name,
        emoji,
      },
      zkIdentity: zkIdentity.toString(),
      verified: {
        [CredentialType.Orb]: false,
        [CredentialType.Phone]: false,
      },
      inclusionProof: {
        [Chain.Optimism]: {
          [CredentialType.Orb]: null,
          [CredentialType.Phone]: null,
        },
        [Chain.Polygon]: {
          [CredentialType.Orb]: null,
          [CredentialType.Phone]: null,
        },
      },
    };
    insertIdentity(identity);
    setActiveIdentityID(identity.id);
    return await updateIdentity(identity).then((identity) => {
      replaceIdentity(identity);
      return identity;
    });
  };

  const activeIdentity = useMemo(() => {
    // temp fix for rehydration issue
    if (!activeIdentityID || activeIdentityID === "undefined") {
      return null;
    }
    return identities.find((i) => i.id === activeIdentityID) ?? null;
  }, [activeIdentityID, identities]);

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
    // temp fix for persistence rehydration issue
    activeIdentityID:
      activeIdentityID === "undefined" || !activeIdentityID
        ? null
        : activeIdentityID,
    generateNextIdentity,
    identities,
    activeIdentity: activeIdentity,
    resetIdentityStore,
    updateIdentity,
    setActiveIdentityID,
  };
};

export default useIdentity;
