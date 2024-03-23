import type { CredentialType } from "@worldcoin/idkit-core";
import type { InclusionProofResponse } from "./sequencer";

interface InterfaceMeta {
  readonly name: string;
  readonly idNumber: number;
}

export interface Identity {
  readonly id: string;
  readonly meta: InterfaceMeta;
  readonly zkIdentity: string;
  verified: Record<CredentialType, boolean>;
  inclusionProof: Record<CredentialType, InclusionProofResponse | null> | null;
  proofGenerationTime: number | null;
}
