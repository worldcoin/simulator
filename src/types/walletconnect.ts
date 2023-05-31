import type { MetadataParams } from "./metadata";

export interface SessionEvent {
  id: number;
  topic: string;
  params: { request: SignRequest };
}

export interface SignRequest {
  method: string;
  params: MetadataParams[];
}

export interface SignResponse {
  id: number;
  jsonrpc: string;
  result: {
    merkle_root: string;
    nullifier_hash: string;
    proof: string;
    credential_type: string;
    chain: string;
  };
}
