import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { signRequest } from "@worldcoin/idkit-test-client/signing";

const here = dirname(fileURLToPath(import.meta.url));
const sdkDirectory = dirname(
  fileURLToPath(import.meta.resolve("@worldcoin/idkit-test-client")),
);
const appId = process.env.WORLD_ID_APP_ID;
const rpId = process.env.WORLD_ID_RP_ID;
const signingKeyHex = process.env.WORLD_ID_SIGNING_KEY;
const port = Number(process.env.TEST_APP_PORT ?? "3087");
const origin = `http://127.0.0.1:${port}`;
const verifyUrl = `https://developer.world.org/api/v4/verify/${rpId}`;
if (!appId || !rpId || !signingKeyHex)
  throw new Error(
    "Configure WORLD_ID_APP_ID, WORLD_ID_RP_ID and WORLD_ID_SIGNING_KEY",
  );

await mkdir(join(here, ".state"), { recursive: true });
const db = new DatabaseSync(join(here, ".state/receipts.sqlite"));
db.exec(
  "CREATE TABLE IF NOT EXISTS receipt (nullifier TEXT PRIMARY KEY, action TEXT NOT NULL, nonce TEXT NOT NULL, created_at TEXT NOT NULL)",
);
const insertReceipt = db.prepare(
  "INSERT OR IGNORE INTO receipt VALUES (?, ?, ?, ?)",
);
const countReceipts = db.prepare("SELECT COUNT(*) AS count FROM receipt");
const requests = new Map();
const events = [];
let activeConnector;

const json = (res, status, body) => {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(body));
};
const bodyOf = async (req) => {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 65536) throw new Error("Request too large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString());
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, origin);
    if (req.method === "GET" && url.pathname === "/") {
      res.writeHead(200, {
        "Content-Type": "text/html",
        "Cache-Control": "no-store",
      });
      res.end(await readFile(join(here, "index.html")));
      return;
    }
    if (
      req.method === "GET" &&
      ["/sdk/idkit.global.js", "/sdk/idkit_wasm_bg.wasm"].includes(url.pathname)
    ) {
      res.writeHead(200, {
        "Content-Type": url.pathname.endsWith("wasm")
          ? "application/wasm"
          : "text/javascript",
      });
      res.end(
        await readFile(join(sdkDirectory, url.pathname.split("/").at(-1))),
      );
      return;
    }
    if (req.method === "GET" && url.pathname === "/api/state") {
      json(res, 200, {
        app_id: appId,
        rp_id: rpId,
        receipt_count: countReceipts.get().count,
        events,
      });
      return;
    }
    if (
      req.method === "GET" &&
      url.pathname === "/simulator" &&
      activeConnector
    ) {
      res.writeHead(302, {
        Location: `https://simulator.worldcoin.org/?connect_url=${encodeURIComponent(
          activeConnector,
        )}`,
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
      });
      res.end();
      return;
    }
    if (
      req.method === "POST" &&
      req.headers.origin &&
      req.headers.origin !== origin
    ) {
      json(res, 403, { error: "Cross-origin request rejected" });
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/sign") {
      const action = `simulator-mcp-${randomUUID()}`;
      const signature = signRequest({ signingKeyHex, action, ttl: 600 });
      requests.set(signature.nonce, { action, started_at: Date.now() });
      json(res, 200, {
        app_id: appId,
        action,
        environment: "staging",
        allow_legacy_proofs: false,
        rp_context: {
          rp_id: rpId,
          nonce: signature.nonce,
          created_at: signature.createdAt,
          expires_at: signature.expiresAt,
          signature: signature.sig,
        },
      });
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/request-ready") {
      const body = await bodyOf(req);
      if (!requests.has(body.nonce))
        return json(res, 400, { error: "Unknown request" });
      requests.get(body.nonce).request_id = body.request_id;
      activeConnector = body.connect_url;
      events.push({
        stage: "request_ready",
        request_id: body.request_id,
        at: new Date().toISOString(),
      });
      json(res, 200, { ready: true });
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/client-error") {
      const body = await bodyOf(req);
      events.push({
        stage: "client_error",
        error: String(body.error).slice(0, 150),
      });
      json(res, 200, { recorded: true });
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/verify") {
      const body = await bodyOf(req);
      const pending = requests.get(body.nonce);
      if (
        !pending ||
        body.action !== pending.action ||
        body.environment !== "staging" ||
        body.protocol_version !== "4.0"
      ) {
        json(res, 400, { error: "Unexpected verification context" });
        return;
      }
      const started = Date.now();
      const upstream = await fetch(verifyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, min_protocol_version: "4.0" }),
        signal: AbortSignal.timeout(45000),
        redirect: "error",
      });
      const verdict = await upstream.json();
      const accepted = Boolean(
        upstream.ok &&
          verdict.success &&
          verdict.protocol_version === "4.0" &&
          verdict.environment === "staging" &&
          verdict.test !== true,
      );
      let inserted = false;
      if (accepted) {
        inserted =
          insertReceipt.run(
            verdict.nullifier,
            pending.action,
            body.nonce,
            new Date().toISOString(),
          ).changes === 1;
      }
      const result = {
        stage: "backend_verification",
        request_id: pending.request_id,
        verifier_status: upstream.status,
        protocol_version: verdict.protocol_version ?? null,
        environment: verdict.environment ?? null,
        synthetic: verdict.test === true,
        accepted,
        receipt_created: inserted,
        receipt_count: countReceipts.get().count,
        verify_ms: Date.now() - started,
        request_ms: Date.now() - pending.started_at,
        error: verdict.code ?? null,
        result_codes: verdict.results?.map((r) => r.code).filter(Boolean) ?? [],
      };
      events.push(result);
      json(
        res,
        result.accepted
          ? inserted
            ? 200
            : 409
          : upstream.ok
          ? 502
          : upstream.status,
        result,
      );
      return;
    }
    json(res, 404, { error: "Not found" });
  } catch {
    events.push({ stage: "fixture_error" });
    json(res, 500, { error: "Fixture request failed" });
  }
});
server.listen(port, "127.0.0.1", () =>
  console.log(`Real verification fixture: ${origin}`),
);
process.once("SIGINT", () =>
  server.close(() => {
    db.close();
    process.exit(0);
  }),
);
