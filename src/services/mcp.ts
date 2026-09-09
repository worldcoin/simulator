import {
  createMcpHandler,
  fromJsonSchema,
  McpServer,
} from "@modelcontextprotocol/server";
import { completeTestRequest, TestRequestError } from "./complete-test-request";

export const simulatorMcp = createMcpHandler(() => {
  const server = new McpServer(
    { name: "world-id-simulator", version: "1.0.0" },
    {
      capabilities: { tools: {} },
      instructions: `This server completes an application's real World ID 4.0 staging verification the way a phone would. One tool: complete_test_request.

Workflow:
1. Configure the app with the Developer Portal MCP (a separate connection) and confirm its RP is registered in the staging registry.
2. Start verification in the application under test. Obtain the IDKit connector URI from its signed request. Use staging and disable legacy fallback.
3. Call complete_test_request with that URI as connect_url. Only native v4, single Proof of Human uniqueness requests are supported; the signed request supplies all proof context.
4. Let the application's IDKit polling or callback receive the proof. proof_delivered means the proof reached IDKit — judge success by the application's backend response and business effects.
5. If the application fails, fix it and start a fresh request.

A successful call returns { "status": "proof_delivered", "request_id": "..." } — note status, not outcome. Failure results carry error, stage, outcome, and error_delivered. outcome "not_completed": no proof was delivered — check the reported stage and the application's IDKit result. outcome "unknown": proof generation or delivery may already have happened — inspect the original IDKit request before another attempt; never retry blindly. simulator_busy: this worker already has an active request; this call started nothing new.

Never log or repeat connection URLs: they contain the bridge encryption key. The tool never needs the RP private signing key. Test invalid proofs and business-rule failures through the application's backend; this server does not synthesize them.`,
    },
  );
  server.registerTool(
    "complete_test_request",
    {
      description:
        "Generate a real native World ID 4.0 staging proof and deliver it through the existing IDKit bridge. Accepts the application's connector URI; does not verify the application's backend result.",
      inputSchema: fromJsonSchema<{ connect_url: string }>({
        type: "object",
        properties: {
          connect_url: { type: "string", minLength: 1, maxLength: 4096 },
        },
        required: ["connect_url"],
        additionalProperties: false,
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ connect_url }, context) => {
      try {
        const result = await completeTestRequest(
          connect_url,
          context.mcpReq.signal,
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
          structuredContent: result,
        };
      } catch (error) {
        const known =
          error instanceof TestRequestError
            ? error
            : new TestRequestError("request_failed", "input");
        const result = {
          error: known.code,
          stage: known.stage,
          outcome: known.outcome,
          error_delivered: known.errorDelivered,
        };
        return {
          isError: true,
          content: [{ type: "text", text: JSON.stringify(result) }],
          structuredContent: result,
        };
      }
    },
  );
  return server;
});
