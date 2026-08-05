import { describe, expect, test } from "vitest";
import { evaluateFixture, redactSensitiveValues } from "../src/replay.js";

describe("redactSensitiveValues", () => {
  test("redacts nested credentials without removing surrounding evidence", () => {
    expect(
      redactSensitiveValues({
        result: { accessToken: "top-secret", count: 2 },
        password: "hidden",
        label: "safe"
      })
    ).toEqual({
      result: { accessToken: "[REDACTED]", count: 2 },
      password: "[REDACTED]",
      label: "safe"
    });
  });
});

describe("evaluateFixture", () => {
  test("passes when error state, content types, and structured keys match", () => {
    const result = evaluateFixture(
      {
        name: "inspect-project",
        tool: "inspect",
        arguments: { project: "demo" },
        expect: {
          isError: false,
          contentTypes: ["text"],
          structuredKeys: ["findings", "summary"]
        }
      },
      {
        isError: false,
        content: [{ type: "text", text: "ok" }],
        structuredContent: { summary: {}, findings: [] }
      }
    );

    expect(result).toEqual({
      name: "inspect-project",
      tool: "inspect",
      passed: true,
      mismatches: [],
      observed: {
        isError: false,
        contentTypes: ["text"],
        structuredKeys: ["findings", "summary"]
      }
    });
  });
});
