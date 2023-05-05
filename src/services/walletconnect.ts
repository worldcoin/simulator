import type { Identity } from "@/types";
import type { VerificationRequest } from "@/types/metadata";
import Client from "@walletconnect/sign-client";
import type { SignClientTypes } from "@walletconnect/types";
import { getSdkError } from "@walletconnect/utils";
import { ErrorCodes } from "@worldcoin/id";
import type { MerkleProof, SemaphoreFullProof } from "@zk-kit/protocols";
import { defaultAbiCoder as abi } from "ethers/lib/utils";
import { getFullProof } from "../lib/get-full-proof";
import { getMerkleProof } from "../lib/get-merkle-proof";
import { fetchApprovalRequestMetadata } from "../lib/get-metadata";

export interface WalletConnectRequest extends VerificationRequest {
  code?: string;
}

export async function connectWallet({
  uri,
  identity,
}: {
  uri: string;
  identity: Identity;
}): Promise<{
  client: Client;
  proposal: SignClientTypes.EventArguments["session_proposal"];
  request: SignClientTypes.EventArguments["session_request"];
  meta: Awaited<ReturnType<typeof fetchApprovalRequestMetadata>>;
  merkleProof: MerkleProof;
  fullProof: SemaphoreFullProof;
}> {
  // we don't want persistent sessions
  const STORAGE_KEY = "walletconnect-worldid-check";
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}

  const client = await Client.init({
    projectId: process.env.WALLETCONNECT_PID,
    metadata: {
      name: "World ID Simulator",
      description: "The simulator for testing verification with World ID.",
      url: "https://id.worldcoin.org/test",
      icons: ["https://worldcoin.org/icons/logo-small.svg"],
    },
  });

  client.on("session_proposal", async (event) => {
    const { acknowledged } = await client.approve({
      id: event.id,
      namespaces: {
        eip155: {
          accounts: ["eip155:1:0"],
          methods: ["world_id_v1"],
          events: ["accountsChanged"],
        },
      },
    });

    await acknowledged();
  });

  await client.core.pairing.pair({ uri });

  const _disconnectSessionOnUnloadPromise = async () => {
    if (sessionProposal.params.pairingTopic) {
      await client.disconnect({
        topic: sessionProposal.params.pairingTopic,
        reason: getSdkError("USER_DISCONNECTED"),
      });
    }
  };

  const disconnectSessionOnUnload = () =>
    void _disconnectSessionOnUnloadPromise();

  window.addEventListener("beforeunload", disconnectSessionOnUnload);

  // we should immediately receive session request from SDK
  const sessionProposal = await new Promise<
    SignClientTypes.EventArguments["session_proposal"]
  >((resolve) =>
    client.on("session_proposal", (event) => {
      resolve(event);
    }),
  );

  // we should immediately approve session on connection and expect receive call request from SDK
  const sessionRequest = await new Promise<
    SignClientTypes.EventArguments["session_request"]
  >((resolve) =>
    client.on("session_request", (event) => {
      resolve(event);
    }),
  );

  window.removeEventListener("beforeunload", disconnectSessionOnUnload);

  // validate method
  if (sessionRequest.params.request.method !== "world_id_v1") {
    console.error(
      "Unknown request method:",
      sessionRequest.params.request.method,
    );
    await client.reject({
      id: sessionRequest.id,
      reason: {
        code: -32601,
        message: "method_not_found",
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (sessionProposal.params.pairingTopic) {
      await client.disconnect({
        topic: sessionProposal.params.pairingTopic,
        reason: getSdkError("USER_DISCONNECTED"),
      });
    }
    throw new TypeError(
      `Unsupported request method: ${sessionRequest.params.request.method}`,
    );
  }

  const validateSignal = async () => {
    try {
      const params = sessionRequest.params.request.params as Record<
        string,
        string
      >[];
      BigInt(params[0].signal);
      return params[0].signal;
    } catch (error) {
      console.error(error);
      await client.respond({
        topic: sessionRequest.topic,
        response: {
          id: sessionRequest.id,
          jsonrpc: "2.0",
          error: {
            code: -32602,
            message: ErrorCodes.InvalidSignal,
          },
        },
      });
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (sessionProposal.params.pairingTopic) {
        await client.disconnect({
          topic: sessionProposal.params.pairingTopic,
          reason: getSdkError("USER_DISCONNECTED"),
        });
      }
      throw error;
    }
  };

  const validateExternalNullifier = async () => {
    try {
      const params = sessionRequest.params.request.params as Record<
        string,
        string
      >[];
      BigInt(params[0].external_nullifier);
      return params[0].external_nullifier;
    } catch (error) {
      console.error(error);
      await client.respond({
        topic: sessionRequest.topic,
        response: {
          id: sessionRequest.id,
          jsonrpc: "2.0",
          error: {
            code: -32602,
            message: "invalid_app_id", // ErrorCodes.InvalidActionID // TODO: Need to update ErrorCodes in @worldcoin/id
          },
        },
      });
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (sessionProposal.params.pairingTopic) {
        await client.disconnect({
          topic: sessionProposal.params.pairingTopic,
          reason: getSdkError("USER_DISCONNECTED"),
        });
      }
      throw error;
    }
  };

  const _rejectRequestPromise = async () => {
    await client.reject({
      id: sessionRequest.id,
      reason: {
        code: -32100,
        message: ErrorCodes.VerificationRejected,
      },
    });
  };

  const rejectRequest = () => void _rejectRequestPromise();

  window.addEventListener("beforeunload", rejectRequest);
  client.on("session_delete", () => {
    window.removeEventListener("beforeunload", rejectRequest);
  });

  const merkleProof = getMerkleProof(identity);
  const fullProof = await getFullProof(
    identity,
    merkleProof,
    await validateExternalNullifier(),
    await validateSignal(),
  );
  const nullifierHash = abi.encode(
    ["uint256"],
    [fullProof.publicSignals.nullifierHash],
  );

  const meta = await fetchApprovalRequestMetadata(
    sessionRequest.params.request as WalletConnectRequest,
    nullifierHash,
  );

  return {
    client,
    proposal: sessionProposal,
    request: sessionRequest,
    meta,
    merkleProof,
    fullProof,
  };
}
