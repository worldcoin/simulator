import { buffer_decode, encryptRequest } from "@/lib/bridge-crypto";

export type BridgeConnection = {
  bridgeURL: string;
  requestUUID: string;
  key: string;
};

export async function deliverBridgeResponse(
  connection: BridgeConnection,
  payload: Record<string, unknown>,
  options?: { signal?: AbortSignal; redirect?: RequestRedirect },
): Promise<void> {
  const key = await crypto.subtle.importKey(
    "raw",
    buffer_decode(connection.key),
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );
  const envelope = await encryptRequest(
    key,
    crypto.getRandomValues(new Uint8Array(12)),
    JSON.stringify(payload),
  );
  const response = await fetch(
    `${connection.bridgeURL}/response/${connection.requestUUID}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(envelope),
      ...options,
    },
  );
  if (!response.ok) throw new Error("Bridge response delivery failed");
}
