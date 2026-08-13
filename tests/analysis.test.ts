import { describe, expect, test } from "vitest";
import { detectRetryAmplification, renderFailurePath } from "../src/analysis.js";

describe("resilience path analysis", () => {
  test("multiplies nested retries and detects timeout inversion", () => {
    const result = detectRetryAmplification({nodes:[
      {id:"gateway",kind:"gateway",attempts:3,timeoutMs:2000},
      {id:"order",kind:"feign",attempts:2,timeoutMs:5000},
      {id:"stock",kind:"retry",attempts:3,timeoutMs:1500,write:true,idempotency:false},
      {id:"mq",kind:"mq",attempts:5,timeoutMs:1000}
    ],edges:[["gateway","order"],["order","stock"],["stock","mq"]]});
    expect(result.maxExecutions).toBe(90);
    expect(result.findings.map(f=>f.code)).toEqual(expect.arrayContaining(["RETRY_AMPLIFICATION","TIMEOUT_INVERSION","NON_IDEMPOTENT_RETRY","MQ_BUSINESS_RETRY_OVERLAP"]));
  });

  test("renders an evidence-labelled Mermaid failure path", () => {
    const diagram=renderFailurePath({nodes:[{id:"api",kind:"feign",attempts:2,timeoutMs:1000}],edges:[]});
    expect(diagram).toContain("flowchart LR");
    expect(diagram).toContain("api<br/>feign | 2 attempts | 1000ms");
  });
});
