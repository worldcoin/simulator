import type { CredentialType } from "./common";

export interface SequencerRequest {
  endpoint: string;
  commitment: string;
  authenticate?: boolean;
  credentialType: CredentialType;
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
