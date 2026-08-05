import { describe, expect, test } from "vitest";
import { normalizeToolContract } from "../src/contracts.js";

describe("normalizeToolContract", () => {
  test("sorts tools and nested schema keys for a deterministic snapshot", () => {
    const snapshot = normalizeToolContract([
      {
        name: "zeta",
        description: "last",
        inputSchema: {
          type: "object",
          properties: {
            beta: { type: "string" },
            alpha: { type: "number" }
          },
          required: ["beta", "alpha"]
        }
      },
      {
        name: "alpha",
        inputSchema: { type: "object", properties: {} },
        annotations: { readOnlyHint: true }
      }
    ]);

    expect(snapshot).toEqual({
      protocol: "mcp-tools-v1",
      tools: [
        {
          annotations: { readOnlyHint: true },
          inputSchema: { properties: {}, type: "object" },
          name: "alpha"
        },
        {
          description: "last",
          inputSchema: {
            properties: {
              alpha: { type: "number" },
              beta: { type: "string" }
            },
            required: ["alpha", "beta"],
            type: "object"
          },
          name: "zeta"
        }
      ]
    });
  });
});
