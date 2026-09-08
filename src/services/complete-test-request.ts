import { buffer_decode, decryptBridgeRequest } from "@/lib/bridge-crypto";
import {
  deliverBridgeResponse,
  type BridgeConnection,
} from "@/services/bridge/deliver-response";
import { fetchMetadata } from "@/services/metadata";
import { fetchSidecar } from "@/services/sidecar";
import { CodedError, ErrorsCode } from "@/types";

type Stage =
  | "bridge_delivery"
  | "bridge_request"
  | "input"
  | "proof_context"
  | "proof_generation";

export class TestRequestError extends Error {
  constructor(
    readonly code: string,
    readonly stage: Stage,
    readonly outcome: "not_completed" | "unknown" = "not_completed",
    readonly errorDelivered = false,
  ) {
    super(code);
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/** The outer URL is never fetched. Only these bridge origins are contacted. */
export function parseTestConnection(value: string): BridgeConnection {
  try {
    if (value.length > 4096) throw new Error();
    const url = new URL(value);
    const params = url.searchParams;
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      params.get("t") !== "wld" ||
      ["t", "i", "k"].some((key) => params.getAll(key).length !== 1) ||
      params.getAll("b").length > 1
    )
      throw new Error();
    const requestUUID = params.get("i") ?? "";
    const key = params.get("k") ?? "";
    if (
      !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(
        requestUUID,
      ) ||
      !/^[\w+/-]{43}=?$/.test(key) ||
      buffer_decode(key).byteLength !== 32
    )
      throw new Error();
    const bridge = new URL(params.get("b") ?? "https://bridge.worldcoin.org");
    if (
      ![
        "https://bridge.worldcoin.org",
        "https://staging-bridge.worldcoin.org",
      ].includes(bridge.origin) ||
      bridge.username ||
      bridge.password ||
      bridge.pathname !== "/" ||
      bridge.search ||
      bridge.hash
    )
      throw new Error();
    return { bridgeURL: bridge.origin, requestUUID, key };
  } catch {
    throw new TestRequestError("invalid_connection_url", "input");
  }
}

async function readJson(response: Response): Promise<unknown> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Empty response");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    let chunk = await reader.read();
    while (!chunk.done) {
      const value = chunk.value;
      length += value.byteLength;
      if (length > 65_536) throw new Error("Response too large");
      chunks.push(value);
      chunk = await reader.read();
    }
  } finally {
    await reader.cancel();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
}

// Fail fast instead of queueing expensive proofs inside a web worker. This is a
// per-process guard; deployment-wide capacity remains the simulator's concern.
let active = false;

