import type { BytesLike } from "ethers";
import { BigNumber, ethers } from "ethers";
import type { Hexable } from "ethers/lib/utils.js";

export function encode(value: bigint): string {
  return "0x" + value.toString(16).padStart(64, "0");
}

// Lifted from @semaphore-protocol/proof internals
export function hash(message: BytesLike | Hexable | bigint | number): bigint {
  message = BigNumber.from(message).toTwos(256).toHexString();
  message = ethers.utils.zeroPad(message, 32);

  return BigInt(ethers.utils.keccak256(message)) >> BigInt(8);
}
