import type { Identity } from "@/types";
import { internal } from "@worldcoin/idkit";
import type { MerkleProof, SemaphoreFullProof } from "@zk-kit/protocols";
import { defaultAbiCoder as abi } from "ethers/lib/utils";
import { getFullProof } from "./get-full-proof";
import { getMerkleProof } from "./get-merkle-proof";
import { fetchApprovalRequestMetadata } from "./get-metadata";

export async function connectBridge({
  uri,
  identity,
}: {
  uri: string;
  identity: Identity;
}): Promise<{
  meta: Awaited<ReturnType<typeof fetchApprovalRequestMetadata>>;
  merkleProof: MerkleProof;
  fullProof: SemaphoreFullProof;
}> {
  const params: {
    key: string;
    app_id: string;
    action: string;
    signal?: string;
    credential_types?: string;
    action_description?: string;
  } = Object.fromEntries(new URLSearchParams(uri.split("?")[1]).entries());

  const merkleProof = getMerkleProof(identity);

  const fullProof = await getFullProof(
    identity,
    merkleProof,
    internal.generateExternalNullifier(params.app_id, params.action).digest,
    params.signal!,
  );
  console.log({ fullProof });
  const nullifierHash = abi.encode(
    ["uint256"],
    [fullProof.publicSignals.nullifierHash],
  );

  const meta = await fetchApprovalRequestMetadata(
    {
      app_id: params.app_id,
      action: params.action,
      signal: params.signal!,
      action_description: params.action_description,
      external_nullifier: internal.generateExternalNullifier(
        params.app_id,
        params.action,
      ).digest,
    },
    nullifierHash,
  );

  return { meta, merkleProof, fullProof };
}
