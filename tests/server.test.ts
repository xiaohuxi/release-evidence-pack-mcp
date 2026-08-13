import { describe,expect,test } from "vitest";
import { createServer } from "../src/server.js";

describe("MCP server",()=>{
  test("registers exactly three read-only analysis tools",()=>{
    const server=createServer();
    const tools=(server as any)._registeredTools;
    expect(Object.keys(tools).sort()).toEqual(["detect_retry_amplification","inventory_resilience_controls","render_failure_path"]);
    expect(Object.values(tools).every((t:any)=>t.annotations.readOnlyHint===true&&t.annotations.destructiveHint===false)).toBe(true);
  });
});
