# Day 47: Performance Engineering — Caching, CDN, Autoscaling, Load Testing, Profiling

> Performance = product quality metric (latency, throughput, cost). Engineering: measure → find bottleneck → optimize (cache/CDN/scale) → verify (load test) → monitor.

## Overview | Parichay

"Fast app" idea nahi — science hai. Workflow:
1. **Measure**: metrics (latency percentiles: p50/p95/p99), throughput, saturation
2. **Locate**: profiler (CPU/memory), tracing, APM hot spots
3. **Optimize (order of impact for web apps):**
   - **Frontend**: CDN + static assets, HTTP caching, compression, lazy load, minify
   - **Server**: DB index, query tuning, caching layer (Redis), async, connection/thread pool
   - **Scale**: vertical (bigger VM) → horizontal (more replicas) with autoscaling/HPA/KEDA
   - **Architecture**: read-replicas, partitioning, materialized views
4. **Verify**: load tests (k6, Vegeta, JMeter, locust) — steady-state + spike + soak
5. **Monitor**: SLO metrics + alerts; regression guard in CI (perf budget)

### Percentiles vs average — p99 kyun important hai

Performance me sabse pehla mindset fix: **average (mean) mat dekho, percentiles dekho**. Mean dhokha deta hai — 99 logo ko 10ms aur 1 ko 10,000ms do to average theek dikhega, par wo 1 user pura din miserable hai. **Percentiles**: `p50` = median, typical user experience; `p95` = 95% logo se acha, worst 5% ka entry point; `p99` = sirf 1% worst — real user ka pain aur systems ka hidden bottleneck yahin dikhta hai. Production me p99 spike = GC pause, DB lock, connection pool exhaustion — jo mean me gayab ho jata hai. SLO typically p95/p99 pe likhe jaate hain (Day 47 ke load test thresholds me `p(95)<200, p(99)<500` isi liye). Aur haan: **bufferbloat/queueing** me percentile ekdam zaroori — jab ek bhi request slow hoti hai, wo sabke aage queue lagati hai (head-of-line). Ek aur concept: **saturation** (kitna resource/CPU use ho raha) latency badhne se pehle signal deta hai. Line: p50 = experience, p99 = discipline.

### Caching — sabse bada single lever

**Cache** = same computation/lookup dobara karne se bachna — often 10-100x. Cache ki duniya **layers** me chalti hai, bahar se andar tak:

| Layer | Kya cache | TTL/invalidation |
|---|---|---|
| **Browser** | static assets | `Cache-Control: max-age=..., immutable` |
| **CDN/Edge** | static + hot API | edge TTL + purge |
| **App cache (Redis)** | DB query results | TTL (e.g., 5m) + key invalidation |
| **DB buffer/index** | pages, indexes | automatic + query tuning |

Rules: (1) **kya cache** — read-heavy, expensive, tolerate-thoda-stale data (product list OK; account balance NO); (2) **cache key** me variations bhi daalo (locale, user plan); (3) **invalidation strategy** likho — TTL (simple) ya event-based purge (stale dikhta hai to write pe delete); (4) **thundering herd** — expired key pe sab ek saath DB pe na toot jayein (stale-while-revalidate, lock); (5) **stampede on cold cache** — deploy ke baad burst, warm-up karo. Classic gotcha: cache se galat personalized data dikhna (key me user missing) — security bug. Kahan cache nahi: real-time inventory exact count jahan stale = paisa.

### CDN aur edge — duniya ko paas lao

**CDN** (Azure CDN/Front Door, CloudFront) = static files (images, JS, CSS) ko duniya bhar ke **edge PoPs** pe cache karo — user ko uske nazdeek se serve, origin se nahi. Fayda: latency 200ms → 20ms, origin ka load 90% kam, availability (origin down to edge cache still serves). Static ke alava: **cacheable API responses** (public catalog GET) bhi CDN pe; **dynamic acceleration** (route optimization, TLS termination at edge). Config points: cache **key** (query params include/exclude), **TTL** per content type (immutable hashed assets = 1y; HTML = short), **origin shield**, **purge** on deploy (ya versioned filenames `/app.abc123.js` — best practice, purge ki zaroorat hi nahi). **Front Door** global L7 + WAF + health-based failover bhi deta hai (Day 41 DR me bhi yahi). Common miss: `Cache-Control` headers hi nahi set — CDN enable kiya par sab MISS. Verification: response header me `X-Cache: HIT` check karo.

### Autoscaling — scale before/while it hurts

