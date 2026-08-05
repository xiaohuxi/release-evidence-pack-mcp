import { describe, expect, test } from "vitest";
import { parseTargets } from "../src/targets.js";

describe("parseTargets", () => {
  test("accepts an operator-controlled target allowlist", () => {
    expect(
      parseTargets(
        JSON.stringify({
          local: { command: "node", args: ["server.js"], cwd: "/workspace", env: { MODE: "test" } }
        })
      )
    ).toEqual({
      local: { command: "node", args: ["server.js"], cwd: "/workspace", env: { MODE: "test" } }
    });
  });

  test("rejects a malformed target instead of executing it", () => {
    expect(() => parseTargets('{"unsafe":{"command":""}}')).toThrow("Invalid TOOL_CONTRACT_REPLAY_TARGETS");
  });
});
