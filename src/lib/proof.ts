import type { CredentialType, Identity, SignRequest } from "@/types";
import { ProofError } from "@/types";
import { Group } from "@semaphore-protocol/group";
import type { Identity as ZkIdentity } from "@semaphore-protocol/identity";
import type { FullProof } from "@semaphore-protocol/proof";
import { generateProof, verifyProof } from "@semaphore-protocol/proof";
import type { MerkleProof } from "@zk-kit/incremental-merkle-tree";
import { validateExternalNullifier, validateSignal } from "./validation";

export function getMerkleProof(
  identity: Identity,
  credentialType: CredentialType,
): MerkleProof {
  // Identity has inclusion proof from sequencer
  if (identity.inclusionProof[credentialType]?.proof) {
    const siblings = identity.inclusionProof[credentialType]?.proof
      .flatMap((v) => Object.values(v))
      .map((v) => BigInt(v));

    const pathIndices = identity.inclusionProof[credentialType]?.proof
      .flatMap((v) => Object.keys(v))
      .map((v) => (v == "Left" ? 0 : 1));

    return {
      root: null,
      leaf: null,
      siblings: siblings,
      pathIndices: pathIndices,
    } as MerkleProof;
  }

  // TODO: Reevaluate if the dummy proof case is needed
  // Generate a dummy proof for testing against error cases
  console.warn(
    "Identity inclusion proof was not found, using dummy proof. Only use this to test failure cases!",
  );
  const group = new Group(1, 30);
  group.addMember(identity.commitment);
  return group.generateMerkleProof(0);
}

export async function getFullProof(
  identity: Identity,
  merkleProof: MerkleProof,
  externalNullifier: bigint,
  signal: bigint,
): Promise<FullProof> {
  const zkIdentity = {
    trapdoor: identity.trapdoor,
    nullifier: identity.nullifier,
    commitment: identity.commitment,
  } as ZkIdentity;

  return await generateProof(
    zkIdentity,
    merkleProof,
    externalNullifier,
    signal,
    {
      zkeyFilePath: "/semaphore/semaphore.zkey",
      wasmFilePath: "/semaphore/semaphore.wasm",
    },
  );
}

export async function verifySemaphoreProof(
  request: SignRequest,
  identity: Identity,
  credentialType: CredentialType,
) {
  const { signal: rawSignal, external_nullifier: rawExternalNullifier } =
    request.params[0];
  try {
    // Validate inputs
    const signal = await validateSignal(rawSignal);
    console.log("🚀 ~ file: proof.ts:76 ~ signal:", signal);
    console.log("🚀 ~ file: proof.ts:76 ~ rawSignal:", rawSignal);
    const externalNullifier = await validateExternalNullifier(
      rawExternalNullifier,
    );

    // Generate proofs
    const merkleProof = getMerkleProof(identity, credentialType);
    const fullProof = await getFullProof(
      identity,
      merkleProof,
      externalNullifier,
      signal,
    );

    // Verify the full proof
    const verified = await verifyProof(fullProof, 30);
    return { verified, fullProof };
  } catch (error) {
    console.error(error);
    if (error instanceof ProofError) {
      throw error;
    } else {
      throw new ProofError(-32602, "generic_error");
    }
  }
}
