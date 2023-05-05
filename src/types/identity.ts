import type { inclusionProof } from "@/services/sequencer";

export interface Identity {
  readonly id: string;
  readonly commitment: bigint;
  readonly trapdoor: bigint;
  readonly nullifier: bigint;
  verified: boolean;
  persisted: boolean;
  inclusionProof: Awaited<ReturnType<typeof inclusionProof>> | null;
}
