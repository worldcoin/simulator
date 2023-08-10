import type { CredentialType } from "./common";
import type { InclusionProofResponse } from "./sequencer";

export interface InterfaceMeta {
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
