import type { Identity } from "@/types";

/**
 * Number for the next test identity: one past the highest number in the list.
 * Deriving it from the list length drifts as soon as the list holds duplicates
 * or gaps, which is how "Identity #50" appeared after a duplicated store.
 */
export const nextIdentityNumber = (
  identities: readonly Pick<Identity, "meta">[],
): number =>
  identities.reduce(
    (max, identity) => Math.max(max, identity.meta.idNumber),
    -1,
  ) + 1;
