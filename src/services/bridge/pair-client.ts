import { decryptBridgeRequest } from "@/lib/bridge-crypto";
import { parseWorldIDQRCode } from "@/lib/validation";
import { fetchMetadata } from "@/services/metadata";
import type {
  BridgeInitialData,
  BridgeRequestData,
  BridgeServiceReturnType,
  MetadataResponse,
} from "@/types";
import { CodedError, ErrorsCode } from "@/types";

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
      error: new CodedError(ErrorsCode.QRCodeInvalid, "Invalid QR code"),
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
            ErrorsCode.InputError,
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
        ErrorsCode.BridgeFetchError,
        "Failed to fetch bridge request data",
      ),
    };
  }

  if (!bridgeRequestData) {
    return {
      success: false,
      error: new CodedError(ErrorsCode.BridgeNoData, "No bridge request data"),
    };
  }

  let bridgeInitialData: BridgeInitialData | null = null;

  try {
    bridgeInitialData = (await decryptBridgeRequest(
      bridgeRequestData,
      key,
    )) as BridgeInitialData | null;
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: new CodedError(
        ErrorsCode.BridgeDecryptError,
        "Failed to decrypt bridge initial data",
      ),
    };
  }

  if (!bridgeInitialData) {
    return {
      success: false,
      error: new CodedError(
        ErrorsCode.BridgeNoInitialData,
        "No bridge initial data",
      ),
    };
  }

  let metadata: Partial<MetadataResponse>;
  try {
    metadata = await fetchMetadata({
      app_id: bridgeInitialData.app_id,
      action: bridgeInitialData.action,
      signal: bridgeInitialData.signal,
      nullifier_hash: "",
      action_description: bridgeInitialData.action_description,
      environment: bridgeInitialData.environment, // IDKit v4
    });
  } catch (error) {
    if (error instanceof CodedError) {
      return { success: false, error };
    }
    throw error;
  }

  return { success: true, metadata, bridgeInitialData };
};
