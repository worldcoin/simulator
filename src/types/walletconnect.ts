import type { MetadataParams } from "./metadata";

export interface SignRequest {
  method: string;
  params: MetadataParams[];
}

export interface SignResponse {
  merkle_root: string;
  nullifier_hash: string;
  proof: string;
  credential_type: string;
}
