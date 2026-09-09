# Simulator MCP

The simulator exposes one MCP tool, `complete_test_request`. It completes a
native World ID 4.0 staging Proof of Human uniqueness request with a real proof,
so an agent can test an application's verification flow without a phone.

## Connect

```json
{
  "mcpServers": {
    "world-id-simulator": {
      "url": "https://simulator.worldcoin.org/api/mcp"
    }
  }
}
```

No API key is required. This is a separate connection from the Developer Portal
MCP: Portal team API keys configure apps in the Portal; the simulator keeps its
existing public test access model.

The server describes the agent workflow, the tool contract, and the failure
outcomes in its `initialize` instructions, so connected clients receive them
automatically. In short: start verification in the application under test, pass
its IDKit connector URI as `connect_url`, and judge success by the application's
own backend response — proof delivery is not application acceptance. Never log
connection URLs; they contain the bridge's encryption key.

Two transport details for hand-rolled clients: responses arrive as a
server-sent-events envelope (`data: {…}` lines carrying the JSON-RPC message;
MCP SDK clients handle this automatically), and a successful call returns
`{ "status": "proof_delivered", "request_id": "…" }` — note `status`, not
`outcome`. Failed calls set `isError` and carry `error`, `stage`, `outcome`,
and `error_delivered` fields instead.

## Minimal test application

`complete_test_request` completes a request that your application created, so
the application must sign and publish a real IDKit request and verify the
delivered proof itself.

An official, deployed reference exists: the
[IDKit example arena](https://idkit-js-example.vercel.app/)
([source](https://github.com/worldcoin/idkit/tree/main/js/examples/nextjs),
with a plain-browser variant beside it). Its `api/arena/rp-context` route also
shows how to mint deliberately broken request contexts (invalid RP signature,
expired timestamps, replayed nonces) for failure-path testing.

The smallest working shape with `@worldcoin/idkit-core@4.2.1`:

Backend (Node):

```js
import { signRequest } from "@worldcoin/idkit-core/signing";

// Sign a fresh staging request server-side. Never expose the signing key.
const action = `mcp-test-${crypto.randomUUID()}`;
const signature = signRequest({ signingKeyHex, action, ttl: 600 });
const config = {
  app_id,
  action,
  environment: "staging",
  allow_legacy_proofs: false,
  rp_context: {
    rp_id,
    nonce: signature.nonce,
    created_at: signature.createdAt,
    expires_at: signature.expiresAt,
    signature: signature.sig,
  },
};

// Later: verify whatever the page hands back, unmodified.
const response = await fetch(
  `https://developer.world.org/api/v4/verify/${rp_id}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...completionResult, min_protocol_version: "4.0" }),
  },
);
```

Page (browser, IDKit global bundle):

```js
const request = await IDKit.request(config).preset(IDKit.proofOfHuman());
// request.connectorURI is the connect_url for complete_test_request.
// Never log it: it contains the bridge encryption key.
const completion = await request.pollUntilCompletion({ timeout: 600000 });
if (completion.success) await postToBackendVerify(completion.result);
```

Serve `idkit.global.js` and `idkit_wasm_bg.wasm` together from the installed
package: the SDK loads its WASM relative to the script, and the package
README's CDN snippet currently fails WASM initialization. `signRequest` is also
exported from `@worldcoin/idkit-server`, which the official example uses for
server-side signing.

Success means the application's backend received Portal HTTP 200 with
`protocol_version` `"4.0"` and `environment` `"staging"` — not the tool's
`proof_delivered` acknowledgment. Actions need no pre-registration; the verify
endpoint creates them on first verification.
