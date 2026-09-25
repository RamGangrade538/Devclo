# 🧩 Service Architecture — Monolith, Microservices, APIs

> **Hinglish:** App ko kaise design karo: ek bada monolith ya chhote independent microservices — aur unke beech APIs/REST/gRPC/API gateway/rate limiting/caching. Ye module modern service architecture cover karta hai.

## 📖 Overview — Ye Topic Kya Hai

Layout patterns: **Monolith** (sab ek app) vs **Microservices** (chhote independent services). Monolith simple + fast to start; microservices scale + teams independent, but distributed complexity. **Distributed systems** issues (network, retries) bhi aate hain.

Service-to-service: **REST APIs** (HTTP, most common), **gRPC** (binary, fast), **API gateways** (single entry: auth, routing, rate-limit), **service discovery** (kaise locate karo), **load balancing**, **resilience patterns** (circuit breaker, retries, timeouts, rate limiting), **caching**, aur **event-driven** taple (async).

## 🟢 Beginner — Shuruaat yahan se

- Monolith vs microservices — pros/cons.
- REST API basics — verbs, status codes, JSON.
- APNA micro (2 services) app banao — HTTP call.
- API gateway concept — why single entry.

## 🟡 Intermediate — Ab resilience karo

- **Circuit breaker, retries, timeout** — patterns.
- **Rate limiting** — 429s control.
- **Caching** — in-memory + CDN, invalidation.
- **Service discovery + load balancing** — clients pe bhi.
- **API design** — versioning, idempotency, pagination.

## 🔴 Advanced — Pro bano

- **gRPC** — protobuf, streaming.
- **Event-driven architecture** — async messaging.
- **Saga pattern** — distributed transactions.
- **API gateway deep** — authn, quotas, analytics.
- **Backends-for-frontends (BFF)** — client-specific APIs.

## ✅ Important Concepts (Checklist)

Tick karo jab concept clear lagge — localStorage me auto-save hota hai.

- [ ] **Monolith** — ek deployable unit; simple initially.
- [ ] **Microservices** — independent deployable services.
- [ ] **Distributed systems** — multiple parts network pe.
- [ ] **REST APIs** — HTTP-based CRUD endpoints.
- [ ] **gRPC** — high-perf binary RPC.
- [ ] **API gateways** — single front door (routing, auth).
- [ ] **Service discovery** — services kaise milte hain.
- [ ] **Load balancing** — distribute calls.
- [ ] **Circuit breakers** — failure isolation.
- [ ] **Retries** — transient errors.
- [ ] **Timeouts** — call-bound control.
- [ ] **Rate limiting** — protect backend.
- [ ] **Caching** — speed up repeats.
- [ ] **Event-driven architecture** — async decouple.
- [ ] **Saga pattern** — multi-step distributed transaction.
- [ ] **Idempotency** — repeat safe operations.
- [ ] **API versioning** — `/v1/` contract evolve.
- [ ] **Pagination** — large lists chunk.
- [ ] **Backends-for-frontends** — per-client API layer.
- [ ] **Contract testing** — service expectations verified.
- [ ] **Graceful degradation** — partial service fallback.
- [ ] **Dead-letter handling** — failures quarantined.
- [ ] **Environment parity** — dev==prod-ish.

## 🛠️ Recommended Tools

| Tool | Kya hai | Kab use kare |
|---|---|---|
| Nginx / Envoy | Proxy + gateway | Edge routing |
| Kong / API Manage | API gateway | Auth/rate-limit central |
| gRPC + protobuf | RPC framework | Fast service calls |
| Prometheus + tracing | Observability | Distributed debugging |
| Kafka / SQS | Async backbone | Event-driven architecture |
| Resilience libs | Circuit/retry | Code-level robustness |

## 🧪 Practical Labs / Projects

- [ ] **Lab 1 — Two Services:** Order → inventory HTTP call; latency + error dekho.
- [ ] **Lab 2 — Resilience:** Retry + timeout + circuit breaker add karo; kill one, behavior dekho.
- [ ] **Lab 3 — Gateway:** Kong/nginx se auth + rate-limit + route add karo.
- [ ] **Lab 4 — Event-Driven:** Order events Kafka/SQS bhejo; consumer decoupled.
- [ ] **Project — Mini Microservices:** gateway + 2 services + cache + resilience patterns + tracing = full demo system.

## 🔗 Related Topics

- [🕸️ Distributed Systems](../modules/distributed-systems.md)
- [📨 Messaging & Event Systems](../modules/messaging-events.md)
- [🏛️ Architecture](../modules/architecture.md)
- [API Gateways](../topics/api-gateways.md)
- [Microservices Patterns](../topics/microservices-patterns.md)
- [HTTP & REST API Basics](../topics/http-rest-api-fundamentals.md)
- [Day 46 — API Gateways & Microservices](../day-46-api-gateways-microservices.md)