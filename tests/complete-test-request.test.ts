import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import { createServer, request as httpRequest } from "node:http";
import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import type { NextApiRequest, NextApiResponse } from "next";
import mcpHandler from "../src/pages/api/mcp";
import {
  buffer_decode,
  decryptBridgeRequest,
  encryptRequest,
} from "../src/lib/bridge-crypto";
import {
  completeTestRequest,
  parseTestConnection,
  TestRequestError,
} from "../src/services/complete-test-request";
import {
  approveRequest,
  approveRequestV4,
} from "../src/services/bridge/approve-request";
import { pairClient } from "../src/services/bridge/pair-client";
import { VerificationLevel } from "@worldcoin/idkit-core";

// #region Test data and I/O boundary
const requestId = "12345678-1234-4234-8234-123456789abc";
const networkFetch = globalThis.fetch;
const appId = "app_0123456789abcdef0123456789abcdef";
const key = Buffer.alloc(32, 7).toString("base64url");
const connectUrl = `https://world.org/verify?t=wld&i=${requestId}&k=${key}`;
const nativeResponse = {
  id: "proof-request",
  version: 1,
  responses: [{ identifier: "proof_of_human", proof: "01".repeat(160) }],
};
const makeRequest = (overrides: Record<string, unknown> = {}) => ({
  app_id: appId,
  action: "test-action",
  environment: "staging",
  signal: "0",
  proof_request: {
    id: "proof-request",
    version: 1,
    expires_at: Math.floor(Date.now() / 1000) + 120,
    rp_id: "rp_0123456789abcdef",
    nonce: "0x123",
    signature: "signed-context",
    proof_requests: [{ identifier: "proof_of_human", issuer_schema_id: 1 }],
  },
  ...overrides,
});
const encrypt = async (value: unknown) =>
  encryptRequest(
    await crypto.subtle.importKey("raw", buffer_decode(key), "AES-GCM", false, [
      "encrypt",
    ]),
    crypto.getRandomValues(new Uint8Array(12)),
    JSON.stringify(value),
  );
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
let envelope: { iv: string; payload: string };
let calls: Array<{ url: string; init?: RequestInit }>;
let proofReply: () => Promise<Response>;
let contextReply: () => Response;
let bridgeReply: () => Response;
let requestReply: () => Response;

beforeEach(async () => {
  process.env.SIDECAR_URL = "https://proof-service.example";
  process.env.BEARER_TOKEN = "private-sidecar-token";
  envelope = await encrypt(makeRequest());
  calls = [];
  proofReply = () => Promise.resolve(json(nativeResponse));
  contextReply = () => json({ app_id: appId, name: "Test app" });
  bridgeReply = () => json({});
  requestReply = () => json(envelope);
  mock.method(console, "error", () => {});
  mock.method(console, "warn", () => {});
  mock.method(
    globalThis,
    "fetch",
    (input: string | URL | Request, init?: RequestInit) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url.startsWith("http://127.0.0.1:")) return networkFetch(input, init);
      calls.push({ url, init });
      if (url.includes("/request/")) return Promise.resolve(requestReply());
      if (url.includes("/proof-context/"))
        return Promise.resolve(contextReply());
      if (url === "https://proof-service.example/proof/uniqueness")
        return proofReply();
      if (url.includes("/response/")) return Promise.resolve(bridgeReply());
      throw new Error("Unexpected network destination");
    },
  );
});

