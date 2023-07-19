import type { Chain, CredentialType } from "./common";
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
  // TODO: should be the same on both chains? can remove chain->type
  inclusionProof: Record<
    Chain,
    Record<CredentialType, InclusionProofResponse | null> | null
  >;
}
