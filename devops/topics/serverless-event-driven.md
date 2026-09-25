# Deep Dive: Serverless & Event-Driven — Functions, Durable, Event Grid, KEDA, Cold Start

> **Standalone deep dive:** Event-driven systems react; serverless makes them cheap + auto-scale. Core: triggers/bindings, queue reliability, orchestration, scale-to-zero, cold start realities.

---

## 1. Mental Model — Events, Not Polling

```
Polling (bad): while(true){ sleep(5); if new_orders(): process() }   — waste
Event-driven:   Queue/EventGrid → Function scales to die workload only on arrival
"Serverless" = platform scales 0→N per event, you pay per execution, no VM management
```

---

## 2. Azure Serverless Compute Options (choose the right tool)

| Option | Best for | Scale | Notes |
|--------|----------|-------|-------|
| **Azure Functions** | code-level reactions (queue, http, timer, blob) | consumption auto | functions = single unit |
| **Azure Container Apps + KEDA** | containers + events, min/max=0 | scale-to-zero | full container runtime, knative-like |
| **Durable Functions** | stateful workflows, fan-out/in, human approval | per-activity | orchestrator checkpoint/retry |
| **Logic Apps** | integration (200+ connectors), visual, low-code | managed | for SaaS/workflow glue |
| **Event Grid / Event Hubs / Service Bus** | routing / streaming / high-reliability queuing | throughput | choose by pattern (below) |

**Deciding Factors:** latency needs, existing code base, workflow complexity, "is it a workflow or a service?"

---

## 3. Events & Messaging — Which "Channel"

| Service | Pattern | When |
|---------|---------|------|
| **Storage/Service Bus Queue** | point-to-point, reliable, dead-letter, at-least-once | order processing, task queue |
| **Event Grid** | pub/sub, event routing, retries, dead-letter | "storage changed", webhooks, routing many consumers |
| **Event Hubs** | high-throughput streaming (MB/s) | telemetry, IoT, log stream → analytics |
| **Kafka-protocol compat** | Event Hubs speaks Kafka API — portable (Day 42) | portable ecosystems |

**Rules:**
- Payload small & svc-agnostic; heavy data by reference (URI/blob)
- Always **idempotent** consumer (same event processed twice = same result)
- Use **dead-letter** for poison events + alert on DLQ depth

---

## 4. Azure Functions Deep

**Bindings = your I/O (input triggers, output).**
```csharp
// HTTP → Cosmos DB insert via bindings — no SDK bloat in code
[FunctionName("SaveOrder")]
public static async Task<IActionResult> Run(
    [HttpTrigger(AuthorizationLevel.Function, "post")] HttpRequest req,
    [CosmosDB("ordersdb","orders", ConnectionStringSetting = "CosmosDB")] IAsyncCollector<Order> outDoc)
```
```
Triggers (in):  HttpTrigger, QueueTrigger(Storage/SB), TimerTrigger(cron NCRONTAB),
                BlobTrigger, EventGridTrigger, EventHubTrigger, CosmosDB trigger, Kafka
Outputs (out):  CosmosDB, Blob, Table, Queue, ServiceBus, EventHub, SignalR, Http, SQL
```
**Execution model distinction:** synchronous request/response vs async event handlers. The slow path (Long polling, external calls) should go queue-based, not tie the HTTP thread.

**Cold start** — real trade-off:
```
Consumption plan: first call after idle = pulls runtime → 300-1500ms jitter
Premium (EP) / AlwaysRead y: pre-warmed instances → constant low latency, price up
Container Apps with scale-to-zero: still weights pull; set AlwaysReady or minReplicas for SLA
Mitigations: keep hot with 'keep-alive' light HTTP to warm lane; prefer EP for prod latency-tight
```

---

## 5. Durable Functions — Orchestrate Steps, Survive Crashes

