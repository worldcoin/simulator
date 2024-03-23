import { inclusionProof, insertIdentity } from "@/services/sequencer";
import type { InclusionProofResponse } from "@/types";
import type { VerificationLevel } from "@worldcoin/idkit-core";
import type { NextApiRequest, NextApiResponse } from "next";

interface SequencerRequest extends NextApiRequest {
  body: {
    verificationLevel: VerificationLevel;
    commitment: string;
  };
}

export default async function handler(
  req: SequencerRequest,
  res: NextApiResponse,
) {
  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const requiredAttributes = ["verificationLevel", "commitment"];
  if (!requiredAttributes.every((attr) => attr in req.body)) {
    return res.status(400).json({ error: `Missing attribute in request body` });
  }

  try {
    const { endpoint } = req.query;
    const { verificationLevel, commitment } = req.body;
    let data: InclusionProofResponse | Response;

    switch (endpoint) {
      case "inclusionProof":
        data = await inclusionProof(verificationLevel, commitment);
        return res.status(200).json(data);
      case "insertIdentity":
        data = await insertIdentity(verificationLevel, commitment);
        return res.status(200).end();
      default:
        return res.status(400).json({ error: "Invalid endpoint" });
    }
  } catch (error) {
    console.error((error as Error).message);
  }
  return res.status(204).end();
}
