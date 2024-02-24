import verificationKeys from "@/public/semaphore/verification_key.json";
import type { BridgeInitialData, FP, Verification } from "@/types";
import { CodedError, type Identity } from "@/types";
import { Group } from "@semaphore-protocol/group";
import { Identity as ZkIdentity } from "@semaphore-protocol/identity";
import type { CredentialType } from "@worldcoin/idkit-core";
import type { MerkleProof } from "@zk-kit/incremental-merkle-tree";
import type { Groth16Proof, NumericString } from "snarkjs";
import { groth16 } from "snarkjs";
import { generateExternalNullifier } from "./utils";
import { validateExternalNullifier, validateSignal } from "./validation";

/**
 * Packs a proof into a format compatible with Semaphore.
 * @param originalProof The proof generated with SnarkJS.
 * @returns The proof compatible with Semaphore.
 */
export function packProof(originalProof: Groth16Proof): NumericString[] {
  return [
    originalProof.pi_a[0],
    originalProof.pi_a[1],
    originalProof.pi_b[0][1],
    originalProof.pi_b[0][0],
    originalProof.pi_b[1][1],
    originalProof.pi_b[1][0],
    originalProof.pi_c[0],
    originalProof.pi_c[1],
  ];
}

/**
 * Unpacks a proof into its original form.
 * @param proof The proof compatible with Semaphore.
 * @returns The proof compatible with SnarkJS.
 */
function unpackProof(proof: NumericString[]): Groth16Proof {
  return {
    pi_a: [proof[0], proof[1]],
    pi_b: [
      [proof[3], proof[2]],
      [proof[5], proof[4]],
    ],
    pi_c: [proof[6], proof[7]],
    protocol: "groth16",
    curve: "bn128",
  };
}

/**
 * Generates a Semaphore proof.
 * World ID overridden to avoid double hashing the external nullifier and signal hash.
 * @param identity The Semaphore identity.
 * @param groupOrMerkleProof The Semaphore group or its Merkle proof.
 * @param externalNullifier The external nullifier.
 * @param signal The Semaphore signal.
 * @param snarkArtifacts The SNARK artifacts.
 * @returns The Semaphore proof ready to be verified.
 */
export async function generateSemaphoreProof(
  { trapdoor, nullifier, commitment }: ZkIdentity,
  groupOrMerkleProof: Group | MerkleProof,
  externalNullifier: bigint,
  signal: bigint,
): Promise<FP> {
  let merkleProof: MerkleProof;

  if ("depth" in groupOrMerkleProof) {
    const index = groupOrMerkleProof.indexOf(commitment);

    if (index === -1) {
      throw new Error("The identity is not part of the group");
    }

    merkleProof = groupOrMerkleProof.generateMerkleProof(index);
  } else {
    merkleProof = groupOrMerkleProof;
  }

  const { proof, publicSignals } = (await groth16.fullProve(
    {
      identityTrapdoor: trapdoor,
      identityNullifier: nullifier,
      treePathIndices: merkleProof.pathIndices,
      treeSiblings: merkleProof.siblings,
      externalNullifier: externalNullifier,
      signalHash: signal,
    },
    "/semaphore/semaphore.wasm",
    "/semaphore/semaphore.zkey",
  )) as { proof: Groth16Proof; publicSignals: string[] };

  return {
    merkleTreeRoot: publicSignals[0],
    nullifierHash: publicSignals[1],
    signal,
    externalNullifier,
    proof: packProof(proof),
  };
}

/**
 * Verifies a Semaphore proof.
 * @param fullProof The SnarkJS Semaphore proof.
 * @param treeDepth The Merkle tree depth.
 * @returns True if the proof is valid, false otherwise.
 */
async function verifySemaphoreProof(
  { merkleTreeRoot, nullifierHash, externalNullifier, signal, proof }: FP,
  treeDepth: number,
): Promise<boolean> {
  if (treeDepth < 16 || treeDepth > 32) {
    throw new TypeError("The tree depth must be a number between 16 and 32");
  }

  const verificationKey = {
    ...verificationKeys,
    vk_delta_2: verificationKeys.vk_delta_2[treeDepth - 16],
    IC: verificationKeys.IC[treeDepth - 16],
  };

  return groth16.verify(
    verificationKey,
    [merkleTreeRoot, nullifierHash, signal, externalNullifier] as [
      string,
      string,
      string,
      string,
    ],

    unpackProof(proof),
  );
}

/**
 * Transforms an inclusion proof into the Merkle proof format.
 * @param identity The current simulator identity.
 * @param credentialType The credential type to generate the proof for.
 * @returns The Merkle proof of inclusion.
 */
export function getMerkleProof(
  identity: Identity,
  credentialType: CredentialType,
): MerkleProof {
  console.log("identity", identity);
  const proofs = identity.inclusionProof;
  if (!proofs) {
    throw new Error("Inclusion proof not found");
  }
  const proof = proofs[credentialType]?.proof;
  // Identity has inclusion proof from sequencer
  if (proof) {
    const siblings = proof
      .flatMap((v) => Object.values(v))
      .map((v) => BigInt(v));

    const pathIndices = proof
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
  console.warn("Identity inclusion proof was not found, using dummy proof");
  return generateDummyMerkleProof(identity);
}

/**
 * Generates a dummy proof for testing failure cases. The root is invalid since it's a new tree but the proof verifies.
 * @param identity The current simulator identity.
 * @returns The proof compatible with SnarkJS.
 */
export function generateDummyMerkleProof(identity: Identity): MerkleProof {
  console.warn("Only use this to test failure cases!");
  const group = new Group(1, 30);
  const zkIdentity = new ZkIdentity(identity.zkIdentity);
  group.addMember(zkIdentity.commitment);
  return group.generateMerkleProof(0);
}

/**
 * Performs the Semaphore proof generation and verification process.
 * @param request The session request from WalletConnect.
 * @param identity The current simulator identity.
 * @param credentialType The credential type to generate the proof for.
 * @returns The full semaphore proof and its verification status.
 */
export const getFullProof = async (
  bridgeInitialData: Omit<BridgeInitialData, "credential_type"> & {
    credential_type: CredentialType;
  },
  identity: Identity,
  merkleProof: MerkleProof,
): Promise<Verification> => {
  try {
    // Validate inputs
    const signal = await validateSignal(bridgeInitialData.signal);

    const rawExternalNullifier = generateExternalNullifier(
      bridgeInitialData.app_id,
      bridgeInitialData.action,
    ).digest;

    const externalNullifier = await validateExternalNullifier(
      rawExternalNullifier,
    );

    const zkIdentity = new ZkIdentity(identity.zkIdentity);

    const fullProof = await generateSemaphoreProof(
      zkIdentity,
      merkleProof,
      externalNullifier,
      signal,
    );
    // Verify the full proof
    const verified = await verifySemaphoreProof(fullProof, 30);
    return { verified, fullProof };
  } catch (error) {
    console.error(error);
    if (error instanceof CodedError) {
      throw error;
    } else {
      throw new CodedError(-32602, "generic_error");
    }
  }
};
