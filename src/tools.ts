import { execFile } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import { promisify } from "node:util";
import { parseNameStatus } from "./git.js";
import { summarizeJUnitXml } from "./reports.js";
import { assessRelease } from "./risk.js";
import type { ReleaseEvidencePack } from "./types.js";

const execFileAsync = promisify(execFile);

export function validateBaseRef(value: string): string {
  const baseRef = value.trim();
  if (!baseRef || baseRef.startsWith("-") || /[\0\r\n]/.test(baseRef)) {
    throw new Error("baseRef must be a revision expression, not a Git option");
  }
  return baseRef;
}

function resolveInside(root: string, candidate: string): string {
  const absolute = resolve(root, candidate);
  const rel = relative(root, absolute);
  if (rel.startsWith("..") || isAbsolute(rel)) {
    throw new Error(`Path escapes repository root: ${candidate}`);
  }
  return absolute;
}

async function git(root: string, args: string[]): Promise<string> {
  const result = await execFileAsync("git", args, {
    cwd: root,
    windowsHide: true,
    maxBuffer: 10 * 1024 * 1024
  });
  return result.stdout;
}

export async function collectReleaseEvidence(input: {
  repositoryRoot: string;
  baseRef?: string;
  reportFiles?: string[];
}): Promise<ReleaseEvidencePack> {
  const repositoryRoot = resolve(input.repositoryRoot);
  const metadata = await stat(repositoryRoot);
  if (!metadata.isDirectory()) throw new Error("repositoryRoot must be a directory");
  await stat(resolve(repositoryRoot, ".git"));

  const baseRef = validateBaseRef(input.baseRef ?? "HEAD");
  const nameStatus = await git(repositoryRoot, ["diff", "--name-status", baseRef, "--"]);
  const changes = parseNameStatus(nameStatus);
  for (const change of changes) {
    change.patch = await git(repositoryRoot, ["diff", "--unified=0", baseRef, "--", change.path]);
  }

  const reports = [];
  for (const file of input.reportFiles ?? []) {
    const absolute = resolveInside(repositoryRoot, file);
    const xml = await readFile(absolute, "utf8");
    reports.push(summarizeJUnitXml(xml, file));
  }

  return {
    repositoryRoot,
    baseRef,
    collectedAt: new Date().toISOString(),
    changes,
    reports,
    assessment: assessRelease({ changes, reports })
  };
}

export async function summarizeTestReports(repositoryRoot: string, reportFiles: string[]) {
  const root = resolve(repositoryRoot);
  const reports = [];
  for (const file of reportFiles) {
    const absolute = resolveInside(root, file);
    reports.push(summarizeJUnitXml(await readFile(absolute, "utf8"), file));
  }
  return reports;
}

export function renderMarkdown(pack: ReleaseEvidencePack): string {
  const findings = pack.assessment.findings.length === 0
    ? "- None"
    : pack.assessment.findings.map((finding) =>
      `- **${finding.code} (${finding.level})**: ${finding.message} Evidence: ${finding.evidence.join(", ")}`
    ).join("\n");
  const reports = pack.reports.length === 0
    ? "- No machine-readable test reports supplied."
    : pack.reports.map((report) =>
      `- ${report.file}: ${report.passed} passed, ${report.failures} failed, ${report.errors} errors, ${report.skipped} skipped`
    ).join("\n");

  return `# Release Evidence Pack

## Decision

- Decision: **${pack.assessment.decision}**
- Risk: **${pack.assessment.riskLevel}**
- Base ref: \`${pack.baseRef}\`
- Changed files: ${pack.changes.length}

## Findings

${findings}

## Test Evidence

${reports}

## Rollback Checklist

- Identify the previous deployable artifact.
- Document database rollback or forward-fix steps.
- Confirm configuration compatibility.
- Assign an owner for each blocking finding.
`;
}
