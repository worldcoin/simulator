export interface Identity {
  /** identity display id */
  readonly id: string;
  /** @default false */
  verified: boolean;
  /** identity commitment */
  readonly commitment: bigint;
  readonly trapdoor: bigint;
  /* The identity nullifier */
  readonly nullifier: bigint;
}
