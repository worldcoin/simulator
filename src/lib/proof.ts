import type { Identity } from "@/types";
import { Group } from "@semaphore-protocol/group";
import type { Identity as ZkIdentity } from "@semaphore-protocol/identity";
import type { FullProof } from "@semaphore-protocol/proof";
import { generateProof } from "@semaphore-protocol/proof";
import type { MerkleProof } from "@zk-kit/incremental-merkle-tree";

export function getMerkleProof(identity: Identity): MerkleProof {
  // Identity has inclusion proof from sequencer
  if (identity.inclusionProof?.proof) {
    const siblings = identity.inclusionProof.proof
      .flatMap((v) => Object.values(v))
      .map((v) => BigInt(v));

    const pathIndices = identity.inclusionProof.proof
      .flatMap((v) => Object.keys(v))
      .map((v) => (v == "Left" ? 0 : 1));

    return {
      root: null,
      leaf: null,
      siblings: siblings,
      pathIndices: pathIndices,
    } as MerkleProof;
  }

  // Generate a dummy proof for testing against error cases
  console.warn(
    "Identity inclusion proof was not found, using dummy proof. Only use this to test failure cases!",
  );
  const group = new Group(1);
  group.addMember(identity.commitment);
  return group.generateMerkleProof(0);
}

export async function getFullProof(
  identity: Identity,
  merkleProof: MerkleProof,
  externalNullifier: string,
  signal: string,
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
    { zkeyFilePath: "./semaphore.zkey", wasmFilePath: "./semaphore.wasm" },
  );
}
