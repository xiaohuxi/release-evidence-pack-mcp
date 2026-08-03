import type { FileChange, ReleaseAssessment, RiskFinding, TestReportSummary } from "./types.js";

const LEVEL_ORDER = { low: 0, medium: 1, high: 2, critical: 3 } as const;

export function assessRelease(input: {
  changes: FileChange[];
  reports: TestReportSummary[];
}): ReleaseAssessment {
  const findings: RiskFinding[] = [];
  const destructiveDdl = input.changes.filter((change) =>
    change.path.toLowerCase().endsWith(".sql") &&
    /\b(drop\s+(table|column|index)|truncate\s+table)\b/i.test(change.patch ?? "")
  );
  if (destructiveDdl.length > 0) {
    findings.push({
      code: "DESTRUCTIVE_DDL",
      level: "critical",
      message: "Destructive database statements require an explicit migration and rollback review.",
      evidence: destructiveDdl.map((change) => change.path)
    });
  }

  const codeChanges = input.changes.filter((change) =>
    /(^|\/)(src|app|lib)\//i.test(change.path) || /\.(java|kt|ts|tsx|js|jsx|py|go|rs)$/i.test(change.path)
  );
  if (codeChanges.length > 0 && input.reports.length === 0) {
    findings.push({
      code: "TEST_EVIDENCE_MISSING",
      level: "high",
      message: "Code changed but no machine-readable test report was supplied.",
      evidence: codeChanges.map((change) => change.path)
    });
  }

  const failedReports = input.reports.filter((report) => report.failures + report.errors > 0);
  if (failedReports.length > 0) {
    findings.push({
      code: "TEST_FAILURES",
      level: "critical",
      message: "At least one supplied test report contains failures or errors.",
      evidence: failedReports.map((report) => report.file)
    });
  }

  const riskLevel = findings.reduce<ReleaseAssessment["riskLevel"]>(
    (highest, finding) => LEVEL_ORDER[finding.level] > LEVEL_ORDER[highest] ? finding.level : highest,
    "low"
  );
  const decision = riskLevel === "critical" ? "block" : riskLevel === "high" ? "review" : "pass";
  return { decision, riskLevel, findings };
}
