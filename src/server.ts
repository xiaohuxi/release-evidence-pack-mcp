import { isAbsolute, relative, resolve } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { collectReleaseEvidence, renderMarkdown, summarizeTestReports } from "./tools.js";

function asToolResult(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

export function isRepositoryAllowed(repositoryRoot: string, allowedRoots: string[]): boolean {
  const root = resolve(repositoryRoot);
  return allowedRoots.some((candidate) => {
    const rel = relative(resolve(candidate), root);
    return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
  });
}

function requireAllowedRoot(repositoryRoot: string, allowedRoots: string[]): string {
  const root = resolve(repositoryRoot);
  if (!isRepositoryAllowed(root, allowedRoots)) {
    throw new Error("repositoryRoot is outside RELEASE_EVIDENCE_ALLOWED_ROOTS");
  }
  return root;
}

const toolAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false
};

export function createMcpServer(allowedRoots: string[]): McpServer {
  const server = new McpServer({ name: "release-evidence-pack-mcp", version: "1.0.0" });
  const commonSchema = {
    repositoryRoot: z.string().min(1).describe("Absolute path to a local Git repository"),
    baseRef: z.string().min(1).default("HEAD").describe("Git base revision used for the working-tree diff")
  };

  server.registerTool("inspect_release_changes", {
    title: "Inspect release changes",
    description: "Inspect a local Git diff and classify release risk without changing the repository.",
    inputSchema: commonSchema,
    annotations: toolAnnotations
  }, async ({ repositoryRoot, baseRef }) => {
    const evidence = await collectReleaseEvidence({
      repositoryRoot: requireAllowedRoot(repositoryRoot, allowedRoots), baseRef, reportFiles: []
    });
    return asToolResult({ changes: evidence.changes, assessment: evidence.assessment });
  });

  server.registerTool("summarize_test_reports", {
    title: "Summarize test reports",
    description: "Summarize local JUnit XML reports without returning testcase logs or captured output.",
    inputSchema: {
      repositoryRoot: commonSchema.repositoryRoot,
      reportFiles: z.array(z.string().min(1)).min(1).describe("JUnit XML paths relative to repositoryRoot")
    },
    annotations: toolAnnotations
  }, async ({ repositoryRoot, reportFiles }) => asToolResult(await summarizeTestReports(
    requireAllowedRoot(repositoryRoot, allowedRoots), reportFiles
  )));

  server.registerTool("build_release_evidence_pack", {
    title: "Build release evidence pack",
    description: "Combine Git changes and JUnit reports into a risk decision, findings, and rollback checklist.",
    inputSchema: {
      ...commonSchema,
      reportFiles: z.array(z.string().min(1)).default([]).describe("JUnit XML paths relative to repositoryRoot")
    },
    annotations: toolAnnotations
  }, async ({ repositoryRoot, baseRef, reportFiles }) => {
    const evidence = await collectReleaseEvidence({
      repositoryRoot: requireAllowedRoot(repositoryRoot, allowedRoots), baseRef, reportFiles
    });
    return asToolResult({ evidence, markdown: renderMarkdown(evidence) });
  });

  return server;
}
