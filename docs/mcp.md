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
