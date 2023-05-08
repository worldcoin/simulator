import type { inclusionProof } from "@/services/sequencer";
import type { ZkIdentity } from "@zk-kit/identity";

export interface Identity {
  /** identity display id */
  readonly id: string;
  /** @default false */
  verified: boolean;
  /** @default false */
  persisted: boolean;
  inclusionProof: Awaited<ReturnType<typeof inclusionProof>> | null;
  /** identity commitment */
  readonly commitment: bigint;
  readonly trapdoor: bigint;
  /* The identity nullifier */
  readonly nullifier: bigint;
}

export type RawIdentity = {
  id: string;
  zkIdentity: ZkIdentity;
};

export type StoredIdentity = {
  id: string;
  zkIdentity: string;
};
