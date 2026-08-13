export type ControlNode={id:string;kind:string;attempts:number;timeoutMs?:number;write?:boolean;idempotency?:boolean;fallback?:string;circuitBreaker?:boolean};
export type ResiliencePath={nodes:ControlNode[];edges:[string,string][]};
export type Finding={severity:"medium"|"high"|"critical";code:string;detail:string};
