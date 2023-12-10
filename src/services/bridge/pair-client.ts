import { getFullProof } from "@/lib/proof";
import { buffer_decode, encodeBigInt, handleError } from "@/lib/utils";
import { parseWorldIDQRCode } from "@/lib/validation";
import { fetchMetadata } from "@/services/metadata";

import type {
  BridgeServiceReturnType,
  FP,
  Identity,
  MetadataResponse,
} from "@/types";

import { type BridgeInitialData, type BridgeRequestData } from "@/types";
import { CredentialType } from "@worldcoin/idkit-core";

type Props = {
  url: string;
  activeIdentity: Identity;
};

type PairClientReturnType = BridgeServiceReturnType<{
  fullProof: FP;
  metadata: Partial<MetadataResponse>;
  bridgeInitialData: BridgeInitialData;
}>;

export const pairClient = async ({
  url,
  activeIdentity,
}: Props): Promise<PairClientReturnType> => {
  const { valid, requestUUID, bridgeURL, key } = await parseWorldIDQRCode(url);

  if (!valid) {
    return {
      success: false,
      error: new Error("Invalid QR code"),
    };
  }

  let bridgeRequestData: BridgeRequestData | null = null;

  try {
    const response = await fetch(`${bridgeURL}/request/${requestUUID}`);

    if (!response.ok) {
      throw new Error("Failed to fetch bridge request data");
    }

    bridgeRequestData = (await response.json()) as BridgeRequestData | null;
  } catch (error) {
    return {
      success: false,
      error: handleError({
        error,
        message: "Failed to fetch bridge request data",
      }),
    };
  }

  if (!bridgeRequestData) {
    return {
      success: false,
      error: handleError({ message: "No bridge request data" }),
    };
  }

  let bridgeInitialData: BridgeInitialData | null = null;

  try {
    const { iv, payload } = bridgeRequestData;
    const keyBuffer = buffer_decode(key);
    const ivBuffer = buffer_decode(iv);
    const payloadBuffer = buffer_decode(payload);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBuffer,
      { name: "AES-GCM", length: 256 },
      true,
      ["decrypt"],
    );

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivBuffer },
      cryptoKey,
      payloadBuffer,
    );

    const decoder = new TextDecoder();
    const decodedRaw = decoder.decode(decryptedBuffer);
    bridgeInitialData = JSON.parse(decodedRaw) as BridgeInitialData | null;
  } catch (error) {
    return {
      success: false,
      error: handleError({
        error,
        message: "Failed to decrypt bridge initial data",
      }),
    };
  }

  if (!bridgeInitialData) {
    return {
      success: false,
      error: handleError({ message: "No bridge initial data" }),
    };
  }

  let credential_type: CredentialType | undefined;

  if (bridgeInitialData.credential_types.includes(CredentialType.Orb)) {
    credential_type = CredentialType.Orb;
  } else {
    credential_type = CredentialType.Device;
  }

  const { verified, fullProof } = await getFullProof(
    {
      ...bridgeInitialData,
      credential_type,
    },
    activeIdentity,
  );

  if (!verified) {
    return {
      success: false,
      error: handleError({ message: "Failed to generate full proof" }),
    };
  }

  const metadata = await fetchMetadata({
    app_id: bridgeInitialData.app_id,
    action: bridgeInitialData.action,
    signal: bridgeInitialData.signal,
    nullifier_hash: encodeBigInt(BigInt(fullProof.nullifierHash)),
    action_description: bridgeInitialData.action_description,
    credential_types: bridgeInitialData.credential_types,
  });

  return { success: true, fullProof, metadata, bridgeInitialData };
};
