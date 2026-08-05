import { resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..");
const targetConfig = {
  fixture: {
    command: process.execPath,
    args: [resolve(projectRoot, "tests/fixtures/fake-target.mjs")],
    cwd: projectRoot
  }
};

const client = new Client({ name: "tool-contract-replay-test", version: "1.0.0" });
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [resolve(projectRoot, "dist/index.js")],
  cwd: projectRoot,
  env: { TOOL_CONTRACT_REPLAY_TARGETS: JSON.stringify(targetConfig) },
  stderr: "pipe"
});

function parseText(result: Awaited<ReturnType<Client["callTool"]>>) {
  const item = result.content.find((content) => content.type === "text");
  return JSON.parse(item?.type === "text" ? item.text : "{}");
}

describe("stdio MCP server", () => {
  beforeAll(async () => client.connect(transport));
  afterAll(async () => client.close());

  test("exposes three read-only contract tools and executes the full workflow", async () => {
    const listed = await client.listTools();
    expect(listed.tools.map((tool) => tool.name).sort()).toEqual([
      "diff_mcp_contract",
      "replay_contract_fixtures",
      "snapshot_mcp_contract"
    ]);
    expect(listed.tools.every((tool) => tool.annotations?.readOnlyHint === true)).toBe(true);

    const snapshot = parseText(await client.callTool({
      name: "snapshot_mcp_contract",
      arguments: { targetId: "fixture" }
    }));
    expect(snapshot.tools[0].name).toBe("inspect");

    const changed = structuredClone(snapshot);
    changed.tools = [];
    const diff = parseText(await client.callTool({
      name: "diff_mcp_contract",
      arguments: { before: snapshot, after: changed }
    }));
    expect(diff.summary.breaking).toBe(2);

    const replay = parseText(await client.callTool({
      name: "replay_contract_fixtures",
      arguments: {
        targetId: "fixture",
        fixtures: [{
          name: "inspect-demo",
          tool: "inspect",
          arguments: { project: "demo" },
          expect: { isError: false, contentTypes: ["text"], structuredKeys: ["accessToken", "findings", "summary"] }
        }]
      }
    }));
    expect(replay).toEqual(expect.objectContaining({ total: 1, passed: 1, failed: 0 }));
  }, 15_000);
});
