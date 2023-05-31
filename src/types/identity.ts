import type { inclusionProof } from "@/services/sequencer";
import type { Identity as ZkIdentity } from "@semaphore-protocol/identity";
import type { Chain, CredentialType } from "./common";

export interface Identity {
  readonly id: string;
  readonly zkIdentity: ZkIdentity;
  chain: Chain; // TODO: refactor
  persisted: boolean;
  verified: Record<CredentialType, boolean>;
  inclusionProof: Record<
    CredentialType,
    Awaited<ReturnType<typeof inclusionProof>> | null
  >;
}

export interface StoredIdentity {
  readonly id: string;
  readonly zkIdentity: string;
  chain: Chain; // TODO: refactor
  persisted: boolean;
  verified: Record<CredentialType, boolean>;
  inclusionProof: Record<
    CredentialType,
    Awaited<ReturnType<typeof inclusionProof>> | null
  >;
}
