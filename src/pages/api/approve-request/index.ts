import { errorResponse } from "@/helpers/error-response";
import { validateRequestSchema } from "@/helpers/validate-request-schema";
import { CommonValidationMessage } from "@/lib/constants";
import { parseWorldIDQRCode } from "@/lib/validation";
import { CredentialType } from "@worldcoin/idkit-core";
import type { NextApiRequest, NextApiResponse } from "next";
import * as yup from "yup";

//#region Utils
const hexify = (value: string) => {
  return `0x${BigInt(value).toString(16)}`;
};

const buffer_encode = (buffer: ArrayBuffer): string => {
  return Buffer.from(buffer).toString("base64");
};

const buffer_decode = (encoded: string): ArrayBuffer => {
  return Buffer.from(encoded, "base64");
};

const encryptRequest = async (
  key: CryptoKey,
  iv: ArrayBuffer,
  request: string,
): Promise<{ payload: string; iv: string }> => {
  const encoder = new TextEncoder();

  return {
    iv: buffer_encode(iv),
    payload: buffer_encode(
      await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        encoder.encode(request),
      ),
    ),
  };
};
//#endregion

//#region schema
const schema = yup.object({
  url: yup.string().required(CommonValidationMessage.Required),
  payload: yup
    .object({
      proof: yup
        .tuple([
          yup.string().required(CommonValidationMessage.Required),
          yup.string().required(CommonValidationMessage.Required),
          yup.string().required(CommonValidationMessage.Required),
          yup.string().required(CommonValidationMessage.Required),
          yup.string().required(CommonValidationMessage.Required),
          yup.string().required(CommonValidationMessage.Required),
          yup.string().required(CommonValidationMessage.Required),
          yup.string().required(CommonValidationMessage.Required),
        ])
        .required(),
      merkle_root: yup.string().required(CommonValidationMessage.Required),
      nullifier_hash: yup.string().required(CommonValidationMessage.Required),

      credential_type: yup
        .array(
          yup
            .string()
            .oneOf(
              Object.values(CredentialType),
              `credential_type must be one of [${Object.values(
                CredentialType,
              ).join(", ")}]`,
            )
            .required(CommonValidationMessage.Required),
        )
        .required(CommonValidationMessage.Required),
    })
    .required(CommonValidationMessage.Required),
});

export type ApproveRequestBody = yup.InferType<typeof schema>;
//#endregion

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

  //#region Format payload
  // REVIEW: ❗❗❗ How to stringify proof?
  const proofString = hexify(parsedParams.payload.proof.join(""));
  const merkleRootString = hexify(parsedParams.payload.merkle_root);
  const nullifierHashString = hexify(parsedParams.payload.nullifier_hash);

  const payload = {
    proof: proofString,
    merkle_root: merkleRootString,
    nullifier_hash: nullifierHashString,
    credential_type: parsedParams.payload.credential_type,
  };
  //#endregion

  //#region Fetch PUT /{bridge_url}/response/{request_id}
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
    const result = await fetch(`${bridgeURL}/request/${requestUUID}`, {
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

    // TODO: handle success response from bridge [currently it's 405 method not allowed]
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

  res.status(200).json({ success: true });
};

export default handler;
