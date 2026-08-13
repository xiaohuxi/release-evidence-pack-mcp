import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { inventoryResilienceControls } from "./inventory.js";
import { detectRetryAmplification,renderFailurePath } from "./analysis.js";
import type { ResiliencePath } from "./types.js";

const annotations={readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false};
const nodeSchema=z.object({id:z.string(),kind:z.string(),attempts:z.number().int().min(1).max(100),timeoutMs:z.number().positive().optional(),write:z.boolean().optional(),idempotency:z.boolean().optional(),fallback:z.string().optional(),circuitBreaker:z.boolean().optional()});
const pathSchema={nodes:z.array(nodeSchema).min(1).max(200),edges:z.array(z.tuple([z.string(),z.string()])).max(500)};
const result=(value:unknown)=>({content:[{type:"text" as const,text:JSON.stringify(value,null,2)}]});

export function createServer(){
 const server=new McpServer({name:"resilience-path-map-mcp",version:"1.0.0"});
 server.registerTool("inventory_resilience_controls",{description:"Inventory resilience controls from caller-supplied Spring configuration and source excerpts.",inputSchema:{files:z.array(z.object({path:z.string(),content:z.string().max(500_000)})).min(1).max(200)},annotations},async({files})=>result(inventoryResilienceControls(files)));
 server.registerTool("detect_retry_amplification",{description:"Calculate worst-case retry amplification and identify timeout, idempotency, MQ and fallback conflicts.",inputSchema:pathSchema,annotations},async(input)=>result(detectRetryAmplification(input as ResiliencePath)));
 server.registerTool("render_failure_path",{description:"Render an evidence-labelled Mermaid failure path without executing any target system.",inputSchema:pathSchema,annotations},async(input)=>result({mermaid:renderFailurePath(input as ResiliencePath)}));
 return server;
}