export async function completeTestRequest(
  connectUrl: string,
  callerSignal?: AbortSignal,
) {
  const connection = parseTestConnection(connectUrl);
  if (active) throw new TestRequestError("simulator_busy", "input");
  if (!process.env.SIDECAR_URL)
    throw new TestRequestError("prover_unavailable", "input");
  active = true;
  let stage: Stage = "bridge_request";
  let provingStarted = false;
  const controller = new AbortController();
  const cancel = () => controller.abort();
  const timer = setTimeout(cancel, 45_000);
  if (callerSignal?.aborted) cancel();
  else callerSignal?.addEventListener("abort", cancel, { once: true });
  const signal = controller.signal;
  try {
    const response = await fetch(
      `${connection.bridgeURL}/request/${connection.requestUUID}`,
      {
        signal,
        redirect: "error",
      },
    );
    if (!response.ok) throw new TestRequestError("request_unavailable", stage);
    const envelope = await readJson(response);
    if (
      !isRecord(envelope) ||
      typeof envelope.iv !== "string" ||
      typeof envelope.payload !== "string"
    ) {
      throw new TestRequestError("invalid_bridge_request", stage);
    }
    const request = await decryptBridgeRequest(
      { iv: envelope.iv, payload: envelope.payload },
      connection.key,
    );
    if (!isRecord(request) || request.environment !== "staging") {
      throw new TestRequestError("staging_required", stage);
    }
    const proof = request.proof_request;
    if (
      !isRecord(proof) ||
      proof.version !== 1 ||
      proof.session_id != null ||
      (proof.proof_type != null && proof.proof_type !== "uniqueness")
    )
      throw new TestRequestError("native_uniqueness_required", stage);
    if (
      typeof proof.expires_at !== "number" ||
      proof.expires_at <= Date.now() / 1000
    ) {
      throw new TestRequestError("request_expired", stage);
    }
    if (
      typeof request.app_id !== "string" ||
      !/^app_[\da-f]{32}$/i.test(request.app_id) ||
      typeof request.action !== "string" ||
      !request.action ||
      !Array.isArray(proof.proof_requests) ||
      proof.proof_requests.length !== 1 ||
      !isRecord(proof.proof_requests[0]) ||
      proof.proof_requests[0].issuer_schema_id !== 1
    )
      throw new TestRequestError("proof_of_human_required", stage);

    stage = "proof_context";
    const metadata = await fetchMetadata(
      {
        app_id: request.app_id,
        action: request.action,
        signal: typeof request.signal === "string" ? request.signal : "",
        nullifier_hash: "",
        action_description:
          typeof request.action_description === "string"
            ? request.action_description
            : "",
        environment: "staging",
      },
      signal,
    );
    if (metadata.is_staging !== true)
      throw new TestRequestError("app_unavailable", stage);

    stage = "proof_generation";
    signal.throwIfAborted();
    provingStarted = true;
    const proofResponse = await fetchSidecar("proof/uniqueness", {
      method: "POST",
      body: JSON.stringify({ proof_request: proof }),
      signal,
    });
    const payload = await readJson(proofResponse);
    if (!proofResponse.ok) {
      const code =
        isRecord(payload) &&
        typeof payload.error_code === "string" &&
        /^[a-z_]{1,64}$/.test(payload.error_code)
          ? payload.error_code
          : null;
      if (proofResponse.status >= 400 && proofResponse.status < 500 && code) {
        stage = "bridge_delivery";
        await deliverBridgeResponse(
          connection,
          { error_code: code },
          { signal, redirect: "error" },
        );
        throw new TestRequestError(
          code,
          "proof_generation",
          "not_completed",
          true,
        );
      }
      throw new TestRequestError("prover_unavailable", stage, "unknown");
    }
    if (
      !isRecord(payload) ||
      payload.id !== proof.id ||
      payload.version !== proof.version ||
      !Array.isArray(payload.responses) ||
      payload.responses.length !== 1 ||
      !isRecord(payload.responses[0]) ||
      // The protocol wire format is 160 compressed bytes as hex. IDKit expands
      // it to the verifier's five-element array after bridge delivery.
      typeof payload.responses[0].proof !== "string" ||
      !/^[\da-f]{320}$/i.test(payload.responses[0].proof)
    )
      throw new TestRequestError("invalid_prover_response", stage, "unknown");
    stage = "bridge_delivery";
    await deliverBridgeResponse(connection, payload, {
      signal,
      redirect: "error",
    });
    return {
      status: "proof_delivered" as const,
      request_id: connection.requestUUID,
    };
  } catch (error) {
    if (error instanceof TestRequestError) throw error;
    if (
      stage === "proof_context" &&
      error instanceof CodedError &&
      error.code === ErrorsCode.AppNotRegisteredV4
    ) {
      throw new TestRequestError(ErrorsCode.AppNotRegisteredV4, stage);
    }
    // Never expose a fetch/crypto exception: it can contain the connection URL.
    throw new TestRequestError(
      signal.aborted ? "request_interrupted" : "request_failed",
      stage,
      provingStarted ? "unknown" : "not_completed",
    );
  } finally {
    clearTimeout(timer);
    callerSignal?.removeEventListener("abort", cancel);
    active = false;
  }
}
