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
 * @param actionId The unique identifier for the action. This determines the scope of the proof. A single person cannot issue two proofs for the same action ID.
 * @param signal The signal that should be broadcasted.
 * @returns The Semaphore witness.
 */
function generateSemaphoreWitness(
  identityTrapdoor: StrBigInt,
  identityNullifier: StrBigInt,
  merkleProof: MerkleProof,
  actionId: StrBigInt,
  signal: string,
): SemaphoreWitness {
  return {
    identityNullifier: identityNullifier,
    identityTrapdoor: identityTrapdoor,
    treePathIndices: merkleProof.pathIndices,
    treeSiblings: merkleProof.siblings as StrBigInt[],
    externalNullifier: actionId,
    signalHash: signal,
  };
}

export const getFullProof = async (
  identity: Identity,
  merkleProof: MerkleProof,
  action_id: string,
  signal: string,
): Promise<SemaphoreFullProof> => {
  const wasmFilePath = "./semaphore.wasm";
  const finalZkeyPath = "./semaphore_final.zkey";

  const witness = generateSemaphoreWitness(
    identity.trapdoor,
    identity.nullifier,
    merkleProof,
    action_id, // Encoding & hashing happen on the widget (or delegated to the dapp upstream)
    signal, // Encoding & hashing happen on the widget (or delegated to the dapp upstream)
  );

  return await Semaphore.genProof(witness, wasmFilePath, finalZkeyPath);
};
