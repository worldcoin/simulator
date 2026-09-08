# Simulator MCP

The simulator exposes one MCP tool, `complete_test_request`, for completing native
World ID 4.0 staging Proof of Human uniqueness requests with real proofs.

After this version is deployed, connect an HTTP MCP client to
`https://simulator.worldcoin.org/api/mcp`. This is a separate connection from the
Developer Portal MCP. Portal team API keys are used for app configuration in the
Portal; the simulator uses its existing public test access model.

For clients using `mcpServers` JSON configuration:

```json
{
  "mcpServers": {
    "world-id-simulator": {
      "url": "https://simulator.worldcoin.org/api/mcp"
    }
  }
}
```

## Agent workflow

1. Use the Portal MCP to configure the app and confirm that its RP is registered
   in the staging registry used for real verification.
2. Start verification in the developer's application. Obtain the actual IDKit
   connector URI from its signed request. Use staging and disable legacy fallback.
3. Call `complete_test_request` with that URI as `connect_url`.
4. Let the application's existing IDKit polling or callback receive the proof.
   Check its backend response and intended business effects separately.
5. If the application fails, repair it and start a fresh request as appropriate.

The tool does not need the RP private signing key and does not create a separate
verification request. Do not log connection URLs: they contain the bridge's
encryption key.

## Tool contract

Input has one required string field, `connect_url`, limited to 4096 characters.
Only explicit staging, native v4 uniqueness, and a single Proof of Human request
are supported. The signed request supplies all proof context. There are no
identity-selection, outcome, environment, or direct-verification options.

On bridge acknowledgment:

```json
{
  "status": "proof_delivered",
  "request_id": "the-original-request-id"
}
```

**Proof delivery is not application acceptance.** The application must still call
its real backend verifier. This response contains no proof payload or API keys.

On failure, the MCP result has `isError: true` and structured fields `error`,
`stage`, `outcome`, and `error_delivered`. Structured prover failures, such as an
invalid RP signature, are forwarded to IDKit through the bridge when possible.

- `outcome: "not_completed"`: the tool did not deliver a proof. Check the reported
  stage and the application's IDKit result.
- `outcome: "unknown"`: proof generation or delivery may already have happened.
  Inspect the original IDKit request before another attempt. Do not retry blindly.
- `simulator_busy`: this worker already has an active request; no new proof was
  started by this call.

Session proofs, other credentials, and legacy proofs retain their existing browser
flows; they are not exposed by this tool. An invalid proof or business-rule failure
should be exercised through the application's backend rather than synthesized by
the simulator MCP.

## Development and deployment

The MCP route shares `SIDECAR_URL` and the private `BEARER_TOKEN` with the existing
sidecar proxy. The bearer token is sent only to the configured proof service.
Keep it server-side. Existing browser bridge encryption/delivery code is shared
with the MCP operation; no new prover, credential store, or Portal verifier path
is introduced.

Exclude tool arguments and `Mcp-Param-connect_url` headers from ingress/tracing
logs, since the connection URL contains an encryption key.

The adapter allows only the supported World bridge HTTPS origins, blocks redirects,
and validates incoming Host/Origin headers against the main domain and Vercel's
configured deployment/branch host names. Local hosts are permitted only outside
production. The Next.js request body limit is 8 KB, bridge/prover response limit is
64 KB, and each operation has a 45-second deadline. Configure the hosting runtime
to allow the route's 60-second duration. One active request per worker prevents
local queues; this is not a deployment-wide rate limit. Reuse the existing ingress
and prover capacity controls when deploying.

Run deterministic tests with Node 22 and `pnpm test`. They use the real handler,
encryption, and MCP client/HTTP transport, mocking remote I/O only. Both legacy MCP
negotiation and current SDK negotiation are covered.

See the [real application fixture](../examples/real-verification/README.md) and
[feasibility evidence](./real-verification-feasibility.md) for live proof testing.
