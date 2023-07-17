import type { Chain, CredentialType } from "./common";
import type { InclusionProofResponse } from "./sequencer";

export interface InterfaceMeta {
  readonly name: string;
  readonly emoji: string;
}

export interface Identity {
  readonly id: string;
  readonly meta: InterfaceMeta;
  readonly zkIdentity: string;
  chain: Chain; // TODO: refactor
  verified: Record<CredentialType, boolean>;
  inclusionProof: Record<CredentialType, InclusionProofResponse | null>;
}
