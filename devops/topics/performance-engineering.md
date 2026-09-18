# Deep Dive: Performance Engineering — Measure, Cache, Scale, Load-Test, Profile

> **Kaha ka hai:** Day 47 ka gahra version. "Fast" comes from science: percentiles not averages, measure-first, optimize the real bottleneck (cache/CDN/scale/DB), verify with load tests, guard with budgets in CI.

---

## 1. Metrics That Matter — Percentiles & Throughput

```
AVERAGE hides roulette: 1 slow req drags... no, mean is loosened by outliers
p50  "half the users feel this"      ← typical experience
p95  "95% of users feel ≤ this"      ← the 'majority fast' target
p99  "slowest 1%"                    ← real headroom (Q: are those the customers we care?)
Tail latency = success of user experience & capacity v.peek-skew
```
**Metrics to collect per service:** latency (p50/95/99), throughput (req/s), error %, saturation (CPU/mem/queue), plus business metric (orders/min). **RED** (Rate,Error,Duration) for services, **USE** (Utilization,Saturation,Errors) for resources.

---

## 2. Measure First — Where is Time Going?

```
Tools:
  - Application: APM/ траssing (OTel + Tempo/Jaeger) — span duration per step
  - DB: slow query logs, EXPLAIN, pg_stat, waitEvents
  - Code: profiler (py-spy, cProfile, async-profiler, PerfView) → flame graph
  - Frontend: LCP/FID via RUM, browser devtools waterfall
Process:
  1 baseline (trace): where are the biggest spans?
  2 hypothesis (e.g., "DB query N+1")   3 measure again after fix
  4 verify under load (not just single user)
```

---

## 3. The Optimization Toolkit (in order of impact for web apps)

| Layer | Actions |
|-------|---------|
| **Frontend** | CDN, compression (brotli/gzip), HTTP caching, lazy-load, minify, modern formats (AVIF), no-blocking scripts |
| **Backend API** | pagination, field-selection, compression, keep-alive, connection pooling, async for slow I/O |
| **DB** | indexes, JOIN/N+1 elimination, read-replicas, partitioning, materialized views, query caching |
| **App cache** | Redis: hot reads, sessions, rate buckets — TTL discipline, eviction, cache-aside pattern |
| **Edge cache** | CDN for static + controlled API caching; correct `Cache-Control` + `ETag` |
| **Concurrency/Scale** | async/threads, HPA/autoscaling, read replicas, queue offload |

**Cache-aside recipe:**
```
GET key → hit? return | miss → read DB → set key TTL → return
Invalidation: update → delete key (or versioned key) — handle stampede (lock/short-TTL)
```

---

## 4. DB — The #1 Bottleneck for Most Apps

```sql
-- find slow & missing-index candidates (Postgres)
SELECT query, calls, total_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 20;
EXPLAIN ANALYZE SELECT * FROM orders JOIN users ON ... WHERE status='paid';
```
**Common fixes:**
- **N+1 problem:** 100 orders × 1 query per customer = 101 queries → 1 JOIN/`.include`+bulk. Huge win.
- Missing index on WHERE/JOIN columns (watch for Seq Scan on big tables).
- `count(*)` per page → cached counter; heavy pagination via keyset (WHERE id > last).
- Read-heavy: read replica + route reads; write: partition by time/tenant.
- Connection pooling limit, transaction scope small.

---

## 5. Scaling — Vertical vs Horizontal vs Event-Driven

```
Vertical (bigger VM)      — easy, limit & cost wall
Horizontal (more replicas) — HPA by CPU/mem; cluster-autoscaler; LB spreads
Event-driven (KEDA)        — scale = queue/events when work exists (Day 43/20)
Database scale is the hard part: read replicas, partitioning, then distributed (NiDB/Cassandra)
```
**Autoscaling tuning:** min/max + threshold (e.g. cpu 60%), cooldown; scale-up fast, scale-down slow (avoid thrash). Watch initial scale delay under spike → prewarm or larger min.

---

## 6. Load Testing — k6 (scripted, threshold-gated)

```js
import http from 'k6/http';
import { check, sleep } from 'k6';
export const options = {
  stages: [
    { duration: '1m', target: 20 },    // ramp-up
    { duration: '3m', target: 50 },    // steady state
    { duration: '1m', target: 100 },   // spike
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<200', 'p(99)<500'],
    http_req_failed: ['rate<0.005'],
  },
};
export default function () {
  const res = http.get('https://app.example.com/api/products?page=2');
  check(res, { '200': r => r.status === 200 });
  sleep(0.3);
}
```
```bash
k6 run load.js
# also: Vegeta (load), hey/ab (quick), JMeter (heavy GUI), Locust (Python)
```
**Load types:** ramp (onboarding), steady (find sustained capacity), spike (autoscaler reaction), soak (1h — memory leaks/GC drift). **Thresholds in CI = perf budget gate** — merge blocked if p95 slips.

---

## 7. Profiling — Flame Graphs Find the Real Hotspot

```bash
pip install py-spy          # attach to running process, no restart
py-spy record -o profile.svg --duration 10 -p $(pgrep -f uvicorn)
# open profile.svg: wide bars = hot functions
```
**Python FastAPI lag 500ms→200ms story:**
```
trace: 300ms in one Query; EXPLAIN: missing index on orders(status, created_at)
add index → p95 120ms; then JSON big response → add pagination+fields → p95 40ms
perf budget added (p95<200) → CI prevented regression once. Report.
```

---

## 8. Performance Budgets in CI (prevent regression permanently)

```
Budget = p95<250ms, error<1%, transfer<900KB (SPA), LCP<2.5s
  - Load test in CI on env (or replay from prod traffic) with thresholds → fail PR
  - Lighthouse CI for frontend budget
  - Regression alert: baseline vs last week comparison in dashboards
```

---

## 9. Interview Questions — Performance

| Question | Strong answer |
|----------|---------------|
| "p50 vs p95 vs p99?" | Percentiles: p50 typical, majority p95 target, p99 = worst-case tail & capacity. Monitor all three. |
| "Slow API — debug flow?" | Trace (finding span) → measure (APM) → profile (flame) → DB check (EXPLAIN) → fix bottleneck → load-verify. |
| "Caching layers?" | Browser→CDN→Redis→DB(replica) top-down; TTL/eviction/invalidation correct for each. |
| "N+1 kya?" | 100 items × 1 query each — fix JOIN/bulk fetch; single biggest easy win. |
| "Scale options?" | Vertical→Horizontal (HPA)→Event-driven (KEDA). DB micro — the hard scaling domain. |
| "Load test types?" | Ramp, steady, spike (autoscaler), soak (leaks); thresholds (p95/error) as CI gate. |
| "Autoscaling gotchas?" | Scale-up fast / down slow, min/max + cooldown, prewarm for spikes — avoid thrash/cost. |
| "Performance budget?" | Metric thresholds in CI (p95, error, transfer, LCP) — merge-blocking, regression proof. |

**Related:** [Day 47](../day-47-performance-engineering.md) · [Observability](../topics/observability.md) · [FinOps](../topics/finops-cloud-cost.md) · [API Gateways](../topics/api-gateways.md)