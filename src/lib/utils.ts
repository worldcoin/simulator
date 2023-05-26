import type { BytesLike } from "@ethersproject/bytes";
import { internal } from "@worldcoin/idkit";
import type { HashFunctionOutput } from "@worldcoin/idkit/build/src/lib/hashing";

export function encode(value: bigint): string {
  return "0x" + value.toString(16).padStart(64, "0");
}

export function hash(input: Buffer | BytesLike): HashFunctionOutput {
  return internal.hashToField(input);
}
