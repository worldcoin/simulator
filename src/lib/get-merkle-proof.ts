import type { Identity } from "@/types";
import type { MerkleProof } from "@zk-kit/protocols";
import { BigNumber } from "ethers";

// FIXME
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
const { generateMerkleProof } = require("@zk-kit/protocols");

export const getMerkleProof = (identity: Identity): MerkleProof => {
  if (identity.inclusionProof?.proof) {
    const siblings = identity.inclusionProof.proof
      .flatMap((v) => Object.values(v))
      .map((v) => BigNumber.from(v).toBigInt());

    const pathIndices = identity.inclusionProof.proof
      .flatMap((v) => Object.keys(v))
      .map((v) => (v == "Left" ? 0 : 1));

    return {
      root: null,
      leaf: null,
      siblings: siblings,
      pathIndices: pathIndices,
    };
  }

  // Generate a dummy/empty proof so dev can go through a failure case
  console.warn(
    "Identity inclusion Merkle proof was not present, using dummy proof. Smart contract will reject identity. Use only to test failure use case.",
  );
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
  return generateMerkleProof(
    20,
    BigInt(0),
    [identity.commitment],
    identity.commitment,
  );
};
