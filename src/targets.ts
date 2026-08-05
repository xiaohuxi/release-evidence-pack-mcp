import * as z from "zod/v4";
import type { TargetConfig } from "./target-client.js";

const targetSchema = z.object({
  command: z.string().min(1),
  args: z.array(z.string()).optional(),
  cwd: z.string().min(1).optional(),
  env: z.record(z.string(), z.string()).optional()
});

const targetsSchema = z.record(z.string().min(1), targetSchema);

export function parseTargets(raw: string | undefined): Record<string, TargetConfig> {
  try {
    return targetsSchema.parse(JSON.parse(raw ?? "{}"));
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid TOOL_CONTRACT_REPLAY_TARGETS: ${detail}`);
  }
}

export function requireTarget(targets: Record<string, TargetConfig>, targetId: string): TargetConfig {
  const target = targets[targetId];
  if (!target) {
    throw new Error(`Unknown targetId ${targetId}. Configure it in TOOL_CONTRACT_REPLAY_TARGETS.`);
  }
  return target;
}
