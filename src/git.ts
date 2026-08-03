import type { FileChange } from "./types.js";

export function parseNameStatus(output: string): FileChange[] {
  return output
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const [status, firstPath, secondPath] = line.split("\t");
      if (status.startsWith("R") || status.startsWith("C")) {
        return { status, path: secondPath, previousPath: firstPath };
      }
      return { status, path: firstPath };
    });
}
