import type { TestReportSummary } from "./types.js";

function readNumber(attributes: string, name: string): number {
  const match = attributes.match(new RegExp(`\\b${name}=["']([^"']+)["']`));
  return match ? Number(match[1]) : 0;
}

export function summarizeJUnitXml(xml: string, file: string): TestReportSummary {
  const wrapper = xml.match(/<testsuites\b([^>]*)>/i)?.[1];
  const sources = wrapper && /\btests=["']/i.test(wrapper)
    ? [wrapper]
    : [...xml.matchAll(/<testsuite\b([^>]*)>/gi)].map((match) => match[1]);
  const sum = (name: string) => sources.reduce((total, source) => total + readNumber(source, name), 0);
  const tests = sum("tests");
  const failures = sum("failures");
  const errors = sum("errors");
  const skipped = sum("skipped");
  return {
    file,
    tests,
    failures,
    errors,
    skipped,
    durationSeconds: Number(sum("time").toFixed(6)),
    passed: Math.max(0, tests - failures - errors - skipped)
  };
}
