import { buffer_decode, encodeBigInt, encryptRequest } from "@/lib/utils";
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

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keyBuffer = buffer_decode(key);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );

  try {
    const result = await fetch(`${bridgeURL}/response/${requestUUID}`, {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(
        await encryptRequest(cryptoKey, iv, JSON.stringify(payload)),
      ),
    });

    if (!result.ok) {
      throw new Error(
        `Unable to set bridge request data, ${result.status}: ${result.statusText}`,
      );
    }
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
};
