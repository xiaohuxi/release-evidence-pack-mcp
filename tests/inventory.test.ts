import { describe, expect, test } from "vitest";
import { inventoryResilienceControls } from "../src/inventory.js";

describe("inventory",()=>{
  test("finds Feign, Resilience4j and MQ retry controls from supplied files",()=>{
    const result=inventoryResilienceControls([{path:"application.yml",content:`spring:\n  cloud:\n    openfeign:\n      client:\n        config:\n          stock:\n            connectTimeout: 1000\n            readTimeout: 3000\nresilience4j:\n  retry:\n    instances:\n      stock:\n        maxAttempts: 3\nspring.kafka.listener.ack-mode: record\n`}]);
    expect(result.controls.map(c=>c.type)).toEqual(expect.arrayContaining(["feign-timeout","resilience4j-retry","mq-redelivery"]));
    expect(result.controls.every(c=>c.source.path==="application.yml")).toBe(true);
  });
});
