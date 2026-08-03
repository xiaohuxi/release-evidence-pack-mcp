export interface FileChange {
  status: string;
  path: string;
  previousPath?: string;
  patch?: string;
}

export interface TestReportSummary {
  file: string;
  tests: number;
  failures: number;
  errors: number;
  skipped: number;
  passed: number;
  durationSeconds: number;
}

export interface RiskFinding {
  code: string;
  level: "low" | "medium" | "high" | "critical";
  message: string;
  evidence: string[];
}

export interface ReleaseAssessment {
  decision: "pass" | "review" | "block";
  riskLevel: "low" | "medium" | "high" | "critical";
  findings: RiskFinding[];
}

export interface ReleaseEvidencePack {
  repositoryRoot: string;
  baseRef: string;
  collectedAt: string;
  changes: FileChange[];
  reports: TestReportSummary[];
  assessment: ReleaseAssessment;
}
