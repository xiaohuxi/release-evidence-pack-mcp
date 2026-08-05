import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport, getDefaultEnvironment } from "@modelcontextprotocol/sdk/client/stdio.js";
import { normalizeToolContract, type ToolContractSnapshot } from "./contracts.js";
import { evaluateFixture, type ReplayFixture, type ToolCallResponse } from "./replay.js";

export interface TargetConfig {
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
}

async function withTargetClient<T>(target: TargetConfig, action: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ name: "tool-contract-replay", version: "1.0.0" });
  const transport = new StdioClientTransport({
    command: target.command,
    args: target.args ?? [],
    cwd: target.cwd,
    env: { ...getDefaultEnvironment(), ...(target.env ?? {}) },
    stderr: "pipe"
  });
  await client.connect(transport);
  try {
    return await action(client);
  } finally {
    await client.close();
  }
}

export async function snapshotTarget(target: TargetConfig): Promise<ToolContractSnapshot> {
  return withTargetClient(target, async (client) => {
    const response = await client.listTools();
    return normalizeToolContract(response.tools);
  });
}

export async function replayTargetFixtures(target: TargetConfig, fixtures: ReplayFixture[]) {
  const results = await withTargetClient(target, async (client) => {
    const listed = await client.listTools();
    const tools = new Map(listed.tools.map((tool) => [tool.name, tool]));
    for (const fixture of fixtures) {
      const tool = tools.get(fixture.tool);
      if (!tool) {
        throw new Error(`Tool ${fixture.tool} is not exposed by the target.`);
      }
      if (tool.annotations?.readOnlyHint !== true) {
        throw new Error(`Tool ${fixture.tool} is not declared read-only; replay was blocked.`);
      }
    }

    const collected = [];
    for (const fixture of fixtures) {
      const response = await client.callTool({ name: fixture.tool, arguments: fixture.arguments });
      collected.push(evaluateFixture(fixture, response as ToolCallResponse));
    }
    return collected;
  });

  return {
    total: results.length,
    passed: results.filter((result) => result.passed).length,
    failed: results.filter((result) => !result.passed).length,
    results
  };
}
