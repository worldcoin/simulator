import type { VerificationLevel } from "@worldcoin/idkit-core";
import type { InclusionProofResponse } from "./sequencer";

interface InterfaceMeta {
  readonly name: string;
  readonly idNumber: number;
}

export interface Identity {
  readonly id: string;
  readonly meta: InterfaceMeta;
  readonly zkIdentity: string;
  verified: Record<VerificationLevel, boolean>;
  inclusionProof: Record<
    VerificationLevel,
    InclusionProofResponse | null
  > | null;
  proofGenerationTime: number | null;
}
