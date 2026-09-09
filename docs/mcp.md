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

## Agent workflow

1. Use the Portal MCP to configure the app and confirm its RP is registered in
   the staging registry.
2. Start verification in the application. Obtain the IDKit connector URI from
   its signed request. Use staging and disable legacy fallback.
3. Call `complete_test_request` with that URI as `connect_url`.
4. Let the application's IDKit polling or callback receive the proof. Judge
   success by its backend response and business effects, not by proof delivery.
5. If the application fails, fix it and start a fresh request.

Do not log connection URLs: they contain the bridge's encryption key. The tool
never needs the RP private signing key.

## Tool contract

Input is one required string, `connect_url` (max 4096 characters). Only explicit
staging, native v4 uniqueness, single Proof of Human requests are supported; the
signed request supplies all proof context. There are no identity-selection,
outcome, environment, or direct-verification options.

On bridge acknowledgment:

```json
{
  "status": "proof_delivered",
  "request_id": "the-original-request-id"
}
```

**Proof delivery is not application acceptance.** The application must still
call its real backend verifier. The response contains no proof payload or API
keys.

On failure the result has `isError: true` with structured fields `error`,
`stage`, `outcome`, and `error_delivered`. Structured prover failures, such as
an invalid RP signature, are forwarded to IDKit through the bridge when
possible.

- `outcome: "not_completed"` — no proof was delivered. Check the reported stage
  and the application's IDKit result.
- `outcome: "unknown"` — proof generation or delivery may already have
  happened. Inspect the original IDKit request before another attempt; do not
  retry blindly.
- `simulator_busy` — this worker already has an active request; this call
  started nothing new.

Session proofs, other credentials, and legacy proofs keep their existing
browser flows. Test invalid proofs and business-rule failures through the
application's backend; the MCP does not synthesize them.

## Deployment

- `SIDECAR_URL` and the private `BEARER_TOKEN` are shared with the existing
  sidecar proxy. Keep the token server-side; it is sent only to the configured
  proof service.
- App metadata comes from the Portal selected by `NEXT_PUBLIC_DEV_PORTAL_URL`.
  `vercel.json` pins Vercel builds to `https://developer.world.org`; register
  test apps there. Proof requests always use the staging environment.
- The route allows only the supported World bridge HTTPS origins, blocks
  redirects, and validates Host/Origin headers against the main domain and
  Vercel's configured deployment/branch host names. Local hosts are permitted
  only outside production.
- Limits: 8 KB request body, 64 KB bridge/prover responses, and a 45-second
  operation deadline. Configure the hosting runtime to allow the route a
  60-second duration.
- One active request per worker prevents local queues; this is not a
  deployment-wide rate limit. Reuse the existing ingress and prover capacity
  controls.
- Exclude tool arguments and `Mcp-Param-connect_url` headers from ingress and
  tracing logs; the connection URL contains an encryption key.

Run the tests with Node 22 and `pnpm test`.
