#!/usr/bin/env node

import { delimiter, resolve } from "node:path";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServer } from "./server.js";

export function resolveAllowedRoots(raw = process.env.RELEASE_EVIDENCE_ALLOWED_ROOTS): string[] {
  const values = raw ? raw.split(delimiter).map((item) => item.trim()).filter(Boolean) : [process.cwd()];
  return [...new Set(values.map((item) => resolve(item)))];
}

async function main(): Promise<void> {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    process.stdout.write("release-evidence-pack-mcp\n\nSet RELEASE_EVIDENCE_ALLOWED_ROOTS to allowed repository roots.\n");
    return;
  }
  const server = createMcpServer(resolveAllowedRoots());
  await server.connect(new StdioServerTransport());
  console.error("release-evidence-pack-mcp running on stdio");
}

main().catch((error) => {
  console.error(`release-evidence-pack-mcp failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
