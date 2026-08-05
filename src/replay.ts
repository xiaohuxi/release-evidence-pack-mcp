export interface ReplayFixture {
  name: string;
  tool: string;
  arguments: Record<string, unknown>;
  expect: {
    isError: boolean;
    contentTypes?: string[];
    structuredKeys?: string[];
  };
}

export interface ToolCallResponse {
  isError?: boolean;
  content?: Array<{ type: string; [key: string]: unknown }>;
  structuredContent?: Record<string, unknown>;
}

const SENSITIVE_KEY = /(authorization|api[-_]?key|access[-_]?token|refresh[-_]?token|password|passwd|secret|credential|cookie)/i;

export function redactSensitiveValues(value: unknown, key?: string): unknown {
  if (key && SENSITIVE_KEY.test(key)) {
    return "[REDACTED]";
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveValues(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([entryKey, entryValue]) => [
        entryKey,
        redactSensitiveValues(entryValue, entryKey)
      ])
    );
  }
  return value;
}

export function evaluateFixture(fixture: ReplayFixture, response: ToolCallResponse) {
  const observed = {
    isError: response.isError ?? false,
    contentTypes: [...new Set((response.content ?? []).map((item) => item.type))].sort(),
    structuredKeys: Object.keys(response.structuredContent ?? {}).sort()
  };
  const mismatches: string[] = [];

  if (observed.isError !== fixture.expect.isError) {
    mismatches.push(`Expected isError=${fixture.expect.isError}, observed ${observed.isError}.`);
  }
  if (fixture.expect.contentTypes && JSON.stringify(observed.contentTypes) !== JSON.stringify([...fixture.expect.contentTypes].sort())) {
    mismatches.push("Content types changed.");
  }
  if (fixture.expect.structuredKeys && JSON.stringify(observed.structuredKeys) !== JSON.stringify([...fixture.expect.structuredKeys].sort())) {
    mismatches.push("Structured content keys changed.");
  }

  return {
    name: fixture.name,
    tool: fixture.tool,
    passed: mismatches.length === 0,
    mismatches,
    observed
  };
}
