import type { CredentialType, Identity, SignRequest } from "@/types";
import { ProofError } from "@/types";
import type { Identity as ZkIdentity } from "@semaphore-protocol/identity";
import type { FullProof } from "@semaphore-protocol/proof";
import { generateProof, verifyProof } from "@semaphore-protocol/proof";
// import type { MerkleProof } from "@zk-kit/incremental-merkle-tree";
import { Group } from "@semaphore-protocol/group";
import type {
  MerkleProof,
  SemaphoreFullProof,
  SemaphoreWitness,
  StrBigInt,
} from "@zk-kit/protocols";
import { Semaphore } from "@zk-kit/protocols";
import { defaultAbiCoder as abi } from "ethers/lib/utils";
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

    // DEBUG
    const proof = await getOldProof(
      identity,
      merkleProof,
      rawExternalNullifier,
      rawSignal,
    );
    const oldProof = abi.encode(
      ["unit256[8]"],
      [Semaphore.packToSolidityProof(proof.proof)],
    );
    console.log("🚀 ~ file: proof.ts:103 ~ oldProof:", oldProof);
    const newProof = abi.encode(["uint256[8]"], [fullProof.proof]);
    console.log("🚀 ~ file: proof.ts:105 ~ newProof:", newProof);

    // Verify the full proof
    const verified = await verifyProof(fullProof, 30);
    console.log("🚀 ~ file: proof.ts:91 ~ verified:", verified);
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

export const getOldProof = async (
  identity: Identity,
  merkleProof: MerkleProof,
  external_nullifier: string,
  signal: string,
): Promise<SemaphoreFullProof> => {
  const wasmFilePath = "./semaphore/semaphore.wasm";
  const finalZkeyPath = "./semaphore/semaphore.zkey";

  const witness = generateSemaphoreWitness(
    identity.trapdoor,
    identity.nullifier,
    merkleProof,
    external_nullifier, // Encoding & hashing happens on the widget
    signal, // Encoding & hashing happens on the widget
  );

  return await Semaphore.genProof(witness, wasmFilePath, finalZkeyPath);
};
