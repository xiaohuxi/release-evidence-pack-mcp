export type SourceFile={path:string;content:string};
export type Control={type:string;component:string;attempts?:number;timeoutMs?:number;source:{path:string;evidence:string};confidence:"observed"};

export function inventoryResilienceControls(files:SourceFile[]){
  const controls:Control[]=[];
  for(const file of files){
    if(/openfeign|feign/i.test(file.content))controls.push({type:"feign-timeout",component:"feign",timeoutMs:numberAfter(file.content,/readTimeout\s*:\s*(\d+)/i),source:{path:file.path,evidence:"Feign timeout configuration"},confidence:"observed"});
    if(/resilience4j[\s\S]*retry/i.test(file.content))controls.push({type:"resilience4j-retry",component:"resilience4j",attempts:numberAfter(file.content,/maxAttempts\s*:\s*(\d+)/i),source:{path:file.path,evidence:"Resilience4j retry configuration"},confidence:"observed"});
    if(/kafka|rocketmq|rabbitmq|dead[- ]?letter|ack-mode/i.test(file.content))controls.push({type:"mq-redelivery",component:"message-consumer",source:{path:file.path,evidence:"Message listener or redelivery configuration"},confidence:"observed"});
    if(/@Retryable|RetryTemplate/.test(file.content))controls.push({type:"spring-retry",component:"application",attempts:numberAfter(file.content,/maxAttempts\s*=\s*(\d+)/),source:{path:file.path,evidence:"Spring Retry annotation or template"},confidence:"observed"});
    if(/CircuitBreaker|FallbackFactory|fallback\s*=/.test(file.content))controls.push({type:"circuit-breaker-fallback",component:"application",source:{path:file.path,evidence:"Circuit breaker or fallback declaration"},confidence:"observed"});
  }
  return {controls};
}
function numberAfter(text:string,re:RegExp){const value=text.match(re)?.[1];return value?Number(value):undefined;}
