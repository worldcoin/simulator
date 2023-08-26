import type { ParseWorldIDQRCodeOutput } from "@/types";
import { ProofError } from "@/types";

export function validateWorldIDQRCode(data: string): boolean {
  const url = new URL(data);

  return url.searchParams.get("t") == "wld" && url.searchParams.has("k");
}

const getPublicJWK = (jwk: JsonWebKey) => {
  delete jwk.d;
  delete jwk.dp;
  delete jwk.dq;
  delete jwk.q;
  delete jwk.qi;
  jwk.key_ops = ["encrypt"];

  return jwk;
};

export async function parseWorldIDQRCode(
  data: string,
): Promise<ParseWorldIDQRCodeOutput> {
  const url = new URL(data);
  const key = url.searchParams.get("k");

  if (url.searchParams.get("t") != "wld" || !key) {
    return { valid: false };
  }

  const jwk = JSON.parse(
    Buffer.from(key, "base64").toString("utf-8"),
  ) as JsonWebKey;
  const publicJwk = getPublicJWK({ ...jwk });

  try {
    const privateKey = await window.crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["decrypt"],
    );
    const publicKey = await window.crypto.subtle.importKey(
      "jwk",
      publicJwk,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["encrypt"],
    );

    return {
      valid: true,
      key: { publicKey, privateKey },
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
