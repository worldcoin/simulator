import { buffer_decode } from "@/lib/utils";
import { parseWorldIDQRCode } from "@/lib/validation";
import { fetchMetadata } from "@/services/metadata";
import type { BridgeServiceReturnType, MetadataResponse } from "@/types";
import {
  CodedError,
  Errors,
  type BridgeInitialData,
  type BridgeRequestData,
} from "@/types";

type Props = {
  url: string;
};

type PairClientReturnType = BridgeServiceReturnType<{
  metadata: Partial<MetadataResponse>;
  bridgeInitialData: BridgeInitialData;
}>;

export const pairClient = async ({
  url,
}: Props): Promise<PairClientReturnType> => {
  const { valid, requestUUID, bridgeURL, key } = await parseWorldIDQRCode(url);

  if (!valid) {
    return {
      success: false,
      error: new CodedError(Errors.QRCodeInvalid, "Invalid QR code"),
    };
  }

  let bridgeRequestData: BridgeRequestData | null = null;

  try {
    const response = await fetch(`${bridgeURL}/request/${requestUUID}`);

    if (!response.ok) {
      if (response.status == 404) {
        return {
          success: false,
          error: new CodedError(
            Errors.InputError,
            "The QR code you have entered is either expired or has already been used.",
          ),
        };
      }
      throw new Error("Failed to fetch bridge request data");
    }

    bridgeRequestData = (await response.json()) as BridgeRequestData | null;
  } catch (error) {
    return {
      success: false,
      error: new CodedError(
        Errors.BridgeFetchError,
        "Failed to fetch bridge request data",
      ),
    };
  }

  if (!bridgeRequestData) {
    return {
      success: false,
      error: new CodedError(Errors.BridgeNoData, "No bridge request data"),
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
    console.error(error);
    return {
      success: false,
      error: new CodedError(
        Errors.BridgeDecryptError,
        "Failed to decrypt bridge initial data",
      ),
    };
  }

  if (!bridgeInitialData) {
    return {
      success: false,
      error: new CodedError(
        Errors.BridgeNoInitialData,
        "No bridge initial data",
      ),
    };
  }

  const metadata = await fetchMetadata({
    app_id: bridgeInitialData.app_id,
    action: bridgeInitialData.action,
    signal: bridgeInitialData.signal,
    nullifier_hash: "",
    action_description: bridgeInitialData.action_description,
  });

  return { success: true, metadata, bridgeInitialData };
};
