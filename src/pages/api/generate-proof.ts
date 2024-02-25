import { validateRequestSchema } from "@/helpers/validate-request-schema";
import { packProof } from "@/lib/proof";
import { encode, encodeBigInt, generateExternalNullifier } from "@/lib/utils";
import { inclusionProof } from "@/services/sequencer";
import type { InclusionProofResponse } from "@/types";
import { Identity as ZkIdentity } from "@semaphore-protocol/identity";
import type { CredentialType, VerificationLevel } from "@worldcoin/idkit-core";
import { generateSignal } from "@worldcoin/idkit-core/hashing";
import type { MerkleProof } from "@zk-kit/incremental-merkle-tree";
import { promises as fs } from "fs";
import type { NextApiResponse } from "next";
import { type NextApiRequest } from "next";
import path from "path";
import type { Groth16Proof } from "snarkjs";
import { groth16 } from "snarkjs";
import { encodePacked } from "viem";
import * as yup from "yup";

type ProofRequest = {
  identityIndex?: string;
  verificationLevel?: VerificationLevel;
  app_id: `app_staging_${string}`;
  action?: string;
  signal?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const schema = yup.object({
    identityIndex: yup.string().default("1"),
    verificationLevel: yup.string().oneOf(["orb", "device"]).default("orb"),
    app_id: yup
      .string()
      .required()
      .test("app_id", "app_id must start with app_staging_", (value) =>
        value.startsWith("app_staging_"),
      ),
    action: yup.string().default(""),
    signal: yup.string().default(""),
  });

  const { identityIndex, verificationLevel, app_id, action, signal } =
    req.body as ProofRequest;

  const { parsedParams, isValid, errorMessage } = await validateRequestSchema({
    schema,
    value: { identityIndex, verificationLevel, app_id, action, signal },
  });

  if (!isValid) {
    return res.status(400).json({ error: errorMessage });
  }

  const zkIdentity = new ZkIdentity(parsedParams.identityIndex);
  const encodedCommitment = encode(zkIdentity.commitment);
  const inclProof: InclusionProofResponse = await inclusionProof(
    parsedParams.verificationLevel as string as CredentialType,
    encodedCommitment,
  );

  if (!inclProof.proof) {
    return res.status(400).json({ error: "Inclusion proof not found" });
  }

  const merkleProof: MerkleProof = {
    root: null,
    leaf: null,
    siblings: inclProof.proof
      .flatMap((v) => Object.values(v))
      .map((v) => BigInt(v)),

    pathIndices: inclProof.proof
      .flatMap((v) => Object.keys(v))
      .map((v) => (v == "Left" ? 0 : 1)),
  };

  const wasm = (await fs.readFile(
    path.join(process.cwd(), "/public/semaphore/semaphore.wasm"),
  )) as Uint8Array;
  const zkey = (await fs.readFile(
    path.join(process.cwd(), "/public/semaphore/semaphore.zkey"),
  )) as Uint8Array;

  const { proof, publicSignals } = (await groth16.fullProve(
    {
      identityTrapdoor: zkIdentity.trapdoor,
      identityNullifier: zkIdentity.nullifier,
      treePathIndices: merkleProof.pathIndices,
      treeSiblings: merkleProof.siblings,
      externalNullifier: generateExternalNullifier(
        parsedParams.app_id as `app_${string}`,
        parsedParams.action,
      ).hash,
      signalHash: generateSignal(parsedParams.signal).hash,
    },
    wasm,
    zkey,
  )) as { proof: Groth16Proof; publicSignals: string[] };

  const params = {
    proof: packProof(proof),
    merkle_root: publicSignals[0],
    nullifier_hash: publicSignals[1],
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
    verificationLevel,
  };

  return res.json(payload);
}
