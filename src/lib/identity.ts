import { Identity } from "@semaphore-protocol/identity";

/**
 * Generate a Semaphore identity. Can be either fully random or based on a seed message.
 * @param seed
 * @returns
 */
export const generateIdentity = (seed?: string) => {
  return new Identity(seed);
};
