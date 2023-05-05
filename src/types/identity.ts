import type { inclusionProof } from "@/services/sequencer";
import type { ZkIdentity } from "@zk-kit/identity";

export interface Identity {
  readonly id: string;
  readonly commitment: bigint;
  readonly trapdoor: bigint;
  readonly nullifier: bigint;
  verified: boolean;
  persisted: boolean;
  inclusionProof: Awaited<ReturnType<typeof inclusionProof>> | null;
}

export interface RawIdentity {
  id: string;
  zkIdentity: ZkIdentity;
}

export interface StoredIdentity {
  id: string;
  zkIdentity: string;
}