**Autoscaling** = load ke hisaab se replicas badhana/ghatana — performance + cost dono. K8s me: **HPA** (CPU/memory/custom metric pe `kubectl autoscale deployment --cpu-percent=60 --min=2 --max=10`), **cluster autoscaler** (nodes khud add/remove), **KEDA** (event/queue metrics, Day 43), **VPA** (right-size requests — FinOps se juda). VM world: **VMSS** scale sets, App Service rules. Tuning: **min** = steady baseline (cold start se bachne ke liye 2 rakho, 0 nahi agar latency-tight), **max** = cost cap, **scale-up** fast (cool-down chhota) par **scale-down** dheere (flapping se bachne ke liye stabilization window). Gotcha: scaling se pehle **single-threaded bottleneck** (DB connection pool) fix karo — 10 replicas = 10x DB load, aur sab wahi lock pe phanste. Scale-out ke saath **stateless** banna padta hai. Interview: "p99 degrade during spike?" → check saturation + HPA lag/rule + DB pool — not just "add replicas".

### Load testing — k6 se proof lo

"Fast lagta hai" nahi — **prove** karo. Load tests ke types: **ramp** (gradual, capacity find), **spike** (sudden 10x — autoscaler reaction), **soak** (long duration — memory leak, connection leak, GC drift), **stress** (break point tak). Tool: **k6** (scriptable, thresholds CI me), Vegeta, JMeter, locust. k6 me `stages` se ramp/spike, `thresholds` se gate: `http_req_duration: ['p(95)<200']`, `http_req_failed: ['rate<0.01']` — threshold fail = exit non-zero = **CI fail**. Flow: **baseline** lo (pehle optimization ke numbers) → fix karo → re-test → % improvement document. Load test staging pe real prod-like data se karo (cache cold/warm dono test). Dangers: load test ko prod pe bina plan ke chalana = self-DDoS. Perf budget CI me: "p95 < 250ms, page < 1MB" — regression aaye to build break — ye **regression guard** hai.

### Profiling — guess mat karo, dekho

Optimize se pehle **locate** karo — profiler/btrace dikhata hai time kahan ja raha hai. Python: **py-spy** (`py-spy record -o profile.svg -p PID` → **flamegraph** — kaunsi function sab zyada CPU le rahi), cProfile. Go: pprof. Java: async-profiler/PerfView. DB side: **query plan** (`EXPLAIN ANALYZE` — seq scan vs index), slow query log — often 80% time ek query me hai. APM/Distributed trace: ek request ka waterfall — 70% time kis span me. Common hotspots jo pehle check karo (order of impact): (1) **N+1 queries**, (2) missing index, (3) unbounded/paginated-missing APIs, (4) no cache on hot read, (5) sync blocking in async path, (6) big payloads no compression. Flamegraph dekh ke fix: ek function 60% le rahi hai → usi pe jaao. Bina profile ke optimization = bagair diagnosis ke dawa — kabhi kabhi galti ho jati hai.

### Performance budgets aur monitoring

**Perf budget** = team ke liye written numbers: `p95 < 200ms`, `LCP < 2.5s` (frontend), `page < 1MB`, `error < 1%` — ye **CI gate** ya dashboards pe enforced hote hain (Day 46 bhi isi idea pe hai). Budget nahi to har release thoda-thoda slow hota jaata hai — **performance regression** kabhi pata nahi chalta (**boiling frog**). Monitoring: **RED** (Rate, Errors, Duration percentiles) per service + saturation metrics (queue depth, CPU, connection pool). Alert **SLO** pe, "feels slow" pe nahi. Post-deploy: canary ke waqt latency compare (Day 46 rollout ke saath), budget cross hue to rollback. Story pattern interview ke liye: "p95 800ms tha → trace se N+1 dikha → index+JOIN → 180ms → CDN → 40ms → budget CI me lock kiya, ab regression ruk gaya." Ek line: performance engineering = measure → locate → optimize → verify → guard (budget), cycle repeat.

## What You'll Learn | Aaj Ki Seekh

- [ ] Latency percentiles vs averages — why p99, not mean
- [ ] Caching: browser (Cache-Control), edge CDN, app cache (Redis), DB cache
- [ ] CDN: Azure CDN / Front Door — static + API edge caching
- [ ] Autoscaling: HPA (K8s), VMSS, App Service scale rules, AKS cluster-autoscaler + KEDA
- [ ] Load testing: k6 script, thresholds, ramp, soak; baseline before/after
- [ ] Profiling/APM: cProfile/py-spy, PerfView, Application Insights — find hot spots
- [ ] Performance budgets + regression gates in CI

## Diagram | Dekho Kaise Kaam Karta Hai

```mermaid
flowchart LR
    C["Client"] -->|"static, CDN cache hit"| CDN["Azure Front Door / CDN"]
    C -->|"cached"| G["Gateway"]
    G -->|"miss"| CACHE["Redis Cache
    (hot data)"]
    CACHE -->|"DB query indexed"| DB["DB:
    read-replica / partitioning"]
    G -->|"scale-out via HPA/KEDA"| REPL["Replicas
    (pods/VMs)"]
    TEST["Load: k6 static ramp"] -->|"req/s + lat"| RPT["Perf report
    vs budget"]
```

