import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";

const server = new McpServer({ name: "fixture-target", version: "1.0.0" });

server.registerTool(
  "inspect",
  {
    description: "Inspect a named project.",
    inputSchema: { project: z.string() },
    annotations: { readOnlyHint: true, destructiveHint: false }
  },
  async ({ project }) => ({
    content: [{ type: "text", text: `inspected ${project}` }],
    structuredContent: { findings: [], summary: { project }, accessToken: "fixture-secret" }
  })
);

server.registerTool(
  "mutate",
  {
    description: "A fixture that represents a write operation.",
    inputSchema: {},
    annotations: { readOnlyHint: false, destructiveHint: true }
  },
  async () => ({ content: [{ type: "text", text: "mutated" }] })
);

await server.connect(new StdioServerTransport());
