import type { CredentialType } from "@worldcoin/idkit-core";

export interface SequencerRequest {
  endpoint: string;
  credentialType: CredentialType;
  commitment: string;
  authenticate?: boolean;
}

export interface InclusionProofResponse {
  status: string;
  root: string | null;
  proof: Record<"Left" | "Right", string>[] | null;
  message: string;
}
