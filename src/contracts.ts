export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface ToolContractLike {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  annotations?: Record<string, unknown>;
}

export interface ToolContractSnapshot {
  protocol: "mcp-tools-v1";
  tools: JsonValue[];
}

function normalizeValue(value: unknown, parentKey?: string): JsonValue {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    const items = value.map((item) => normalizeValue(item));
    return parentKey === "required" && items.every((item) => typeof item === "string")
      ? [...items].sort()
      : items;
  }
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, normalizeValue(item, key)])
    );
  }
  return String(value);
}

export function normalizeToolContract(tools: ToolContractLike[]): ToolContractSnapshot {
  return {
    protocol: "mcp-tools-v1",
    tools: [...tools]
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((tool) => normalizeValue(tool))
  };
}
