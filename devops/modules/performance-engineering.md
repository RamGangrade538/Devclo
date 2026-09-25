# 🏎️ Performance Engineering — Fast, Efficient, Scalable

> **Hinglish:** App "responses me 5 sec se zyada lag rahe"? Users uth jaate hain. Performance engineering = **latency/throughput measure + profile + optimize** — CPU, memory, network, DB sab layers me. Ye module benchmarks, profiling, load testing aur bottleneck analysis cover karta hai.

## 📖 Overview — Ye Topic Kya Hai

Performance ka matlab quality of response: **latency** (ek request ka time), **throughput** (systems per second kaam). Optimization se pehle **measure** karo — "kahan time lag raha" (profiling), "critical path" dhoondo. Behtar tools bina guesswork ke.

**Load testing** (kya hota hai specific load pe), **stress testing** (burden ke under behaviour), **benchmarking** (baseline vs results sab compare). Databases/network/queries bade sahil bottleneck hote hain. K8s me resource requests/limits ke through scaling. **APM** (Application Performance Monitoring) live par production performance track karta hai.

## 🟢 Beginner — Shuruaat yahan se

- Latency vs throughput — difference kya hai, dono alag.
- `time curl -w` se latency basic measure karo (DNS, TTFB, total).
- Load test karo simple tool se (k6/hey — 100 req/s kya hota).
- Seedha kaam: p99 nikalna (jq se).

## 🟡 Intermediate — Ab profile karo

- **CPU profiling** — kaunsa function CPU kha raha.
- **Memory profiling** — leaks/allocations.
- **Load tests results** dekh kar **bottlenecks identify** karo.
- **DB performance** — queries, indexes, EXPLAIN.
- **Caching layers** — CDN, app cache, DB cache.

## 🔴 Advanced — Pro bano

- **Bottleneck analysis** — uthaath pehla chok (network/disk/code).
- **Capacity planning** — trends se scale.
- **K8s performance** — limits, HPA, pod scheduling.
- **APM distributed** — request path me p99 per service.
- **Optimization trade-offs** — cost vs latency vs complexity.

## ✅ Important Concepts (Checklist)

Tick karo jab concept clear lagge — localStorage me auto-save hota hai.

- [ ] **CPU profiling** — kaun sa code CPU konsume karta hai.
- [ ] **Memory profiling** — RAM kaun kha raha / leak.
- [ ] **Load testing** — expected load pe behavior test.
- [ ] **Stress testing** — ekdum zyada load pe behaviour.
- [ ] **Benchmarking** — system vs baseline compare.
- [ ] **Latency** — response time (ms); user perception.
- [ ] **Throughput** — simultaneous kaam (req/sec).
- [ ] **Bottleneck analysis** — single slow link find.
- [ ] **Capacity planning** — needed resources estimate.
- [ ] **Database performance** — queries, indexes, locks.
- [ ] **Network performance** — latency, drop, bandwidth.
- [ ] **Kubernetes performance** — limits, throttling, evictions.
- [ ] **APM (Application Performance Monitoring)** — prod live tracking.
- [ ] **Time to First Byte (TTFB)** — server ka response start.
- [ ] **Percentiles (p50/p99)** — representative latency.
- [ ] **Concurrency** — requests together handle.
- [ ] **Caching** — repeated work ka store (reduce latency).
- [ ] **Indexes on DB** — query speed.
- [ ] **Connection pooling** — DB connections reuse.
- [ ] **CDN** — static content edge pe.
- [ ] **Garbage collection / memory tuning** — runtime RAM mgmt.
- [ ] **Queue depth** — pending work backlog.
- [ ] **Request tracing (perf tracing)** — per-request breakdown.
- [ ] **Throttling/limits** — resource caps.

## 🛠️ Recommended Tools

| Tool | Kya hai | Kab use kare |
|---|---|---|
| k6 | Load testing (JS) | Realistic load + assertions |
| hey / wrk | Quick benchmark | Simple load QA |
| pprof / flamegraphs | CPU/memory profiling | Profiling hot path |
| flamegraph (perf) | CPU visual | See where time goes |
| Grafana | Metrics visuals | Capacity + latency trends |
| Jaeger/Tempo | Distributed tracing | Per-request breakdown |
| pgAdmin / EXPLAIN | DB perf | Query analysis |

## 🧪 Practical Labs / Projects

- [ ] **Lab 1 — Latency Baseline:** `curl -w` se DNS/TTFB total nikaalo; CDN vs no-CDN compare.
- [ ] **Lab 2 — Load Test:** k6 script 100/500/1000 VUs — watch where latency breaks.
- [ ] **Lab 3 — Profile an App:** pprof flamegraph se slow function find karo, optimize, compare.
- [ ] **Lab 4 — DB Query Fix:** Slow query EXPLAIN karo, index add karo, latency me improvement dekho.
- [ ] **Project — Perf-Dash CI:** CI me automated k6 test + Grafana panel + alert (if p99 > threshold).

## 🔗 Related Topics

- [⌂ Databases](../modules/databases.md)
- [📡 Observability](../modules/observability.md)
- [☸️ Kubernetes](../modules/kubernetes.md)
- [Performance Engineering](../topics/performance-engineering.md)
- [Day 47 — Performance Engineering](../day-47-performance-engineering.md)