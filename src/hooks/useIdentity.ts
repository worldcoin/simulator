import { encode } from "@/lib/utils";
import type { IdentityStore } from "@/stores/identityStore";
import { useIdentityStore } from "@/stores/identityStore";
import type { Identity, InclusionProofResponse } from "@/types";
import { Chain, CredentialType } from "@/types";
import { Identity as ZkIdentity } from "@semaphore-protocol/identity";
import { useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";

const getStore = (store: IdentityStore) => ({
  activeIdentityID: store.activeIdentityID,
  identities: store.identities,
  setActiveIdentityID: store.setActiveIdentityID,
  insertIdentity: store.insertIdentity,
  replaceIdentity: store.replaceIdentity,
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

  const updateIdentity = useCallback(
    async (identity: Identity) => {
      // Deserialize zkIdentity
      const zkIdentity = new ZkIdentity(identity.zkIdentity);
      // Generate id value
      const { commitment } = zkIdentity;
      const encodedCommitment = encode(commitment);
      const id = encodedCommitment.slice(0, 10);

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

      // Build updated identity object
      const newIdentity: Identity = {
        ...identity,
        id,
        verified: {
          [CredentialType.Orb]: orbProofPolygon !== null,
          [CredentialType.Phone]: phoneProofPolygon !== null,
        },

        inclusionProof: {
          [CredentialType.Orb]: orbProofPolygon,
          [CredentialType.Phone]: phoneProofPolygon,
        },
      };

      // Store updated identity
      replaceIdentity(newIdentity);

      return newIdentity;
    },
    [replaceIdentity],
  );

  const generateNextIdentity = useCallback(
    async (withIDNumber?: number) => {
      const idNum =
        withIDNumber || withIDNumber == 0 ? withIDNumber : identities.length;
      if (idNum > 999) {
        toast.error("You have reached the maximum number of identities");
        return;
      }
      const zkIdentity = new ZkIdentity(idNum.toString());
      const name = `Identity #${idNum}`;
      const encodedCommitment = encode(zkIdentity.commitment);
      const id = encodedCommitment.slice(0, 10);

      const identity: Identity = {
        id,
        meta: {
          name,
          idNumber: idNum,
        },
        zkIdentity: zkIdentity.toString(),
        verified: {
          [CredentialType.Orb]: true,
          [CredentialType.Phone]: true,
        },
        inclusionProof: {
          [CredentialType.Orb]: null,
          [CredentialType.Phone]: null,
        },
      };
      insertIdentity(identity);
      setActiveIdentityID(identity.id);
      return await updateIdentity(identity).then((identity) => {
        replaceIdentity(identity);
        return identity;
      });
    },
    [
      identities.length,
      insertIdentity,
      replaceIdentity,
      setActiveIdentityID,
      updateIdentity,
    ],
  );

  const generateFirstFiveIdentities = useCallback(async () => {
    for (let i = 0; i < 5; i++) {
      void generateNextIdentity(i);
    }
  }, [generateNextIdentity]);

  const resetIdentityStore = useCallback(() => {
    reset();
    void generateFirstFiveIdentities();
  }, [generateFirstFiveIdentities, reset]);

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
    generateFirstFiveIdentities,
  };
};

export default useIdentity;
