import { getMerkleProof } from "@/lib/proof";
import { levelSatisfies } from "@/lib/verification-level";
import { CodedError, ErrorsCode, type Identity } from "@/types";
import type { VerificationLevel } from "@worldcoin/idkit-core";
import type { MerkleProof } from "@zk-kit/incremental-merkle-tree";

const credentialUnavailable = {
  ok: false,
  bridgeErrorCode: "credential_unavailable",
} as const;

type V3ProofSelection =
  | typeof credentialUnavailable
  | {
      ok: true;
      merkleProof: MerkleProof;
    };

export function selectV3MerkleProof({
  identity,
  requestedLevel,
  presentedLevel,
}: {
  identity: Identity;
  requestedLevel: VerificationLevel;
  presentedLevel: VerificationLevel;
}): V3ProofSelection {
  if (!levelSatisfies(requestedLevel, presentedLevel)) {
    return credentialUnavailable;
  }

  try {
    return {
      ok: true,
      merkleProof: getMerkleProof(identity, presentedLevel),
    };
  } catch (error) {
    if (
      error instanceof CodedError &&
      error.code === ErrorsCode.VerificationLevelNotSatisfied
    ) {
      return credentialUnavailable;
    }

    throw error;
  }
}
