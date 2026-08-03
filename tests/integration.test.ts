import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { collectReleaseEvidence, renderMarkdown } from "../src/tools.js";

function git(root: string, ...args: string[]): void {
  execFileSync("git", args, { cwd: root, stdio: "ignore" });
}

describe("release evidence collection", () => {
  test("collects a real Git diff and JUnit report into a release decision", async () => {
    const root = mkdtempSync(join(tmpdir(), "release-evidence-"));
    mkdirSync(join(root, "src"));
    mkdirSync(join(root, "db"));
    mkdirSync(join(root, "reports"));
    writeFileSync(join(root, "src", "app.ts"), "export const version = 1;\n");
    writeFileSync(join(root, "db", "V1.sql"), "CREATE TABLE legacy_order(id int);\n");
    git(root, "init", "-b", "main");
    git(root, "config", "user.email", "test@example.com");
    git(root, "config", "user.name", "Test");
    git(root, "add", ".");
    git(root, "commit", "-m", "baseline");

    writeFileSync(join(root, "src", "app.ts"), "export const version = 2;\n");
    writeFileSync(join(root, "db", "V1.sql"), "DROP TABLE legacy_order;\n");
    writeFileSync(join(root, "reports", "TEST-api.xml"), '<testsuite tests="3" failures="0" errors="0" skipped="0" time="0.2"/>');

    const pack = await collectReleaseEvidence({
      repositoryRoot: root,
      baseRef: "HEAD",
      reportFiles: ["reports/TEST-api.xml"]
    });

    expect(pack.changes).toHaveLength(2);
    expect(pack.reports[0].passed).toBe(3);
    expect(pack.assessment.decision).toBe("block");
    expect(renderMarkdown(pack)).toContain("DESTRUCTIVE_DDL");
  });
});
