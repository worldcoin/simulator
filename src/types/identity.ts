import type { inclusionProof } from "@/services/sequencer";
import type { Identity as ZkIdentity } from "@semaphore-protocol/identity";
import type { Chain, CredentialType } from "./common";

export interface Identity {
  readonly id: string;
  readonly commitment: bigint;
  readonly trapdoor: bigint;
  readonly nullifier: bigint;
  chain: Chain; // TODO: refactor
  persisted: boolean;
  verified: Record<CredentialType, boolean>;
  inclusionProof: Record<
    CredentialType,
    Awaited<ReturnType<typeof inclusionProof>> | null
  >;
}

export type RawIdentity = {
  id: string;
  zkIdentity: ZkIdentity;
};

export type StoredIdentity = {
  id: string;
  zkIdentity: string;
};
