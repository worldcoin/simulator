import type { ParseWorldIDQRCodeOutput } from "@/types";
import { ProofError } from "@/types";
import { buffer_decode } from "./utils";

export function validateWorldIDQRCode(data: string): boolean {
  const url = new URL(data);

  let valid = false;

  const t = url.searchParams.get("t");
  const k = url.searchParams.get("k");
  const i = url.searchParams.get("i");

  if (
    t == "wld" &&
    k &&
    i &&
    /* cSpell:disable */
    /^[A-Za-z0-9+/]{42}[AEIMQUYcgkosw048]=$/.test(k) &&
    /* cSpell:enable */
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
      i,
    )
  ) {
    valid = true;
  }
  return valid;
}

export async function parseWorldIDQRCode(
  data: string,
): Promise<ParseWorldIDQRCodeOutput> {
  const url = new URL(data);
  const requestId = url.searchParams.get("i");
  const encodedKey = url.searchParams.get("k");
  const bridgeUrl = url.searchParams.get("b");

  if (url.searchParams.get("t") != "wld" || !requestId || !encodedKey) {
    return { valid: false };
  }

  try {
    return {
      requestId,
      valid: true,
      key: await window.crypto.subtle.importKey(
        "raw",
        buffer_decode(encodedKey),
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"],
      ),
      bridgeUrl,
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
