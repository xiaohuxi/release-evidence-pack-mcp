import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { diffToolContracts } from "./diff.js";
import { replayTargetFixtures, snapshotTarget } from "./target-client.js";
import { requireTarget, type parseTargets } from "./targets.js";
import type { ReplayFixture } from "./replay.js";
import type { ToolContractSnapshot } from "./contracts.js";

type Targets = ReturnType<typeof parseTargets>;

const localAnalysisAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false
};

const targetAccessAnnotations = {
  ...localAnalysisAnnotations,
  openWorldHint: true
};

const snapshotSchema = z.object({
  protocol: z.literal("mcp-tools-v1"),
  tools: z.array(z.record(z.string(), z.unknown()))
});

const fixtureSchema = z.object({
  name: z.string().min(1),
  tool: z.string().min(1),
  arguments: z.record(z.string(), z.unknown()).default({}),
  expect: z.object({
    isError: z.boolean(),
    contentTypes: z.array(z.string()).optional(),
    structuredKeys: z.array(z.string()).optional()
  })
});

function asToolResult(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

export function createMcpServer(targets: Targets): McpServer {
  const server = new McpServer({ name: "tool-contract-replay-mcp", version: "1.0.0" });

  server.registerTool("snapshot_mcp_contract", {
    title: "Snapshot MCP tool contract",
    description: "Connect to an operator-allowlisted stdio MCP target and return a deterministic tool contract snapshot.",
    inputSchema: { targetId: z.string().min(1).describe("Target key configured in TOOL_CONTRACT_REPLAY_TARGETS") },
    annotations: targetAccessAnnotations
  }, async ({ targetId }) => asToolResult(await snapshotTarget(requireTarget(targets, targetId))));

  server.registerTool("diff_mcp_contract", {
    title: "Diff MCP tool contracts",
    description: "Compare two normalized MCP tool snapshots and classify breaking, risky, and compatible changes.",
    inputSchema: { before: snapshotSchema, after: snapshotSchema },
    annotations: localAnalysisAnnotations
  }, async ({ before, after }) => asToolResult(diffToolContracts(
    before as ToolContractSnapshot,
    after as ToolContractSnapshot
  )));

  server.registerTool("replay_contract_fixtures", {
    title: "Replay MCP contract fixtures",
    description: "Replay deterministic fixtures against an allowlisted MCP target and report only redacted structural observations.",
    inputSchema: {
      targetId: z.string().min(1).describe("Target key configured in TOOL_CONTRACT_REPLAY_TARGETS"),
      fixtures: z.array(fixtureSchema).min(1).max(100)
    },
    annotations: targetAccessAnnotations
  }, async ({ targetId, fixtures }) => asToolResult(await replayTargetFixtures(
    requireTarget(targets, targetId),
    fixtures as ReplayFixture[]
  )));

  return server;
}
