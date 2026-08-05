import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { replayTargetFixtures, snapshotTarget } from "../src/target-client.js";

const target = {
  command: process.execPath,
  args: [resolve(import.meta.dirname, "fixtures/fake-target.mjs")],
  cwd: resolve(import.meta.dirname, "..")
};

describe("target client", () => {
  test("snapshots a configured MCP target without persisting server data", async () => {
    const snapshot = await snapshotTarget(target);

    expect(snapshot.tools).toContainEqual(expect.objectContaining({
      name: "inspect",
      description: "Inspect a named project.",
      annotations: expect.objectContaining({ readOnlyHint: true })
    }));
  });

  test("replays fixtures and returns only redacted observations", async () => {
    const result = await replayTargetFixtures(target, [
      {
        name: "inspect-demo",
        tool: "inspect",
        arguments: { project: "demo", password: "fixture-input-secret" },
        expect: { isError: false, contentTypes: ["text"], structuredKeys: ["accessToken", "findings", "summary"] }
      }
    ]);

    expect(result).toEqual({
      total: 1,
      passed: 1,
      failed: 0,
      results: [expect.objectContaining({ name: "inspect-demo", passed: true })]
    });
    expect(JSON.stringify(result)).not.toContain("fixture-secret");
    expect(JSON.stringify(result)).not.toContain("fixture-input-secret");
  });

  test("refuses to replay a tool that is not explicitly read-only", async () => {
    await expect(replayTargetFixtures(target, [{
      name: "unsafe-write",
      tool: "mutate",
      arguments: {},
      expect: { isError: false }
    }])).rejects.toThrow("Tool mutate is not declared read-only");
  });
});
