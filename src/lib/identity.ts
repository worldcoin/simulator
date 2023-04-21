import { Identity } from "@semaphore-protocol/identity";

/**
 * Generate a Semaphore identity. Can be either fully random or based on a seed message.
 * @param seed For deterministic identities. Used with a seed phrase or signature from a wallet.
 * @returns
 */
export const generateIdentity = (seed?: string): Identity => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
  return new Identity(seed);
};
