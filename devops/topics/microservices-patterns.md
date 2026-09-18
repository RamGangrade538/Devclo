# Deep Dive: Microservices & APIs — Resilience Patterns, Gateway, Versioning, Observability

> **Kaha ka hai:** Day 46 ka gahra version. Microservices succeed when communication is deliberate: API gateway at edge, resilience bank in-service, events for the rest, versioning + traces everywhere.

---

## 1. Monolith → Microservices: The Honest Trade-offs

| | Monolith | Microservices |
|--|----------|---------------|
| Deploy | one unit, whole app | each service own pipeline |
| Scale | scale all | scale per-service |
| Ownership | one team | per-team ownership |
| Failure isolation | any bug = whole app | bounded to service (with proper insulation) |
| Complexity budget | runtime simpler, tribal | runtime distributed (networking, consistency, traces) |
| When | <10 devs, unclear domains | scale/independence justified |

**Golden rule:** separate by **boundaries of change & ownership**, not by "splitting a class". 2-5 services with real seams > 50 micro-nasties.

---

## 2. The Resilience Bank (apply deliberately)

```
Client ──► API Gateway ──► Service A ──(DB)──► Service B ──► External
                          ▸ timeout 2s       ▸ retry x3 (exp+jitter)
                          ▸ circuit breaker  ▸ bulkhead (pools)
                          ▸ idempotency-key  ▸ (async via queue/outbox)
```
| Pattern | Solves | Cost/risk |
|---------|--------|-----------|
| **Timeout** | hung/slow calls (free forever) | none — always set |
| **Retry with backoff+jitter** | transient network/lock | retry storm → cap attempts |
| **Circuit breaker** | hammering failing downstream | state explosion → cooldown |
| **Bulkhead** | one slow client → others starve | small pools = underutilization |
| **Idempotency key** | retry = duplicate side effects (double charge!) | header keying + keyed response cache |
| **Rate limit (gateway)** | abusive/rogue clients | business decisions (see APIM) |
| **Async/Outbox** | decouple + burst survival | consistency (eventual), replay |

**Outbox pattern (transactional safety):**
```
DB txn:      INSERT order  +  INSERT outbox(order_id, payload)
Dispatcher:  read outbox (time-ordered) → publish to queue → mark sent
            (idempotent: consumer dedupes; crash → re-read; same-block atomic)
```
**Saga** for multi-step w/ compensation:
```
create order → reserve inventory → charge payment   (each step publishes event)
  on fail → compensating action ('publish' reversed) per step ("charge refund")
```

---

## 3. API Gateway — The Edge Done Right

| Feature | Value |
|---------|-------|
| **Auth** | JWT/OAuth2 validation, mTLS termination (identity cached) |
| **Rate limiting** | per-key (60 rpm), throttling tiers, quotas |
| **Versioning** | route /v1/v2, content negotiation |
| **Caching** | GET response cache (edge) |
| **Transformation** | request/response mod, CORS, headers |
| **Analytics** | per-API latency/error/quota (feeds dashboards) |
| **Policy** | take down a path quickly, security headers, WAF |

**Azure API Management (APIM)** = gateway + portal + analytics; Azure Front Door = CDN-level edge w/ routing + WAF; Kong/Envoy Gateway = open-source L7. North-South = APIM; East-West = Service Mesh (Istio/Linkerd) — they combine.

---

## 4. API Versioning & Deprecation

| Style | Trade-off |
|-------|-----------|
| URI (`/v1/`, `/v2/`) | obvious, breaks links; simplest |
| Header (`X-API-Version: 2`) | elegant, but hidden hard fail |
| Content negotiation (Accept: v2) | RESTfullest, tricky clients |
| Query param (`?v=2`) | cache-busters issues |

**Lifecycle:** N + 1 max versions → deprecation header + 12-month notice → removal after todos (measure usage). Contract: OpenAPI (forward-compat, golden-tested).

---

## 5. Observability Across Services

```
TRACE (span: svc a→cache→b→db) at EVERY hop — trace_id propagated:
  HTTP: traceparent/W3C; queue: message header; DB: not (but span at context)
   → OpenTelemetry SDK + collector (Day 24-27)
Motivation: health check 200 on A, error trace hidden in B → trace shows the anomaly
Metrics RED per service via gateway/sidecar:
  ✓ Rate: req/s   Errors: 5xx%  Duration: p95/p99
Logs: structured + trace_id + service (correlate all three)
```
**Also required:** timeouts/retries appear in dashboards; failures → runbooks; alert on error-budget burn (not "feels slow").

---

## 6. Testing Pyramid for Microservices

```
AT unit tests (fast, per-service) + contract tests (consumer-driven: schema compatibility between A→B!)
  + integration tests (containers via Testcontainers, no mocks) 
  + e2e (sparse: happy path 3-5 services) 
Contract tests = CATCH version drift before release gate in CI — top-shelf recommendation.
```

---

## 7. Interview Questions — Microservices

| Question | Strong answer |
|----------|---------------|
| "When microservices vs monolith?" | Separate by change/ownership boundaries; microservices when independent deploy+scale+ownership justified; else monolith+modular. |
| "Resilience patterns?" | Timeout→retry(backoff+jitter)→circuit-breaker→bulkhead; idempotency for retry-safety; async/outbox for disconnect; saga for multi-step compensation. |
| "Failure isolation?" | Bulkhead pools, circuit breakers, graceful degradation, service discovery health checks, and above all timeouts. |
| "API versioning?" | Uri/header/content-negotiation; N+1 max, deprecation header + window, OpenAPI contract. |
| "Gateway vs mesh?" | Gateway = outer edge tasks (auth/rate/version); mesh = inner east-west (mTLS, retries, canary). Different layers, may coexist. |
| "Distributed tracing?" | trace_id in traceparent propagates across HTTP/queue; OTel spans per hop; Tempo/Jaeger visual. |
| "Idempotency-key?" | client key → server returns cached response for same key; enables safe client retry (payments!). |
| "Why contract tests?" | Conf C→B compatibility without spinning whole stack; catch breaking change at CI, not prod. |

**Related:** [Day 46](../day-46-api-gateways-microservices.md) · [Service Mesh](../topics/service-mesh-explained.md) · [API Gateways](../topics/api-gateways.md) · [Serverless](../topics/serverless-event-driven.md)