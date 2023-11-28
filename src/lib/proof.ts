import { validateExternalNullifier, validateSignal } from "@/lib/validation";
import type { DecryptedPayload } from "@/pages/api/pair-client";
import type { Identity, Verification } from "@/types";
import { ProofError } from "@/types";
import { Group } from "@semaphore-protocol/group";
import { Identity as ZkIdentity } from "@semaphore-protocol/identity";
import { generateProof, verifyProof } from "@semaphore-protocol/proof";
import { internal } from "@worldcoin/idkit";

/**
 * Performs the Semaphore proof generation and verification process.
 * @param payload The app data from the bridge.
 * @param identity The current simulator identity.
 * @returns The full semaphore proof and its verification status.
 */
export const getFullProof = async (
  payload: DecryptedPayload,
  identity: Identity,
): Promise<Verification> => {
  try {
    // Validate inputs
    const signal = await validateSignal(payload.signal);

    // TODO: Replace with the newer version of idkit
    const rawExternalNullifier = internal.generateExternalNullifier(
      payload.app_id,
      payload.action,
    ).digest;

    const externalNullifier = await validateExternalNullifier(
      rawExternalNullifier,
    );

    const zkIdentity = new ZkIdentity(identity.zkIdentity);

    // Generate proofs
    const group = new Group(1, 30);
    group.addMember(zkIdentity.commitment);

    const fullProof = await generateProof(
      zkIdentity,
      group,
      externalNullifier,
      signal,
      {
        wasmFilePath: "/semaphore/semaphore.wasm",
        zkeyFilePath: "/semaphore/semaphore.zkey",
      },
    );

    // Verify the full proof
    const verified = await verifyProof(fullProof, 30);

    return { verified, fullProof, rawExternalNullifier };
  } catch (error) {
    console.error(error);
    if (error instanceof ProofError) {
      throw error;
    } else {
      throw new ProofError(-32602, "generic_error");
    }
  }
};
