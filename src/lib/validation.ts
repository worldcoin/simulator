import { validateRequestSchema } from "@/helpers/validate-request-schema";
import type { ParseWorldIDQRCodeOutput } from "@/types";
import { ProofError } from "@/types";
import * as yup from "yup";

export async function parseWorldIDQRCode(
  data: string,
): Promise<ParseWorldIDQRCodeOutput> {
  const schema = yup.object({
    t: yup.string().oneOf(["wld"]).required(),
    i: yup.string().required(),
    b: yup.string().required(),
    k: yup.string().required(),
  });

  const url = new URL(data);
  const t = url.searchParams.get("t");
  const i = url.searchParams.get("i"); // request_uuid
  const b = url.searchParams.has("b")
    ? url.searchParams.get("b")
    : "https://bridge.worldcoin.org"; // bridge_url
  const k = url.searchParams.get("k"); // url_base64_encoded_raw_key

  const { parsedParams, isValid, errorMessage } = await validateRequestSchema({
    schema,
    value: { t, i, b, k },
  });

  if (!isValid) {
    return { valid: isValid, errorMessage };
  }

  return {
    valid: isValid,
    requestUUID: parsedParams.i,
    bridgeURL: parsedParams.b,
    key: parsedParams.k,
  };
}

export function validateImageUrl(data: string): boolean {
  try {
    const url = new URL(data);
    return (
      url.protocol === "data:" ||
      url.protocol === "https:" ||
      url.protocol === document.location.protocol
    );
  } catch {
    return false;
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
