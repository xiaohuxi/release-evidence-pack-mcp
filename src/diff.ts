import type { JsonValue, ToolContractSnapshot } from "./contracts.js";

export type ChangeSeverity = "breaking" | "risky" | "compatible";

export interface ContractChange {
  severity: ChangeSeverity;
  code: string;
  tool: string;
  path?: string;
  detail: string;
}

type ToolRecord = Record<string, JsonValue> & { name: string };

function toolsByName(snapshot: ToolContractSnapshot): Map<string, ToolRecord> {
  return new Map(
    snapshot.tools.map((tool) => {
      const record = tool as ToolRecord;
      return [record.name, record];
    })
  );
}

function requiredInputs(tool: ToolRecord): string[] {
  const schema = tool.inputSchema as Record<string, JsonValue> | undefined;
  return Array.isArray(schema?.required) ? schema.required.filter((item): item is string => typeof item === "string") : [];
}

function annotations(tool: ToolRecord): Record<string, JsonValue> {
  return (tool.annotations as Record<string, JsonValue> | undefined) ?? {};
}

function inputSchemaWithoutRequired(tool: ToolRecord): Record<string, JsonValue> {
  const schema = (tool.inputSchema as Record<string, JsonValue> | undefined) ?? {};
  const { required: _required, ...rest } = schema;
  return rest;
}

export function diffToolContracts(before: ToolContractSnapshot, after: ToolContractSnapshot) {
  const changes: ContractChange[] = [];
  const oldTools = toolsByName(before);
  const newTools = toolsByName(after);

  for (const name of [...oldTools.keys()].sort()) {
    if (!newTools.has(name)) {
      changes.push({ severity: "breaking", code: "TOOL_REMOVED", tool: name, detail: `Tool ${name} was removed.` });
      continue;
    }

    const oldTool = oldTools.get(name)!;
    const newTool = newTools.get(name)!;
    const oldRequired = new Set(requiredInputs(oldTool));
    const addedRequired = requiredInputs(newTool).filter((input) => !oldRequired.has(input));
    for (const input of addedRequired) {
      changes.push({
        severity: "breaking",
        code: "REQUIRED_INPUT_ADDED",
        tool: name,
        path: input,
        detail: `Required input ${input} was added.`
      });
    }

    if (addedRequired.length === 0 && JSON.stringify(inputSchemaWithoutRequired(oldTool)) !== JSON.stringify(inputSchemaWithoutRequired(newTool))) {
      changes.push({
        severity: "risky",
        code: "INPUT_SCHEMA_CHANGED",
        tool: name,
        detail: "The input schema changed beyond required-field additions."
      });
    }

    if (annotations(oldTool).readOnlyHint === true && annotations(newTool).readOnlyHint !== true) {
      changes.push({
        severity: "risky",
        code: "READ_ONLY_DOWNGRADED",
        tool: name,
        detail: "readOnlyHint changed from true to a value other than true."
      });
    }

    if (JSON.stringify(oldTool.outputSchema) !== JSON.stringify(newTool.outputSchema)) {
      changes.push({
        severity: "risky",
        code: "OUTPUT_SCHEMA_CHANGED",
        tool: name,
        detail: "The output schema changed and fixtures should be replayed."
      });
    }
  }

  for (const name of [...newTools.keys()].sort()) {
    if (!oldTools.has(name)) {
      changes.push({ severity: "compatible", code: "TOOL_ADDED", tool: name, detail: `Tool ${name} was added.` });
    }
  }

  return {
    summary: {
      breaking: changes.filter((change) => change.severity === "breaking").length,
      risky: changes.filter((change) => change.severity === "risky").length,
      compatible: changes.filter((change) => change.severity === "compatible").length
    },
    changes
  };
}
