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
      instructions:
        "Complete a real staging IDKit request with complete_test_request. Only native v4 Proof of Human uniqueness requests are supported. proof_delivered means the proof reached IDKit; check the application's actual backend response and business effects separately. An unknown outcome must be checked on the original IDKit request before another attempt. Never log or repeat connection URLs, which contain an encryption key.",
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
