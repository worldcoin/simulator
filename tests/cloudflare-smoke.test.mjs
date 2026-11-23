import assert from "node:assert/strict";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { setTimeout } from "node:timers/promises";
import { before, test } from "node:test";

const base = process.env.WORKER_TEST_URL ?? "http://127.0.0.1:8787";
const request =
  new URL(base).protocol === "https:" ? httpsRequest : httpRequest;

before(async () => {
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      await fetch(base, { signal: AbortSignal.timeout(1000) });
      return;
    } catch (error) {
      if (attempt === 29) throw error;
      await setTimeout(1000);
    }
  }
});

test("Worker renders pages and preserves the proxy's CSP", async () => {
  for (const path of ["/", "/select-id", "/id/test"]) {
    const response = await fetch(`${base}${path}`, {
      signal: AbortSignal.timeout(5000),
    });
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get("content-type"), /text\/html/);
    assert.match(response.headers.get("content-security-policy"), /nonce-/);
    assert.match(await response.text(), /__NEXT_DATA__/);
  }
});

test("Worker serves the service worker and proof artifacts", async () => {
  for (const [path, signature] of [
    ["/sw.js", "importScripts("],
    ["/semaphore/semaphore.wasm", "\0asm"],
    ["/semaphore/semaphore.zkey", "zkey"],
  ]) {
    const response = await fetch(`${base}${path}`, {
      signal: AbortSignal.timeout(5000),
    });
    assert.equal(response.status, 200, path);
    const body = Buffer.from(await response.arrayBuffer());
    assert.ok(body.byteLength > 1000, path);
    assert.ok(body.includes(Buffer.from(signature)), path);
  }
});

test("Worker accepts MCP on deployed hosts and rejects an untrusted origin", async () => {
  for (const host of ["simulator.world.org", "staging-simulator.world.org"]) {
    for (const allowed of [true, false]) {
      const { status, body } = await new Promise((resolve, reject) => {
        const req = request(
          `${base}/api/mcp`,
          {
            method: "POST",
            headers: {
              Host: host,
              Origin: allowed ? `https://${host}` : "https://attacker.example",
              "Content-Type": "application/json",
              Accept: "application/json, text/event-stream",
            },
          },
          (res) => {
            let body = "";
            res.setEncoding("utf8");
            res.on("data", (chunk) => {
              body += chunk;
            });
            res.on("end", () => resolve({ status: res.statusCode, body }));
            res.on("error", reject);
          },
        );
        req.setTimeout(5000, () =>
          req.destroy(new Error("MCP request timed out")),
        );
        req.on("error", reject);
        req.end(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" }));
      });
      assert.equal(status, allowed ? 200 : 403);
      if (allowed) assert.match(body, /"result":\{\}/);
    }
  }
});
