import type { Identity } from "@/types";
import type {
  MerkleProof,
  SemaphoreFullProof,
  SemaphoreWitness,
  StrBigInt,
} from "@zk-kit/protocols";
import { Semaphore } from "@zk-kit/protocols";

/**
 * Creates a Semaphore witness for the Semaphore ZK proof.
 * '@zk-kit/protocols' witness implementation expects a bytes32 strings,
 * while both our contract and the SDK work with bytes.
 *
 * @param identityTrapdoor The identity trapdoor.
 * @param identityNullifier The identity nullifier.
 * @param merkleProof The Merkle proof that identity exists in Merkle tree of verified identities.
 * @param externalNullifier The hash of the app_id and action parameter.  This determines the scope of the proof.
 * @param signal The signal that should be broadcasted.
 * @returns The Semaphore witness.
 */
function generateSemaphoreWitness(
  identityTrapdoor: StrBigInt,
  identityNullifier: StrBigInt,
  merkleProof: MerkleProof,
  externalNullifier: StrBigInt,
  signal: string,
): SemaphoreWitness {
  return {
    identityNullifier: identityNullifier,
    identityTrapdoor: identityTrapdoor,
    treePathIndices: merkleProof.pathIndices,
    treeSiblings: merkleProof.siblings as StrBigInt[],
    externalNullifier,
    signalHash: signal,
  };
}

export const getFullProof = async (
  identity: Identity,
  merkleProof: MerkleProof,
  external_nullifier: string,
  signal: string,
): Promise<SemaphoreFullProof> => {
  const wasmFilePath = "./semaphore.wasm";
  const finalZkeyPath = "./semaphore_final.zkey";

  const witness = generateSemaphoreWitness(
    identity.trapdoor,
    identity.nullifier,
    merkleProof,
    external_nullifier, // Encoding & hashing happens on the widget
    signal, // Encoding & hashing happens on the widget
  );

  return Semaphore.genProof(witness, wasmFilePath, finalZkeyPath);
};