// #region MCP transport (real SDK client and local HTTP; only remote I/O mocked)
async function withMcpServer(run: (endpoint: string) => Promise<void>) {
  const server = createServer((req, res) => {
    void (async () => {
      const chunks: Buffer[] = [];
      for await (const chunk of req)
        chunks.push(Buffer.from(chunk as Uint8Array));
      const text = Buffer.concat(chunks).toString();
      (req as NextApiRequest).body = text
        ? (JSON.parse(text) as unknown)
        : undefined;
      await mcpHandler(req as NextApiRequest, res as NextApiResponse);
    })().catch(() => {
      res.writeHead(500);
      res.end();
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  try {
    await run(`http://127.0.0.1:${address.port}/api/mcp`);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

test("MCP discovery and proof delivery work with legacy and current SDK negotiation", async () => {
  await withMcpServer(async (endpoint) => {
    for (const mode of ["legacy", "auto"] as const) {
      const client = new Client(
        { name: "simulator-test", version: "1.0.0" },
        { versionNegotiation: { mode } },
      );
      try {
        await client.connect(
          new StreamableHTTPClientTransport(new URL(endpoint)),
        );
        assert.equal(
          client.getProtocolEra(),
          mode === "auto" ? "modern" : "legacy",
        );
        const listed = await client.listTools();
        assert.deepEqual(
          listed.tools.map((tool) => tool.name),
          ["complete_test_request"],
        );
        assert.equal(listed.tools[0].annotations?.idempotentHint, false);
        const result = await client.callTool({
          name: "complete_test_request",
          arguments: { connect_url: connectUrl },
        });
        assert.deepEqual(result.structuredContent, {
          status: "proof_delivered",
          request_id: requestId,
        });
        assert.notEqual(result.isError, true);
      } finally {
        await client.close();
      }
    }
  });
});

test("MCP validates arguments even when a caller bypasses client validation", async () => {
  await withMcpServer(async (endpoint) => {
    for (const args of [
      { connect_url: 12 },
      { connect_url: connectUrl, outcome: "success" },
    ]) {
      const response = await networkFetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          "MCP-Protocol-Version": "2025-06-18",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: "complete_test_request", arguments: args },
        }),
      });
      const text = await response.text();
      assert.match(text, /"isError":true/);
      assert.match(text, /Input validation error/);
    }
    assert.equal(calls.length, 0);
  });
});

test("MCP denies untrusted Host and Origin headers", async () => {
  await withMcpServer(async (endpoint) => {
    const badHeaders: Record<string, string>[] = [
      { Host: "attacker.example" },
      { Origin: "https://attacker.example" },
    ];
    for (const headers of badHeaders) {
      const status = await new Promise<number | undefined>(
        (resolve, reject) => {
          const request = httpRequest(
            endpoint,
            {
              method: "POST",
              headers: { "Content-Type": "application/json", ...headers },
            },
            (response) => {
              response.resume();
              response.on("end", () => resolve(response.statusCode));
            },
          );
          request.on("error", reject);
          request.end("{}");
        },
      );
      assert.equal(status, 403);
    }
    assert.equal(calls.length, 0);
  });
});

test("MCP accepts its configured deployment hostnames in production", async () => {
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
    VERCEL_BRANCH_URL: process.env.VERCEL_BRANCH_URL,
  };
  Object.assign(process.env, {
    NODE_ENV: "production",
    VERCEL_URL: "deployment.vercel.app",
    VERCEL_BRANCH_URL: "branch.vercel.app",
  });
  try {
    await withMcpServer(async (endpoint) => {
      for (const host of ["deployment.vercel.app", "branch.vercel.app"]) {
        const status = await new Promise<number | undefined>(
          (resolve, reject) => {
            const request = httpRequest(
              endpoint,
              {
                method: "POST",
                headers: {
                  Host: host,
                  Origin: `https://${host}`,
                  "Content-Type": "application/json",
                  Accept: "application/json, text/event-stream",
                },
              },
              (response) => {
                response.resume();
                response.on("end", () => resolve(response.statusCode));
              },
            );
            request.on("error", reject);
            request.end(
              JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" }),
            );
          },
        );
        assert.equal(status, 200);
      }
    });
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test("MCP reports ambiguous failures without exposing the connection URL", async () => {
  proofReply = () =>
    Promise.reject(new Error(`Request failed for ${connectUrl}`));
  await withMcpServer(async (endpoint) => {
    const client = new Client({ name: "simulator-test", version: "1.0.0" });
    try {
      await client.connect(
        new StreamableHTTPClientTransport(new URL(endpoint)),
      );
      const result = await client.callTool({
        name: "complete_test_request",
        arguments: { connect_url: connectUrl },
      });
      assert.equal(result.isError, true);
      assert.deepEqual(result.structuredContent, {
        error: "request_failed",
        stage: "proof_generation",
        outcome: "unknown",
        error_delivered: false,
      });
      assert.equal(JSON.stringify(result).includes(key), false);
    } finally {
      await client.close();
    }
  });
});
// #endregion
afterEach(() => mock.restoreAll());
// #endregion

test("passes the signed request unchanged to the prover and encrypts its response for IDKit", async () => {
  const request = makeRequest();
  envelope = await encrypt(request);
  assert.deepEqual(await completeTestRequest(connectUrl), {
    status: "proof_delivered",
    request_id: requestId,
  });
  assert.equal(calls.length, 4);
  const proofCall = calls[2];
  assert.deepEqual(JSON.parse(String(proofCall.init?.body)), {
    proof_request: request.proof_request,
  });
  assert.equal(
    new Headers(proofCall.init?.headers).get("authorization"),
    "Bearer private-sidecar-token",
  );
  const delivery = calls[3];
  assert.equal(delivery.init?.method, "PUT");
  assert.equal(delivery.init?.redirect, "error");
  assert.equal(new Headers(delivery.init?.headers).has("authorization"), false);
  assert.deepEqual(
    await decryptBridgeRequest(
      JSON.parse(String(delivery.init?.body)) as typeof envelope,
      key,
    ),
    nativeResponse,
  );
  assert.equal(calls[0].init?.redirect, "error");
});

test("rejects destinations, request paths and keys before any network access", async () => {
  for (const url of [
    "not-a-url",
    `${connectUrl}&b=http://127.0.0.1:3001`,
    `${connectUrl}&b=https://bridge.worldcoin.org.evil.example`,
    `${connectUrl}&b=https://bridge.worldcoin.org/private`,
    `${connectUrl}&b=https://name:password@bridge.worldcoin.org`,
    connectUrl.replace(requestId, "..%2F"),
    connectUrl.replace(key, "short"),
    `${connectUrl}&i=${requestId}`,
  ]) {
    await assert.rejects(completeTestRequest(url), {
      code: "invalid_connection_url",
      stage: "input",
    });
  }
  assert.equal(calls.length, 0);
  assert.equal(
    parseTestConnection(`${connectUrl}&b=https://staging-bridge.worldcoin.org/`)
      .bridgeURL,
    "https://staging-bridge.worldcoin.org",
  );
});

test("requires explicit staging and native uniqueness before context or prover work", async () => {
  for (const [request, code] of [
    [makeRequest({ environment: undefined }), "staging_required"],
    [makeRequest({ environment: "production" }), "staging_required"],
    [makeRequest({ proof_request: undefined }), "native_uniqueness_required"],
    [
      makeRequest({
        proof_request: {
          ...makeRequest().proof_request,
          session_id: "session_1",
        },
      }),
      "native_uniqueness_required",
    ],
    [
      makeRequest({
        proof_request: {
          ...makeRequest().proof_request,
          proof_type: "create_session",
        },
      }),
      "native_uniqueness_required",
    ],
    [
      makeRequest({
        proof_request: { ...makeRequest().proof_request, expires_at: 1 },
      }),
      "request_expired",
    ],
    [
      makeRequest({
        proof_request: {
          ...makeRequest().proof_request,
          proof_requests: [{ issuer_schema_id: 9303 }],
        },
      }),
      "proof_of_human_required",
    ],
    [
      makeRequest({ app_id: "https://other.example" }),
      "proof_of_human_required",
    ],
  ] as const) {
    calls.length = 0;
    envelope = await encrypt(request);
    await assert.rejects(completeTestRequest(connectUrl), {
      code,
      outcome: "not_completed",
    });
    assert.equal(calls.length, 1);
  }
});

test("does not fetch or mint without a configured prover", async () => {
  delete process.env.SIDECAR_URL;
  await assert.rejects(completeTestRequest(connectUrl), {
    code: "prover_unavailable",
    stage: "input",
  });
  assert.equal(calls.length, 0);
});

test("accepts the standard Base64 key format generated by IDKit as well as URL-safe keys", async () => {
  for (const encoding of ["base64", "base64url"] as const) {
    const bytes = Buffer.alloc(32, 255);
    const variant = bytes.toString(encoding);
    const url = new URL(connectUrl);
    url.searchParams.set("k", variant);
    const imported = await crypto.subtle.importKey(
      "raw",
      Uint8Array.from(bytes),
      "AES-GCM",
      false,
      ["encrypt"],
    );
    envelope = await encryptRequest(
      imported,
      crypto.getRandomValues(new Uint8Array(12)),
      JSON.stringify(makeRequest()),
    );
    assert.equal(
      (await completeTestRequest(url.toString())).status,
      "proof_delivered",
    );
  }
});

test("stops at an unavailable or redirected bridge request", async () => {
  for (const status of [404, 302]) {
    calls.length = 0;
    requestReply = () => json({}, status);
    await assert.rejects(completeTestRequest(connectUrl), {
      code: "request_unavailable",
    });
    assert.equal(calls.length, 1);
  }
});

test("refuses invalid ciphertext and oversized bridge bodies", async () => {
  requestReply = () => json({ iv: envelope.iv, payload: "changed" });
  await assert.rejects(completeTestRequest(connectUrl), {
    stage: "bridge_request",
    outcome: "not_completed",
  });
  requestReply = () => new Response("x".repeat(65_537));
  await assert.rejects(completeTestRequest(connectUrl), {
    stage: "bridge_request",
  });
  assert.equal(calls.length, 2);
});

test("retains app proof-context eligibility checks before generating a proof", async () => {
  contextReply = () =>
    json({ code: "not_registered", detail: "Not registered" }, 400);
  await assert.rejects(completeTestRequest(connectUrl), {
    stage: "proof_context",
    outcome: "not_completed",
  });
  assert.equal(calls.length, 2);
});

test("delivers a structured prover failure to IDKit while reporting a failed tool result", async () => {
  proofReply = () =>
    Promise.resolve(json({ error_code: "invalid_rp_signature" }, 400));
  await assert.rejects(completeTestRequest(connectUrl), {
    code: "invalid_rp_signature",
    errorDelivered: true,
    outcome: "not_completed",
  });
  assert.deepEqual(
    await decryptBridgeRequest(
      JSON.parse(String(calls[3].init?.body)) as typeof envelope,
      key,
    ),
    { error_code: "invalid_rp_signature" },
  );
});

test("does not claim completion or retry after ambiguous prover/delivery failures", async () => {
  proofReply = () => Promise.resolve(json({}, 503));
  await assert.rejects(completeTestRequest(connectUrl), {
    code: "prover_unavailable",
    outcome: "unknown",
  });
  assert.equal(calls.length, 3);
  calls.length = 0;
  proofReply = () => Promise.resolve(json(nativeResponse));
  bridgeReply = () => json({}, 502);
  await assert.rejects(completeTestRequest(connectUrl), {
    stage: "bridge_delivery",
    outcome: "unknown",
  });
  assert.equal(calls.length, 4);
});

test("does not label malformed successful prover responses as proof delivery", async () => {
  proofReply = () => Promise.resolve(json({}));
  await assert.rejects(completeTestRequest(connectUrl), {
    code: "invalid_prover_response",
    outcome: "unknown",
  });
  assert.equal(calls.length, 3);
});

test("redacts transport errors and bounds concurrent proof requests", async () => {
  let release: () => void = () => {};
  let started: () => void = () => {};
  const inProver = new Promise<void>((resolve) => {
    started = resolve;
  });
  proofReply = () =>
    new Promise<Response>((_, reject) => {
      release = () => reject(new Error(`Secret URL: ${connectUrl}`));
      started();
    });
  const pending = completeTestRequest(connectUrl);
  const rejected = assert.rejects(pending, (error: unknown) => {
    assert.ok(error instanceof TestRequestError);
    assert.equal(error.outcome, "unknown");
    assert.equal(error.message.includes(key), false);
    return true;
  });
  await inProver;
  await assert.rejects(completeTestRequest(connectUrl), {
    code: "simulator_busy",
  });
  release();
  await rejected;
  proofReply = () => Promise.resolve(json(nativeResponse));
  assert.equal(
    (await completeTestRequest(connectUrl)).status,
    "proof_delivered",
  );
});

test("cancellation after proving starts reports an unknown result and releases the slot", async () => {
  const abort = new AbortController();
  proofReply = () => {
    abort.abort();
    return Promise.reject(new Error("aborted"));
  };
  await assert.rejects(completeTestRequest(connectUrl, abort.signal), {
    code: "request_interrupted",
    stage: "proof_generation",
    outcome: "unknown",
  });
  proofReply = () => Promise.resolve(json(nativeResponse));
  assert.equal(
    (await completeTestRequest(connectUrl)).status,
    "proof_delivered",
  );
});

test("existing browser v3 and v4 bridge responses retain their wire formats", async () => {
  const v3 = await approveRequest({
    url: connectUrl,
    verificationLevel: VerificationLevel.Orb,
    fullProof: {
      merkleTreeRoot: "10",
      nullifierHash: "11",
      signal: 0n,
      externalNullifier: 12n,
      proof: ["1", "2", "3", "4", "5", "6", "7", "8"],
    },
  });
  assert.equal(v3.success, true);
  const v3Body = (await decryptBridgeRequest(
    JSON.parse(String(calls[0].init?.body)) as typeof envelope,
    key,
  )) as Record<string, unknown>;
  assert.equal(v3Body.verification_level, "orb");
  assert.equal(String(v3Body.proof).length, 514);
  assert.equal(
    await approveRequestV4({
      url: connectUrl,
      proofResponse: nativeResponse,
    }).then((r) => r.success),
    true,
  );
  assert.deepEqual(
    await decryptBridgeRequest(
      JSON.parse(String(calls[1].init?.body)) as typeof envelope,
      key,
    ),
    nativeResponse,
  );
  const paired = await pairClient({ url: connectUrl });
  assert.equal(paired.success, true);
  if (paired.success) assert.equal(paired.bridgeInitialData.app_id, appId);
});
