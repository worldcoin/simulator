import { errorResponse } from "@/helpers/error-response";
import { validateRequestSchema } from "@/helpers/validate-request-schema";
import { parseWorldIDQRCode } from "@/lib/validation";
import type { CredentialType } from "@worldcoin/idkit-core/*";
import type { NextApiRequest, NextApiResponse } from "next";
import * as yup from "yup";

export type BridgeInitialData = {
  app_id: string;
  credential_types: CredentialType[];
  action_description: string;
  action: string;
  signal: string;
};

const schema = yup.object({
  url: yup.string().required(),
});

type BridgeRequestData = {
  iv: string;
  payload: string;
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return res.status(405).json({ error: "Method not allowed" });
  }

  //#region Validate request body
  const { parsedParams, isValid, handleError } = await validateRequestSchema({
    schema: schema,
    value: req.body,
  });

  if (!isValid) {
    return handleError(req, res);
  }

  const { valid, requestUUID, bridgeURL, key } = await parseWorldIDQRCode(
    parsedParams.url,
  );

  if (!valid) {
    return res.status(400).json({ error: "Invalid QR code" });
  }
  //#endregion

  //#region Fetch bridge request data
  let bridgeRequestData: BridgeRequestData | null = null;

  try {
    const response = await fetch(`${bridgeURL}/request/${requestUUID}`);
    bridgeRequestData = (await response.json()) as BridgeRequestData | null;

    if (!bridgeRequestData) {
      throw new Error("No bridge request data");
    }
  } catch (error) {
    console.error(error);

    return errorResponse({
      res,
      req,
      statusCode: 500,
      code: "server_error",
      detail: "Something went wrong. Please try again.",
      attribute: null,
    });
  }
  //#endregion

  //#region Decrypt bridge request data
  let decrypted: BridgeInitialData | null = null;

  try {
    const { iv, payload } = bridgeRequestData;
    const keyBuffer = Buffer.from(key, "base64");
    const ivBuffer = Buffer.from(iv, "base64");
    const payloadBuffer = Buffer.from(payload, "base64");

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

    decrypted = JSON.parse(decodedRaw) as BridgeInitialData | null;

    if (!decrypted) {
      throw new Error("No decrypted data");
    }
  } catch (error) {
    console.error(error);

    return errorResponse({
      res,
      req,
      statusCode: 500,
      code: "server_error",
      detail: "Something went wrong. Please try again.",
      attribute: null,
    });
  }
  //#endregion

  return res.status(200).json({
    ...decrypted,
  });
};

export default handler;
