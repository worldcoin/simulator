import { Buffer } from "buffer/";

const bufferEncode = (buffer: ArrayBuffer): string =>
  Buffer.from(buffer).toString("base64");

export const buffer_decode = (encoded: string): ArrayBuffer =>
  Uint8Array.from(Buffer.from(encoded, "base64")).buffer;

export const encryptRequest = async (
  key: CryptoKey,
  iv: ArrayBuffer,
  request: string,
): Promise<{ payload: string; iv: string }> => ({
  iv: bufferEncode(iv),
  payload: bufferEncode(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      new TextEncoder().encode(request),
    ),
  ),
});

export async function decryptBridgeRequest(
  envelope: { iv: string; payload: string },
  key: string,
): Promise<unknown> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    buffer_decode(key),
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: buffer_decode(envelope.iv) },
    cryptoKey,
    buffer_decode(envelope.payload),
  );
  return JSON.parse(new TextDecoder().decode(decrypted)) as unknown;
}
