import {
  buffer_decode,
  encodeBigInt,
  encryptRequest,
  handleError,
} from "@/lib/utils";
import { parseWorldIDQRCode } from "@/lib/validation";
import type { BridgeServiceReturnType, FP } from "@/types";
import type { CredentialType } from "@worldcoin/idkit-core";
import { encodePacked } from "viem";

type Props = {
  url: string;
  fullProof: FP;
  credentialType: CredentialType;
};

type ApproveRequestReturnType = BridgeServiceReturnType;

export const approveRequest = async ({
  url,
  fullProof,
  credentialType,
}: Props): Promise<ApproveRequestReturnType> => {
  const { valid, requestUUID, bridgeURL, key } = await parseWorldIDQRCode(url);

  if (!valid) {
    return {
      success: false,
      error: handleError({ message: "Invalid QR code" }),
    };
  }

  const params = {
    proof: fullProof.proof,
    merkle_root: fullProof.merkleTreeRoot,
    nullifier_hash: fullProof.nullifierHash,
    // NOTE: we are adding this to the payload when user selects a credential type on modal
    credentialType,
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
    credential_type: params.credentialType,
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
        `Unable to fetch bridge request data, ${result.status}: ${result.statusText}`,
      );
    }
  } catch (error) {
    return {
      success: false,
      error: handleError({
        error,
        message: "Failed to fetch bridge request data",
      }),
    };
  }

  return { success: true };
};
