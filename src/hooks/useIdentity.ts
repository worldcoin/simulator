import { encode } from "@/lib/utils";
import type { IdentityStore } from "@/stores/identityStore";
import { useIdentityStore } from "@/stores/identityStore";
import type { Identity, InclusionProofResponse } from "@/types";
import { Identity as ZkIdentity } from "@semaphore-protocol/identity";
import { VerificationLevel } from "@worldcoin/idkit-core";
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

  const generateIdentityProofsIfNeeded = useCallback(
    async (identity: Identity) => {
      // If proof was generated in the last 30 minutes, no need to generate again
      if (
        identity.proofGenerationTime &&
        identity.proofGenerationTime > Date.now() - 30 * 60 * 1000
      ) {
        return identity;
      }

      // Deserialize zkIdentity
      const zkIdentity = new ZkIdentity(identity.zkIdentity);
      // Generate id value
      const { commitment } = zkIdentity;
      const encodedCommitment = encode(commitment);
      const id = encodedCommitment.slice(0, 10);

      const orbProof = await getIdentityProof(
        VerificationLevel.Orb,
        encodedCommitment,
      );
      const deviceProof = await getIdentityProof(
        VerificationLevel.Device,
        encodedCommitment,
      );

      // Build updated identity object
      const newIdentity: Identity = {
        ...identity,
        id,
        verified: {
          [VerificationLevel.Orb]: orbProof !== null,
          [VerificationLevel.Device]: deviceProof !== null,
        },

        inclusionProof: {
          [VerificationLevel.Orb]: orbProof,
          [VerificationLevel.Device]: deviceProof,
        },
        proofGenerationTime: Date.now(),
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
          [VerificationLevel.Orb]: true,
          [VerificationLevel.Device]: true,
        },
        inclusionProof: {
          [VerificationLevel.Orb]: null,
          [VerificationLevel.Device]: null,
        },
        proofGenerationTime: null,
      };
      insertIdentity(identity);
      setActiveIdentityID(identity.id);
      return await generateIdentityProofsIfNeeded(identity).then((identity) => {
        replaceIdentity(identity);
        return identity;
      });
    },
    [
      identities.length,
      insertIdentity,
      replaceIdentity,
      setActiveIdentityID,
      generateIdentityProofsIfNeeded,
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
    verificationLevel: VerificationLevel,
    encodedCommitment: string,
  ): Promise<InclusionProofResponse | null> => {
    try {
      const response = await fetch("/api/sequencer/inclusionProof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationLevel,
          commitment: encodedCommitment,
        }),
      });

      if (response.status === 200) {
        console.log(
          `Fetched fresh inclusion proof from sequencer for: ${verificationLevel}.`,
        );
        return (await response.json()) as InclusionProofResponse;
      }
    } catch (error) {
      console.error(
        `Unable to get identity proof for credential type '${verificationLevel}'. Error: ${error}`,
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
    generateIdentityProofsIfNeeded,
    setActiveIdentityID,
    generateFirstFiveIdentities,
  };
};

export default useIdentity;
