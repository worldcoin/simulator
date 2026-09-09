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