```csharp
[FunctionName("OrderWorkflow")]
public static async Task<List<string>> RunOrchestrator(
    [OrchestrationTrigger] IDurableOrchestrationContext ctx)
{
    var order = ctx.GetInput<OrderId>();
    await ctx.CallActivityAsync("ValidateOrder", order);       // step 1 replay-safe
    var pmt = await ctx.CallActivityAsync("ProcessPayment", order); // retryable
    await ctx.CallActivityAsync("EnqueueNotification", pmt);   // step 3
    return new List<string> { "ok" };
}
```
- **Checkpointing:** orchestrator state saved on each step → survives process/VMns crash; replays deterministic
- **Fan-out/fan-in:** `ctx.Task.All(...)` for many items in parallel; bounded concurrency options
- **Human interaction:** durable timers + external events ("wait for approval")
- **Patterns:** Function Chaining, Fan-out/Fan-in, Async HTTP API, Monitoring (polling), Human interaction, Aggregator (singleton state)
- Retries + timeout configurable per activity; failure → entity or DLQ + alert

---

## 6. KEDA — Event-Driven Scale for Containers

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata: { name: order-consumer }
spec:
  scaleTargetRef: { name: order-consumer }
  minReplicaCount: 0            # scale-to-zero
  maxReplicaCount: 50
  pollingInterval: 30
  cooldownPeriod: 120
  triggers:
    - type: azure-queue
      metadata:
        queueLength: "20"
        queueName: orders
        connectionFromEnv: AZURE_STORAGE
```
Scalers: azure-queue, servicebus, kafka, postgres, prometheus (custom HTTP metrics), cron (scheduled), aws/gcp adapters... → the "queue-length == replicas" mapping is your cost control.

---

## 7. Back to Real World — Capstone-style Pipeline

```
API (order) → Service Bus
  → Function 'validate' (schema + DQ) → Cosmos
  → Durable 'order-workflow': payment → inventory(ack) → notify
  → on fail → DLQ + alert; replay tool
Container App (consumer) + KEDA on queue length → 0-50 replicas
Dead-letter monitor: Function Timer → alert if depth > N
```
Behaviour notes: retries at-least-once, dedupe by order-id, observability = structured logs + trace_id (Day 24-27), recovery = replay DLQ, not restart servers.

---

## 8. When NOT Serverless

```
Constant 24/7 high load → dedicated Compute (cost per exec > VM/hour)
Ultra-low latency (µs SLA) → cold start barrier
Long heavy CPU/GPU (ML training) → VM (GPU) 
Full kernel/OS control → VM; long running stateful interactive (websocket) → monitor
Very large payloads moving through Function → use storage refs instead
Complex latency chains across 10 serverless hops — dubious
```

---

## 9. Interview Questions — Serverless & Events

| Question | Strong answer |
|----------|---------------|
| "Function triggers vs bindings?" | Triggers = input (http/queue/timer/eventgrid); bindings = typed input/output connection (Cosmos/Blob/Queue) — writes smoother. |
| "Cold start?" | library/runtime pull on first call after idle; mitigation: Premium plan AlwaysReady, warm them, ContainerApps minReplicas. |
| "When serverless?" | eventful/sporadic loads, short jobs, workflow automation; NOT constant-heavy or ultra-low-latency. |
| "Durable functions pattern?" | Orchestrator + activities, checkpointed state machine; fan-out/in; human-approval timers; crash-safe (replays). |
| "Queue vs EventGrid vs Event Hubs?" | Queue=point-to-point reliable; EventGrid=pub/sub routing/retry; EventHub=high-throughput stream. |
| "KEDA kya?" | Event-driven autoscaler: container replicas = queue length/event metrics → scale-to-zero possible. |
| "Idempotency jab at-least-once?" | Consumer keys by order-id / message-id, stored result — replay safe; DLQ for poison. |
| "Serverless monitoring?" | Structured logs + trace_id correlation; execution metrics (duration, count, errors); budget + scale alarms. |

**Related:** [Day 43](../day-43-serverless-event-driven.md) · [Microservices](../topics/microservices-patterns.md) · [FinOps](../topics/finops-cloud-cost.md) · [MLOps](../topics/mlops-basics.md)