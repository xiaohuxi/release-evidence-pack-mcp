import { describe, expect, test } from "vitest";
import { isRepositoryAllowed } from "../src/server.js";
import { validateBaseRef } from "../src/tools.js";

describe("repository allow-list", () => {
  test.runIf(process.platform === "win32")("rejects a repository on a different Windows drive", () => {
    expect(isRepositoryAllowed("C:\\outside\\repo", ["D:\\allowed"])).toBe(false);
  });

  test("accepts a repository nested beneath an allowed root", () => {
    expect(isRepositoryAllowed("D:\\allowed\\team\\repo", ["D:\\allowed"])).toBe(true);
  });

  test("rejects Git option injection through the base revision", () => {
    expect(() => validateBaseRef("--output=C:\\temp\\leak.txt")).toThrow("baseRef");
    expect(validateBaseRef("origin/main~1")).toBe("origin/main~1");
  });
});
