import type { inclusionProof } from "@/lib/sequencer-service";

export interface Identity {
  /** identity display id */
  readonly id: string;
  /** @default false */
  verified: boolean;
  inclusionProof: Awaited<ReturnType<typeof inclusionProof>>;
  /** identity commitment */
  readonly commitment: bigint;
  readonly trapdoor: bigint;
  /* The identity nullifier */
  readonly nullifier: bigint;
}
