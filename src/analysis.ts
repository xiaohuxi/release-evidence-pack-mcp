import type { Finding,ResiliencePath } from "./types.js";

export function detectRetryAmplification(path:ResiliencePath){
  const maxExecutions=path.nodes.reduce((n,x)=>n*Math.max(1,x.attempts),1);
  const findings:Finding[]=[];
  if(maxExecutions>=10)findings.push({severity:maxExecutions>=50?"critical":"high",code:"RETRY_AMPLIFICATION",detail:`Nested controls can execute the terminal operation up to ${maxExecutions} times.`});
  for(const [from,to] of path.edges){const a=path.nodes.find(n=>n.id===from);const b=path.nodes.find(n=>n.id===to);if(a?.timeoutMs&&b?.timeoutMs&&a.timeoutMs<b.timeoutMs*Math.max(1,b.attempts))findings.push({severity:"high",code:"TIMEOUT_INVERSION",detail:`${from} can time out before ${to} exhausts its retry budget.`});}
  if(path.nodes.some(n=>n.write&&n.attempts>1&&!n.idempotency))findings.push({severity:"critical",code:"NON_IDEMPOTENT_RETRY",detail:"A retried write has no observed idempotency protection."});
  if(path.nodes.some(n=>n.kind==="mq"&&n.attempts>1)&&path.nodes.some(n=>n.kind!=="mq"&&n.attempts>1))findings.push({severity:"critical",code:"MQ_BUSINESS_RETRY_OVERLAP",detail:"MQ redelivery and business retries multiply duplicate execution risk."});
  if(path.nodes.some(n=>n.circuitBreaker&&n.fallback==="success"))findings.push({severity:"high",code:"FALLBACK_MASKS_FAILURE",detail:"A circuit breaker fallback reports success and can hide the original failure."});
  return {maxExecutions,findings};
}

export function renderFailurePath(path:ResiliencePath){
  const lines=["flowchart LR",...path.nodes.map(n=>`  ${safe(n.id)}["${n.id}<br/>${n.kind} | ${n.attempts} attempts${n.timeoutMs?` | ${n.timeoutMs}ms`:""}"]`),...path.edges.map(([a,b])=>`  ${safe(a)} --> ${safe(b)}`)];
  return lines.join("\n");
}
function safe(id:string){return id.replace(/[^a-zA-Z0-9_]/g,"_");}
