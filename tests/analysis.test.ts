import { describe, expect, test } from "vitest";
import { parseNameStatus } from "../src/git.js";
import { summarizeJUnitXml } from "../src/reports.js";
import { assessRelease } from "../src/risk.js";

describe("release evidence analysis", () => {
  test("parses Git name-status including renames", () => {
    expect(parseNameStatus("M\tsrc/app.ts\nA\tdb/V2__add.sql\nR100\told.yml\tnew.yml\n")).toEqual([
      { status: "M", path: "src/app.ts" },
      { status: "A", path: "db/V2__add.sql" },
      { status: "R100", path: "new.yml", previousPath: "old.yml" }
    ]);
  });

  test("summarizes JUnit suites without exposing testcase output", () => {
    const xml = '<testsuites tests="5" failures="1" errors="1" skipped="2" time="1.25"><testsuite name="api"/></testsuites>';
    expect(summarizeJUnitXml(xml, "reports/TEST-api.xml")).toEqual({
      file: "reports/TEST-api.xml",
      tests: 5,
      failures: 1,
      errors: 1,
      skipped: 2,
      durationSeconds: 1.25,
      passed: 1
    });
  });

  test("aggregates multiple JUnit suites when the wrapper has no totals", () => {
    const xml = '<testsuites><testsuite tests="2" failures="0" errors="0" skipped="1" time="0.1"/><testsuite tests="3" failures="1" errors="0" skipped="0" time="0.2"/></testsuites>';
    expect(summarizeJUnitXml(xml, "reports/all.xml")).toMatchObject({
      tests: 5,
      failures: 1,
      errors: 0,
      skipped: 1,
      passed: 3,
      durationSeconds: 0.3
    });
  });

  test("flags destructive DDL and missing test evidence as release blockers", () => {
    const result = assessRelease({
      changes: [
        { status: "M", path: "src/order.ts" },
        { status: "A", path: "db/V3__drop_legacy.sql", patch: "DROP TABLE legacy_order;" }
      ],
      reports: []
    });

    expect(result.decision).toBe("block");
    expect(result.riskLevel).toBe("critical");
    expect(result.findings.map((item) => item.code)).toEqual(expect.arrayContaining([
      "DESTRUCTIVE_DDL",
      "TEST_EVIDENCE_MISSING"
    ]));
  });
});
