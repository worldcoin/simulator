import { inclusionProof, insertIdentity } from "@/services/sequencer";
import type { CredentialType, InclusionProofResponse } from "@/types";
import type { NextApiRequest, NextApiResponse } from "next";

interface SequencerRequest extends NextApiRequest {
  body: {
    credentialType: CredentialType;
    commitment: string;
  };
}

export default async function handler(
  req: SequencerRequest,
  res: NextApiResponse,
) {
  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const requiredAttributes = ["chain", "credentialType", "commitment"];
  if (!requiredAttributes.every((attr) => attr in req.body)) {
    return res.status(400).json({ error: `Missing attribute in request body` });
  }

  try {
    const { endpoint } = req.query;
    const { credentialType, commitment } = req.body;
    let data: InclusionProofResponse | Response;

    switch (endpoint) {
      case "inclusionProof":
        data = await inclusionProof(credentialType, commitment);
        break;
      case "insertIdentity":
        data = await insertIdentity(credentialType, commitment);
        break;
      default:
        return res.status(400).json({ error: "Invalid endpoint" });
    }

    if (endpoint === "inclusionProof") res.status(200).json(data);
    if (endpoint === "insertIdentity") res.status(200).end();
  } catch (error) {
    console.error((error as Error).message);
  }
  return res.status(204).end();
}
