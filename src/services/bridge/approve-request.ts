import { encodeBigInt } from "@/lib/utils";
import { deliverBridgeResponse } from "./deliver-response";
import { parseWorldIDQRCode } from "@/lib/validation";
import {
  CodedError,
  ErrorsCode,
  type BridgeServiceReturnType,
  type FP,
} from "@/types";
import type { VerificationLevel } from "@worldcoin/idkit-core";
import { encodePacked } from "viem";

type Props = {
  url: string;
  fullProof: FP;
  verificationLevel: VerificationLevel;
};

type ApproveRequestReturnType = BridgeServiceReturnType;

/**
 * Send a v3 proof response to the bridge (existing flow).
 */
export const approveRequest = async ({
  url,
  fullProof,
  verificationLevel,
}: Props): Promise<ApproveRequestReturnType> => {
  const { valid, requestUUID, bridgeURL, key } = await parseWorldIDQRCode(url);

  if (!valid) {
    return {
      success: false,
      error: new CodedError(ErrorsCode.QRCodeInvalid, "Invalid QR code"),
    };
  }

  const params = {
    proof: fullProof.proof,
    merkle_root: fullProof.merkleTreeRoot,
    nullifier_hash: fullProof.nullifierHash,
    // NOTE: we are adding this to the payload when user selects a credential type on modal
    verificationLevel,
  };

  const bigintProof = params.proof.map((x) => BigInt(x)) as [
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
  ];

  const proofString = encodePacked(["uint256[8]"], [bigintProof]);
  const merkleRootString = encodeBigInt(BigInt(params.merkle_root));

  const nullifierHashString = encodeBigInt(BigInt(params.nullifier_hash));

  const payload = {
    proof: proofString,
    merkle_root: merkleRootString,
    nullifier_hash: nullifierHashString,
    verification_level: params.verificationLevel,
  };

  return sendEncryptedBridgeResponse(bridgeURL, requestUUID, key, payload);
};

/**
 * Send a v4 proof response (ProofResponse from sidecar) to the bridge.
 * The payload matches IDKit's BridgeResponse::ResponseV2 format.
 */
export const approveRequestV4 = async ({
  url,
  proofResponse,
}: {
  url: string;
  proofResponse: Record<string, unknown>;
}): Promise<ApproveRequestReturnType> => {
  const { valid, requestUUID, bridgeURL, key } = await parseWorldIDQRCode(url);

  if (!valid) {
    return {
      success: false,
      error: new CodedError(ErrorsCode.QRCodeInvalid, "Invalid QR code"),
    };
  }

  // v4: send the ProofResponse directly (untagged serde matches ResponseV2 variant in IDKit)
  return sendEncryptedBridgeResponse(
    bridgeURL,
    requestUUID,
    key,
    proofResponse,
  );
};

/**
 * Send a v4 error response to the bridge.
 * The payload matches IDKit's BridgeResponse::Error format.
 */
export const rejectRequestV4 = async ({
  url,
  errorCode,
}: {
  url: string;
  errorCode: string;
}): Promise<ApproveRequestReturnType> => {
  const { valid, requestUUID, bridgeURL, key } = await parseWorldIDQRCode(url);

  if (!valid) {
    return {
      success: false,
      error: new CodedError(ErrorsCode.QRCodeInvalid, "Invalid QR code"),
    };
  }

  return sendEncryptedBridgeResponse(bridgeURL, requestUUID, key, {
    error_code: errorCode,
  });
};

/**
 * Shared helper: encrypt a JSON payload and PUT it to the bridge.
 */
async function sendEncryptedBridgeResponse(
  bridgeURL: string,
  requestUUID: string,
  key: string,
  payload: Record<string, unknown>,
): Promise<ApproveRequestReturnType> {
  try {
    await deliverBridgeResponse({ bridgeURL, requestUUID, key }, payload);
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: new CodedError(
        ErrorsCode.BridgeFetchError,
        "Failed to fetch bridge request data",
      ),
    };
  }

  return { success: true };
}
