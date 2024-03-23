import type { VerificationLevel } from "@worldcoin/idkit-core";

export interface SequencerRequest {
  endpoint: string;
  verificationLevel: VerificationLevel;
  commitment: string;
  authenticate?: boolean;
}

export interface InclusionProofResponse {
  status: string;
  root: string | null;
  proof: Record<"Left" | "Right", string>[] | null;
  message: string;
}
