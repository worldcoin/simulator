import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";

const fixture = process.env.TEST_APP_URL ?? "http://127.0.0.1:3087";
const endpoint =
  process.env.SIMULATOR_MCP_URL ?? "http://localhost:3088/api/mcp";
const response = await fetch(`${fixture}/simulator`, { redirect: "manual" });
const location = response.headers.get("location");
if (!location)
  throw new Error("Start a fresh verification in the test application first");
const connectUrl = new URL(location).searchParams.get("connect_url");
const client = new Client(
  {
    name: "simulator-real-verification-test",
    version: "1.0.0",
  },
  { versionNegotiation: { mode: "auto" } },
);
try {
  await client.connect(new StreamableHTTPClientTransport(new URL(endpoint)));
  const listed = await client.listTools();
  if (!listed.tools.some((tool) => tool.name === "complete_test_request")) {
    throw new Error("Simulator tool was not discovered");
  }
  const started = Date.now();
  const result = await client.callTool({
    name: "complete_test_request",
    arguments: { connect_url: connectUrl },
  });
  console.log(
    JSON.stringify({
      mcp_ms: Date.now() - started,
      mcp_protocol: client.getNegotiatedProtocolVersion(),
      result: result.structuredContent,
      is_error: result.isError ?? false,
    }),
  );
  if (result.isError) process.exitCode = 1;
  else {
    const requestId = new URL(connectUrl).searchParams.get("i");
    const deadline = Date.now() + 45000;
    let observed;
    while (Date.now() < deadline) {
      const state = await fetch(`${fixture}/api/state`).then((response) =>
        response.json(),
      );
      observed = state.events.find(
        (event) =>
          event.stage === "backend_verification" &&
          event.request_id === requestId,
      );
      if (observed) break;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    console.log(
      JSON.stringify({ application_result: observed ?? "not_observed" }),
    );
    if (
      !observed?.accepted ||
      !observed.receipt_created ||
      observed.protocol_version !== "4.0" ||
      observed.synthetic
    )
      process.exitCode = 1;
  }
} finally {
  await client.close();
}
