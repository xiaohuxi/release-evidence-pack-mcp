import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join, resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..");
const repositoryRoot = mkdtempSync(join(tmpdir(), "release-evidence-stdio-"));
mkdirSync(join(repositoryRoot, "src"));
writeFileSync(join(repositoryRoot, "src", "app.ts"), "export const ready = true;\n");
execFileSync("git", ["init", "-b", "main"], { cwd: repositoryRoot });
execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repositoryRoot });
execFileSync("git", ["config", "user.name", "Test"], { cwd: repositoryRoot });
execFileSync("git", ["add", "."], { cwd: repositoryRoot });
execFileSync("git", ["commit", "-m", "baseline"], { cwd: repositoryRoot });
writeFileSync(join(repositoryRoot, "src", "app.ts"), "export const ready = false;\n");

const client = new Client({ name: "release-evidence-test", version: "1.0.0" });
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [resolve(projectRoot, "dist/index.js")],
  env: { RELEASE_EVIDENCE_ALLOWED_ROOTS: repositoryRoot.split(delimiter).join(delimiter) },
  cwd: projectRoot,
  stderr: "pipe"
});

describe("stdio MCP server", () => {
  beforeAll(async () => client.connect(transport));
  afterAll(async () => client.close());

  test("lists three read-only release evidence tools and builds a pack", async () => {
    const tools = await client.listTools();
    expect(tools.tools.map((tool) => tool.name).sort()).toEqual([
      "build_release_evidence_pack",
      "inspect_release_changes",
      "summarize_test_reports"
    ]);
    expect(tools.tools.every((tool) => tool.annotations?.readOnlyHint === true)).toBe(true);

    const result = await client.callTool({
      name: "build_release_evidence_pack",
      arguments: { repositoryRoot, baseRef: "HEAD", reportFiles: [] }
    });
    const text = result.content.find((item) => item.type === "text");
    const pack = JSON.parse(text?.type === "text" ? text.text : "{}");
    expect(pack.evidence.changes[0].path).toBe("src/app.ts");
    expect(pack.markdown).toContain("TEST_EVIDENCE_MISSING");
  });
});
