import { describe, expect, test } from "vitest";
import { diffToolContracts } from "../src/diff.js";

describe("diffToolContracts", () => {
  test("marks a removed tool and a new required input as breaking", () => {
    const result = diffToolContracts(
      {
        protocol: "mcp-tools-v1",
        tools: [
          { name: "legacy", inputSchema: { type: "object", properties: {} } },
          {
            name: "search",
            inputSchema: {
              type: "object",
              properties: { query: { type: "string" } },
              required: ["query"]
            }
          }
        ]
      },
      {
        protocol: "mcp-tools-v1",
        tools: [
          {
            name: "search",
            inputSchema: {
              type: "object",
              properties: {
                query: { type: "string" },
                tenant: { type: "string" }
              },
              required: ["query", "tenant"]
            }
          }
        ]
      }
    );

    expect(result.summary).toEqual({ breaking: 2, risky: 0, compatible: 0 });
    expect(result.changes).toEqual([
      {
        severity: "breaking",
        code: "TOOL_REMOVED",
        tool: "legacy",
        detail: "Tool legacy was removed."
      },
      {
        severity: "breaking",
        code: "REQUIRED_INPUT_ADDED",
        tool: "search",
        path: "tenant",
        detail: "Required input tenant was added."
      }
    ]);
  });

  test("marks a read-only annotation downgrade as risky", () => {
    const result = diffToolContracts(
      {
        protocol: "mcp-tools-v1",
        tools: [
          {
            name: "inspect",
            inputSchema: { type: "object", properties: {} },
            annotations: { readOnlyHint: true }
          }
        ]
      },
      {
        protocol: "mcp-tools-v1",
        tools: [
          {
            name: "inspect",
            inputSchema: { type: "object", properties: {} },
            annotations: {}
          }
        ]
      }
    );

    expect(result.changes).toContainEqual({
      severity: "risky",
      code: "READ_ONLY_DOWNGRADED",
      tool: "inspect",
      detail: "readOnlyHint changed from true to a value other than true."
    });
  });

  test("marks a changed input type as risky when required fields stay compatible", () => {
    const result = diffToolContracts(
      {
        protocol: "mcp-tools-v1",
        tools: [{
          name: "search",
          inputSchema: { type: "object", properties: { limit: { type: "number" } } }
        }]
      },
      {
        protocol: "mcp-tools-v1",
        tools: [{
          name: "search",
          inputSchema: { type: "object", properties: { limit: { type: "string" } } }
        }]
      }
    );

    expect(result.changes).toContainEqual({
      severity: "risky",
      code: "INPUT_SCHEMA_CHANGED",
      tool: "search",
      detail: "The input schema changed beyond required-field additions."
    });
  });
});
