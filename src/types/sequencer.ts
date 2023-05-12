import type { Chain, CredentialType } from "./common";

export interface SequencerRequest {
  chain: Chain;
  endpoint: string;
  credentialType: CredentialType;
  commitment: string;
  authenticate?: boolean;
}

export interface InclusionProofResponse {
  root: string;
  status: string;
  proof: Record<"Left" | "Right", string>[];
}

export interface InsertIdentityResponse {
  root: string;
  status: string;
  pendingValidAsOf: Date;
  minedValidAsOf: Date;
}
