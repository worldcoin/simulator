import type { ParseWorldIDQRCodeOutput } from "@/types";
import { ProofError } from "@/types";
import { buffer_decode } from "./utils";

export function validateWorldIDQRCode(data: string): boolean {
  const url = new URL(data);

  return url.searchParams.get("t") == "wld" && url.searchParams.has("k");
}

export async function parseWorldIDQRCode(
  data: string,
): Promise<ParseWorldIDQRCodeOutput> {
  const url = new URL(data);
  const requestId = url.searchParams.get("i");
  const encodedKey = url.searchParams.get("k");

  if (url.searchParams.get("t") != "wld" || !requestId || !encodedKey) {
    return { valid: false };
  }

  try {
    return {
      requestId,
      valid: true,
      key: await window.crypto.subtle.importKey(
        "raw",
        buffer_decode(decodeURIComponent(encodedKey)),
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"],
      ),
      bridgeUrl: url.searchParams.get("b"),
    };
  } catch (e) {
    console.error(e);
    return {
      valid: false,
      errorMessage: "Invalid key",
    };
  }
}

export async function validateSignal(signal: string) {
  try {
    return BigInt(signal);
  } catch (error) {
    throw new ProofError(-32602, "invalid_signal");
  }
}

export async function validateExternalNullifier(externalNullifier: string) {
  try {
    return BigInt(externalNullifier);
  } catch (error) {
    throw new ProofError(-32602, "invalid_external_nullifier");
  }
}
