import { inclusionProof, insertIdentity } from "@/services/sequencer";
import type { Chain, CredentialType, InclusionProofResponse } from "@/types";
import type { NextApiRequest, NextApiResponse } from "next";

interface SequencerRequest extends NextApiRequest {
  body: {
    chain: Chain;
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
    const { chain, credentialType, commitment } = req.body;
    let data: InclusionProofResponse | Response;

    switch (endpoint) {
      case "inclusionProof":
        data = await inclusionProof(chain, credentialType, commitment);
        break;
      case "insertIdentity":
        data = await insertIdentity(chain, credentialType, commitment);
        break;
      default:
        return res.status(400).json({ error: "Invalid endpoint" });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
  }
  return res.status(204).end();
}
