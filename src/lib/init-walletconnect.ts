/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import type { Identity } from "@/types";
import { defaultAbiCoder as abi } from "@ethersproject/abi";
import Client from "@walletconnect/sign-client";
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
  client: Client | undefined;
  request;
  meta: Awaited<ReturnType<typeof fetchApprovalRequestMetadata>>;
  merkleProof: MerkleProof;
  fullProof: SemaphoreFullProof;
}> {
  console.log("uri:", uri);
  console.log("identity:", identity);

  // we don't want persistent sessions
  const STORAGE_KEY = "walletconnect-worldid-check";
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}

  // TODO: Move metadata to .env vars
  const client = await Client.init({
    projectId: "519e139c1286fc1d35acfc4e526b5ba6",
    metadata: {
      name: "World ID Simulator",
      description: "The staging simulator for testing World ID",
      url: "http://worldcoin.org/verify",
      icons: ["https://worldcoin.org/icons/logo-small.svg"],
    },
  });

  console.log("client:", client); // DEBUG

  client.on("session_proposal", async (event) => {
    console.log("session_proposal:", event);

    const { topic, acknowledged } = await client.approve({
      id: event.id,
      namespaces: {
        eip155: {
          accounts: ["eip155:0:0"],
          methods: ["wld_worldIDVerification"],
          events: ["chainChanged", "accountsChanged"],
        },
      },
    });

    console.log("topic:", topic);

    const session = await acknowledged();
    console.log("session:", session);
  });

  client.on("session_event", (event) => {
    console.log("session_event:", event);
  });

  client.on("session_request", (event) => {
    console.log("session_request:", event);
  });

  client.on("session_ping", (event) => {
    console.log("session_ping:", event);
  });

  client.on("session_delete", (event) => {
    console.log("session_delete:", event);
  });

  await client.core.pairing.pair({ uri });

  // we should immediately receive session request from SDK
  // const sessionRequestPayload = await new Promise<ISessionParams>(
  //   (resolve, reject) =>
  //     connector.on(
  //       "session_request",
  //       (error: Error | null, payload: { params: ISessionParams[] }) => {
  //         console.log("EVENT", "session_request");
  //         if (error) return reject(error);
  //         console.log("SESSION_REQUEST", payload.params);
  //         resolve(payload.params[0]);
  //       },
  //     ),
  // );

  const disconnectSessionOnUnload = () => {
    console.log("disconnectSessionOnUnload()");
    if (client)
      client.disconnect({
        topic: callRequestPayload.topic,
        reason: getSdkError("USER_DISCONNECTED"),
      });
  };
  window.addEventListener("beforeunload", disconnectSessionOnUnload);

  // we should immediately approve session on connection and expect receive call request from SDK
  const callRequestPayload = await new Promise((resolve, reject) =>
    client.on("session_request", (event) => {
      console.log("EVENT", "session_request");
      if (!event) return reject(event);
      console.log(event);
      resolve(event);
    }),
  );
  // const [callRequestPayload] = (await Promise.all([
  //   new Promise((resolve, reject) =>
  //     connector.on("call_request", (error: Error | null, payload) => {
  //       console.log("EVENT", "call_request");
  //       if (error) return reject(error);
  //       console.log(payload);
  //       resolve(payload);
  //     }),
  //   ),
  //   connector.approveSession({
  //     chainId: sessionRequestPayload.chainId ?? connector.chainId,
  //     accounts: connector.accounts,
  //   }),
  // ])) as [WalletConnectRequest, unknown];

  // const rejectRequest = () => {
  //   if (connector.connected)
  //     connector.rejectRequest({
  //       id: callRequestPayload.id,
  //       error: {
  //         code: -32100,
  //         message: ErrorCodes.VerificationRejected,
  //       },
  //     });
  // };
  window.removeEventListener("beforeunload", disconnectSessionOnUnload);

  console.log("WalletConnect connected");

  // validate method
  if (callRequestPayload.params.request.method !== "wld_worldIDVerification") {
    console.error(
      "Unknown request method:",
      callRequestPayload.params.request.method,
    );
    // await client.reject({
    //   id: callRequestPayload.id,
    //   reason: {
    //     code: -32601,
    //     message: "method_not_found",
    //   },
    // });
    await new Promise((resolve) => setTimeout(resolve, 500));
    // if (client)
    //   await client.disconnect({
    //     topic: callRequestPayload.topic,
    //     reason: getSdkError("USER_DISCONNECTED"),
    //   });
    throw new TypeError(
      `Unsupported request method: ${callRequestPayload.params.request.method}`,
    );
  }

  // validate signal
  try {
    console.log("signal:", callRequestPayload.params.request.params[0].signal);
    BigInt(callRequestPayload.params.request.params[0].signal as string);
  } catch (error) {
    console.error(error);
    await client.respond({
      topic: callRequestPayload.topic,
      response: {
        id: callRequestPayload.id,
        jsonrpc: "2.0",
        error: {
          code: -32602,
          message: ErrorCodes.InvalidSignal,
        },
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (client) {
      await client.disconnect({
        topic: callRequestPayload.topic,
        reason: getSdkError("USER_DISCONNECTED"),
      });
      throw error;
    }
  }

  // validate action ID
  try {
    console.log(
      "action_id:",
      callRequestPayload.params.request.params[0].action_id,
    );
    BigInt(callRequestPayload.params.request.params[0].action_id as string);
  } catch (error) {
    console.error(error);
    await client.respond({
      topic: callRequestPayload.topic,
      response: {
        id: callRequestPayload.id,
        jsonrpc: "2.0",
        error: {
          code: -32602,
          message: ErrorCodes.InvalidActionID,
        },
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (client) {
      await client.disconnect({
        topic: callRequestPayload.topic,
        reason: getSdkError("USER_DISCONNECTED"),
      });
      throw error;
    }
  }

  // window.addEventListener("beforeunload", rejectRequest);
  // connector.on("disconnect", () => {
  //   window.removeEventListener("beforeunload", rejectRequest);
  // });

  const merkleProof = getMerkleProof(identity);
  const fullProof = await getFullProof(
    identity,
    merkleProof,
    callRequestPayload.params.request.params[0].action_id as string,
    callRequestPayload.params.request.params[0].signal as string,
  );
  const nullifierHash = abi.encode(
    ["uint256"],
    [fullProof.publicSignals.nullifierHash],
  );

  const meta = await fetchApprovalRequestMetadata(
    callRequestPayload.params.request as WalletConnectRequest,
    nullifierHash,
  );

  return {
    client,
    // connector,
    request: callRequestPayload,
    meta,
    merkleProof,
    fullProof,
  };
}
