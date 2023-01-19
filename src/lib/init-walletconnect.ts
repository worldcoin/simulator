import type { Identity } from "@/types";
import { defaultAbiCoder as abi } from "@ethersproject/abi";
import Client from "@walletconnect/sign-client";
import type { SignClientTypes } from "@walletconnect/types";
import { getSdkError } from "@walletconnect/utils";
import type { VerificationRequest } from "@worldcoin/id";
import { ErrorCodes } from "@worldcoin/id";
import type { MerkleProof, SemaphoreFullProof } from "@zk-kit/protocols";
import { getFullProof } from "./get-full-proof";
import { getMerkleProof } from "./get-merkle-proof";
import { fetchApprovalRequestMetadata } from "./get-metadata";
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
      description: "The simulator for testing the Orb credential in World ID.",
      url: "https://id.worldcoin.org/test",
      icons: ["https://worldcoin.org/icons/logo-small.svg"],
    },
  });

  client.on("session_proposal", async (event) => {
    const { acknowledged } = await client.approve({
      id: event.id,
      namespaces: {
        eip155: {
          accounts: ["eip155:0:0"],
          methods: ["wld_worldIDVerification"],
          events: ["chainChanged", "accountsChanged"],
        },
      },
    });

    await acknowledged();
  });

  // client.on("session_event", (event) => {
  //   console.log("session_event:", event);
  // });

  // client.on("session_request", (event) => {
  //   console.log("session_request:", event);
  // });

  // client.on("session_ping", (event) => {
  //   console.log("session_ping:", event);
  // });

  // client.on("session_delete", (event) => {
  //   console.log("session_delete:", event);
  // });

  await client.core.pairing.pair({ uri });

  const _disconnectSessionOnUnloadPromise = async () => {
    if (sessionProposal.params.pairingTopic)
      await client.disconnect({
        topic: sessionProposal.params.pairingTopic,
        reason: getSdkError("USER_DISCONNECTED"),
      });
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

  console.log("WalletConnect connected");

  // validate method
  if (sessionRequest.params.request.method !== "wld_worldIDVerification") {
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

  const validateActionId = async () => {
    try {
      const params = sessionRequest.params.request.params as Record<
        string,
        string
      >[];
      BigInt(params[0].action_id);
      return params[0].action_id;
    } catch (error) {
      console.error(error);
      await client.respond({
        topic: sessionRequest.topic,
        response: {
          id: sessionRequest.id,
          jsonrpc: "2.0",
          error: {
            code: -32602,
            message: ErrorCodes.InvalidActionID,
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
    await validateActionId(), // callRequestPayload.params.request.params[0].action_id as string,
    await validateSignal(), // callRequestPayload.params.request.params[0].signal as string,
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
