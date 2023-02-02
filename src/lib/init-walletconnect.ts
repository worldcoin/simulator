import type { Identity } from "@/types";
import { defaultAbiCoder as abi } from "@ethersproject/abi";
import WalletConnect from "@walletconnect/client";
import type { ISessionParams } from "@walletconnect/types";
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
  connector: WalletConnect;
  request: WalletConnectRequest;
  meta: Awaited<ReturnType<typeof fetchApprovalRequestMetadata>>;
  merkleProof: MerkleProof;
  fullProof: SemaphoreFullProof;
}> {
  console.log("Initializing WalletConnect with uri:", uri);
  // we don't want persistent sessions
  const STORAGE_KEY = "walletconnect-worldid-check";
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
  const connector = new WalletConnect({
    uri,
    storageId: STORAGE_KEY,
    storage: {
      getSession: () => null,
      setSession: (s) => s,
      removeSession() {}, // eslint-disable-line @typescript-eslint/no-empty-function
    },
  });
  // connector.on("session_update", (error, _payload) => {
  //   console.log("EVENT", "session_update");
  //   if (error) throw error;
  // });
  // connector.on("wc_sessionRequest", (error, _payload) => {
  //   console.log("EVENT", "wc_sessionRequest");
  //   if (error) throw error;
  // });
  // connector.on("wc_sessionUpdate", (error, _payload) => {
  //   console.log("EVENT", "wc_sessionUpdate");
  //   if (error) throw error;
  // });
  // connector.on("connect", (error, _payload) => {
  //   console.log("EVENT", "connect");
  //   if (error) throw error;
  // });
  connector.on("disconnect", (error, _payload) => {
    console.log("EVENT", "disconnect");
    if (error) throw error;
  });

  // we should immediately receive session request from SDK
  const sessionRequestPayload = await new Promise<ISessionParams>(
    (resolve, reject) =>
      connector.on(
        "session_request",
        (error: Error | null, payload: { params: ISessionParams[] }) => {
          console.log("EVENT", "session_request");
          if (error) return reject(error);
          console.log("SESSION_REQUEST", payload.params);
          resolve(payload.params[0]);
        },
      ),
  );

  const disconnectSessionOnUnload = () => {
    if (connector.connected)
      connector.killSession().catch(console.error.bind(console));
  };
  window.addEventListener("beforeunload", disconnectSessionOnUnload);

  // we should immediately approve session on connection and expect receive call request from SDK
  const [callRequestPayload] = (await Promise.all([
    new Promise((resolve, reject) =>
      connector.on("call_request", (error: Error | null, payload) => {
        console.log("EVENT", "call_request");
        if (error) return reject(error);
        console.log(payload);
        resolve(payload);
      }),
    ),
    connector.approveSession({
      chainId: sessionRequestPayload.chainId ?? connector.chainId,
      accounts: connector.accounts,
    }),
  ])) as [WalletConnectRequest, unknown];

  const rejectRequest = () => {
    if (connector.connected)
      connector.rejectRequest({
        id: callRequestPayload.id,
        error: {
          code: -32100,
          message: ErrorCodes.VerificationRejected,
        },
      });
  };
  window.removeEventListener("beforeunload", disconnectSessionOnUnload);

  console.log("WalletConnect connected");

  // validate method
  if (callRequestPayload.method !== "wld_worldIDVerification") {
    console.error("Unknown request method:", callRequestPayload.method);
    connector.rejectRequest({
      id: callRequestPayload.id,
      error: {
        code: -32601,
        message: "method_not_found",
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (connector.connected) await connector.killSession();
    throw new TypeError(
      `Unsupported request method: ${callRequestPayload.method}`,
    );
  }

  // validate signal
  try {
    BigInt(callRequestPayload.params[0].signal);
  } catch (err) {
    console.error(err);
    connector.rejectRequest({
      id: callRequestPayload.id,
      error: {
        code: -32602,
        message: ErrorCodes.InvalidSignal,
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (connector.connected) await connector.killSession();
    throw err;
  }

  // validate action ID
  try {
    BigInt(callRequestPayload.params[0].action_id);
  } catch (err) {
    console.error(err);
    connector.rejectRequest({
      id: callRequestPayload.id,
      error: {
        code: -32602,
        message: ErrorCodes.InvalidActionID,
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (connector.connected) await connector.killSession();
    throw err;
  }

  window.addEventListener("beforeunload", rejectRequest);
  connector.on("disconnect", () => {
    window.removeEventListener("beforeunload", rejectRequest);
  });

  const merkleProof = getMerkleProof(identity);
  const fullProof = await getFullProof(
    identity,
    merkleProof,
    callRequestPayload.params[0].action_id,
    callRequestPayload.params[0].signal,
  );
  const nullifierHash = abi.encode(
    ["uint256"],
    [fullProof.publicSignals.nullifierHash],
  );

  const meta = await fetchApprovalRequestMetadata(
    callRequestPayload,
    nullifierHash,
  );

  return {
    connector,
    request: callRequestPayload,
    meta,
    merkleProof,
    fullProof,
  };
}