ASCII:
```
Client → CDN (cached static) → gateway → app (cache: Redis) → DB
  scale: HPA by CPU + KEDA by queue;      verify: k6 threshold p95<200ms→CI gate
  profile: find bottleneck (DB query? JSON parse? GC?) → fix that
```

## Demo | Copy-Paste Karke Chalao

```bash
# 1. Load test with k6
k6 version || { # debian/ubuntu
  sudo gpg -k && sudo dpkg -i $(curl -sL https://dl.k6.io/key.gpg | ... ) # see k6.io docs
}
cat > load.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';
export const options = {
  stages: [
    { duration: '1m', target: 20 },    // ramp up
    { duration: '3m', target: 50 },    // steady
    { duration: '1m', target: 100 },   // spike
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<200', 'p(99)<500'],
    http_req_failed: ['rate<0.01'],
  },
};
export default function () {
  const res = http.get('https://myapp.example.com/api/products?page=1');
  check(res, { 'status 200': r => r.status === 200 });
  sleep(0.5);
}
EOF
k6 run load.js

# 2. Cache headers (app) — browser cache static
# static: Cache-Control: public, max-age=31536000, immutable
# api:     ETag + 304 (or short cache 60s for hot endpoint)

# 3. Redis app cache (FastAPI/Python example)
pip install redis
cat > cache.py << 'EOF'
import redis, json
r = redis.Redis(host="redis", port=6379, decode_responses=True)
def get_products():
    cached = r.get("products:v1")
    if cached: return json.loads(cached)
    data = db_query()                      # slow SQL
    r.setex("products:v1", 300, json.dumps(data))   # TTL 5m
    return data
EOF

# 4. Azure CDN / Front Door (enable + route origin)
az afd profile create -g rg --profile-name fd-devops --sku Standard_AzureFrontDoor
az afd origin create -g rg --profile-name fd-devops --origin-group-name og1 \
  --origin-name app-origin --host-name myapp.azurewebsites.net --http-port 80 --https-port 443

# 5. HPA in k8s (scale = perf + cost)
kubectl autoscale deployment myapp --cpu-percent=60 --min=2 --max=10
# KEDA queue-length scaling (Day 43) for async jobs

# 6. Profiling a python API hot spot:
pip install py-spy
py-spy record -o profile.svg --duration 10 -p $(pgrep -f uvicorn)   # flame graph!
```

## Real-Life Example | Industry Me

**Slow catalog page → story of debugging:**
```
Report: "site slow" → measure: p95 800ms → trace: 70% total = one DB query (N+1)
Fix: index + JOIN → p95 180ms. Then CDN for images (now 40% of bytes) → p95 40ms.
Budget: p95<200ms over 12 weeks. Load test ensures deploys don't regress (CI gate).
Monitor dashboards + alert p99 threshold → catch before users complain.
```
**Common bottlenecks checklist (check in order):**
```
□ N+1 queries / no index     (DB hit per row!)
□ Unbounded JSON / chatty API  → paginate, fields
□ No cache for hot reads       → Redis/CDN/HTTP
□ Blocking I/O in event loop   → async/queue
□ Huge response / no compression → gzip/brotli
□ Single instance + no autoscaling → HPA/spike scale
□ Behind-proxy issues (keep-alive/TLS handshake) → termination at gateway
```
**Perf budgets:** define at CI: `p95<250ms`, `bytes<1MB page`, `error<1%`; break build if exceeded → continuous guard.

Soak test: run steady load 1h — catch memory leaks/GC drift; Spike test: sudden 10x — autoscaler response time check.

## Practice Exercise | Abhi Karein

1. k6: your app with 3 stages + thresholds p95<200 — fail/succeed the gate
2. Measure baseline (curl -w, or APM) → add Redis cache → re-measure (document % gain)
3. Enable CDN/Front Door on static site; verify cache hit (response header)
4. Set HPA; run spike load → replicas up → after load → scale down (address response)
5. py-spy (or `psrecord`) your API by load — find top function; fix 1 bottleneck
6. Add perf budget threshold to your CI (or documented post-deploy check)

## Quick Notes | Yaad Rakho

```
- Percentiles, not averages: p50 typical, p95 majority, p99 worst — actions target p99
- Cache order: Browser(HTTP) → CDN(edge) → App(Redis) → DB(reads/index/read-replica)
- CDN = static + occasionally API cache; ensure cache key + invalidation strategy
- Scale: first optimize, then scale; vertical→horizontal→KEDA event-driven scale
- Autoscaling metrics: CPU, memory, queue, custom (KEDA) — tune min/max wisely (cost!)
- Load test types: ramp, spike, soak; thresholds in CI = perf budget (no silent regression)
- Profile before you guess: flamegraph (py-spy), index missing? N+1? — fix real bottleneck
- Compression, pagination, field-subsets — simplest wins often 10-50x
- Monitor p99 + throughput + saturation → alert on SLO, not on "feels slow"
```

**Agla:** DevSecOps Advanced — SBOM, signing, SLSA, supply-chain security (Day 34 ka upgrade).