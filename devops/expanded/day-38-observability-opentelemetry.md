# Day 38 — Advanced Observability & OpenTelemetry (DevClo Expanded — Platform Engineering)

## Overview | Parichay
Day 37 me SLO define kiya, lekin SLO tabhi valid hai jab **telemetry accurate ho**. Ye day tumhe teeno pillars — traces, metrics, logs — alignment deta hai: OpenTelemetry (ab industry standard) se instrument karo, RED/USE frameworks samjho, PromQL deep (histogram_quantile, rate) se stats preinfection karo, Grafana dashboards ko **code** banao, aur correlation explore karo (Loki/Tempo). Senior kya karta hai: dashboards nahi banata jo "kya horaha" nahi batate — woh telemetry se "kahan kya hua" ka fabric banata hai.

## What You'll Learn | Aaj Ki Seekh
- [ ] OTel ke 3 pillars: traces, metrics, logs — har pillar ka purpose
- [ ] Auto-instrumentation (SDK via env/agent) vs manual spans/attributes
- [ ] Exporters: OTLP, Prometheus remote-write, batch processors
- [ ] Correlation: trace-id → log → metric join (single query metaphor)
- [ ] RED (Rate/Errors/Duration) vs USE (Utilization/Saturation/Errors)
- [ ] PromQL deep: rate/irate, histogram_quantile (p99), vector math on SLOs
- [ ] Grafana dashboards-as-code (grafanalib/jsonnet + provision)
- [ ] Tail-based sampling + cardinality control (labels explosion)
- [ ] Logs/metrics/traces central store: Loki/Tempo (or Azure 앱 Insig)
- [ ] SLI source validation — telemetry jo SLO feed karta hai (Day 37 link)

## Full Topic (LEARN) | Puri Detail

### 1. OpenTelemetry — 3 Pillars, One Standard
OTel kya karta hai: **instrument once, export anywhere**. Components:
- **API/SDK** (languages: Go, Python, Node, .NET...): SDK init (providers, resource), API = `tracer`, `meter`, `logger`.
- **Auto-instrumentation**: many runtimes support agent-based (`OTEL_SDK_DISABLED` / Java agent `-javaagent:opentelemetry-javaagent.jar`; Node `@opentelemetry/auto-instrumentations-node`). Aim: instant traces without code edit.
- **Manual instrumentation** (critical paths): `tracer.start_as_current_span`, `span.set_attribute("tenant", t)`, `span.record_exception`.
- **Exporter**: `OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317` — usually via **OTel Collector** (core component) → transforms/processors → backends.

**Three pillars, one context:**
| Pillar | Unit | Question | Base |
|--------|------|----------|------|
| Metrics | counts/histograms | "kitne/gitne fast" | Prometheus |
| Traces | operations spans | "ek request kis path se gayi" | OTel/Jaeger/Tempo |
| Logs | events | "idhar kya hua" | Loki/Splunk/Azure LA |

Correlation: same **trace_id** in spans + span events; `trace_id` propagated to logs via **Logs SDK correlation / OTLP trace-context**, so LogQL/Tempo can join `{service="api"} |= trace_id="abc"`.

### 2. Instrumenting a Service (Real Flow)
```bash
# Python quickstart: SDK + exporter
pip install opentelemetry-distro opentelemetry-instrumentation
opentelemetry-bootstrap -a install
OTEL_RESOURCE_ATTRIBUTES=service.name=checkout,deploy.env=prod \
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317 \
opentelemetry-instrument uvicorn app:app --port 8001
```
Key spans you should add in code:
```python
with tracer.start_as_current_span("checkout.charge") as span:
    span.set_attribute("amount", 100)
    span.set_attribute("payment.provider", "stripe")
```
- **Resource** (fixed metadata: service.name, env, cloud...) + **Attributes** (span/metric labels) — max 32 attr values per span for cardinality control.
- Span events (log-like): `span.add_event("cache.miss", {"key": user_id})`.

### 3. Collector Pipeline (Gateway)
```
apps --OTLP--> collector(gateway) --> [processor] --> backends
                         |-PROM-    | metrics -> prometheus/thanos/azure monitor
                         |-OTLP-    | traces -> tempo/jaeger/azure AppInsights
                         |          | logs   -> loki
```
Processors critical: `batch` (efficiency), `memory_limiter`, `k8sattributes` (pod/node labels!), `resource` (add department/cost-centre), `tail_sampling` policy.
Tail-based sampling gateway-side, because full traces expensive; config:
```yaml
processors:
  tail_sampling:
    policies:
      - name: errors-always (status.code == ERROR)
      - name: high-latency (p95 > 1000ms)
      - name: random (sampling_percentage: 5)
```

### 4. Metrics — RED vs USE
- **RED** (service user view): **Rate** (requests/s), **Errors** (rate of 5xx), **Duration** (latency p95/p99). Best for request-driven microservices.
- **USE** (resource view): **Utilization**, **Saturation**, **Errors**. Best for components: CPU/RAM/disk/node.
- Load-tolerant: dono mix — RED per service endpoint + USE per infra.
Rules of SLO feed: latency SLIs from **histograms** (`histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))`), availability from counters.

### 5. PromQL Deep (beyond the basics)
- `rate(counter[5m])` vs `irate(counter[5m])`: rate = average across window (smooth), irate = instant (spiky). SLO alerting use **rate** (stable).
- `increase(counter[1h])` — delta over window.
- p95 latency:
  ```promql
  histogram_quantile(0.95,
    sum(rate(http_request_duration_seconds_bucket{job="api"}[5m])) by (le))
  ```
- Error ratio both:
  ```promql
  sum(rate(http_requests_total{status=~"5.."}[5m])) /
  sum(rate(http_requests_total[5m]))
  ```
- SLO query practice (availability):
  ```promql
  (1 - sum(rate(...5xx[30d]))/sum(rate(...[30d]))) * 100
  # alert when < 99.9 threshold for 30-day window
  ```
- **Cardinality control**: label = {service, endpoint, status, tenant(<=high!)}; don't use request_path/user_id/trace_id as label (prometheus explodes). Keep high-cardinality in traces, not metrics.

### 6. Traces Backend — Tempo; Logs — Loki
- **Grafana Tempo**: OTel-native trace store; query by `traceid`, `{}` search, trace-to-metrics → logs via exemplars.
- **Grafana Loki**: log aggregation with **LogQL** (label-based `{service="api"} |= "exception" | json | line_format`); index → serch by labels not grep; slow cheap.
- Example LogQL:
  ```logql
  {service="checkout"} |= "ERROR" | json | error_code != "" | count_over_time([1h])
  ```
- Correlation: Tempo "trace to logs" → LogQL filters by trace_id from trace span. Grafana Explore connected: metric → trace → log.

### 7. Grafana Dashboards-as-Code
- Source-of-truth dashboards in git, not click-and-drag UI. Options:
  - **grafanalib** (`grafanalib` python) or **jsonnet** (`grafonnet`) → JSON for Grafana provisioning.
  - GitOps: dashboard folder in repo → k8s ConfigMap (`dashboard.json`) → Grafana auto-reload (sidecar).
  - Also **provisioning.yml**: datasources + dashboards path.
- Panel atomic:
  ```yaml
  - uid: api-latency-p95
    title: p95 latency
    targets:
      - expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
  ```
- PR review dashboard like code — discuss label usage, units, thresholds, SLO references.

### 8. Sampling & Cost (senior topic)
- **Head sampling** (at source) cheap but drops rare errors; **tail sampling** (collector) — keeps interesting traces (errors/slow) + random sample rest; controlled percentage per service.
- Cost tradeoff: full traces = huge storage; p99-accuracy requires enough samples per bucket. Balance: 5% head via SDK random + tail rules for Error/High-latency, that's a solid default.
- Metrics storage: retention + downsample via Thanos/Cortex for >30d queries.

### 2026 Notes
OTel **1.x stable**, auto-instrumentation maturity high (Java/Python/Node/Go/ .NET); **OTLP over gRPC/HTTP or HTTP/protobuf** defatal, OTel Metrics SDK has OTLP exporters, Prometheus **remote-write** via Collector modern path. Grafana-agent/Alloy swallowed collector generation; **Tempo + Loki** local-first duo popular, Azure users switch to **Azure Monitor + "Azure Monitor OpenTelemetry"** (azure monitor exporter ESA) — GA since 2022-23 stable. Prometheus 3.x still aur derived; histogram_quantile remains core. Compliance: RBAC/cert length check; SD ca. Keep rules effective with **windows+multiburn** (Day 37).

## Cheat-Sheet | Yaad Rakhna Commands

| Command | Kaam |
|---------|------|
| `OTEL_EXPORTER_OTLP_ENDPOINT=http://c:4317 opentelemetry-instrument uvicorn app:app` | auto-instrument app |
| `otelcol --config config.yaml` | collector start |
| `curl http://collector:8888/metrics` (prom exporter) | collector self-metrics |
| `curl http://collector:4317` probe | OTLP health |
| `docker compose up otel-collector tempo loki grafana` | local stack |
| `promtool query instant 'rate(http_requests_total[5m])'` | test query |
| `histogram_quantile(0.99, sum(rate(http_duration_seconds_bucket[5m])) by (le))` | p99 |
| LogQL `{service="checkout"} |= "500" | json` | log filter |
| `traceID=... Tempo query` | trace backtrace |
| `grafanalib ...` + `python -m grafanalib Dashboard --out json` | dashboard-as-code render |

## Practice Lab | Abhi Karein
10 steps with docker compose (otel-collector + tempo + loki + grafana) + python demo app:
1. `docker compose up` stack — status `healthy` (`docker compose ps`).
2. Python demo app (fastapi) with opentelemetry-instrumentation; drop `opentelemetry-bootstrap -a install`.
3. Run `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317 opentelemetry-instrument python app.py` → see spans (OpenTelemetry logs: `Span check: POST /checkout`).
4. Configure collector (receivers otlp, prometheus; exporters tempo/loki) + `batch` + `tail_sampling` errors/slow/random config.
5. Prometheus scrape target config → `promtool` checks; confirm `up{service="api"}` 1.
6. Generate traffic: `hey -n 1000 -c 50 http://localhost:8080/checkout`.
7. Query: `histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))` → shell p99 number.
8. LogQL snoop: `{service="api"} |= "from slow "` queries → Grafana Explore shows.
9. Tempo: find one trace_id from error span, click "Trace to logs" — auto LogQL filter arrives.
10. Dashboard-as-code: write `dashboard.py` (grafanalib) 1 row p95 + error ratio + RPS; render json; Grafana provision → visible panel.
Expected outputs: collect + trace + metric + log in one Grafana Explore session, list of labels used, Sampling policy proven (error trace kept, random cut), 1 dashboard-as-code PR-ready.

## Real Incidents | Ek "Platform" Problem

### PLAT-038 · "Service Slow But No Alert Fired" — Correlated Traces Find It
- **Situation:** Customer ticket: checkout p95 from 250ms → 4s intermittently, 20% requests affected. Prometheus dashboards all green (avg latency ~ 300ms), so alert (on avg) didn't fire. On-call found the bug by manual traces after 2h.
- **Investigate:**
  ```promql
  histogram_quantile(0.99, sum(rate(checkout_duration_seconds_bucket[10m])) by (le))
  # p99 in upper buckets? yes → outlier percentile lagging
  sum(rate(checkout_duration_seconds_count[10m]))  # rate unchanged?
  # inspect traces:
  Tempo: query `{service_name="checkout"} status=ERROR` + slow span > 1s
  # Redis dependency downspan:
  span "redis.get" duration=3.8s
  ```
- **Root cause:** Odd single region (eastus) — Redis cached key on **error-prone path** (`db.connect` retries with default 3s wait) — intermittently one redis pod cpu-throttling + timeout. Trace span "redis.get" revealed; average latency fooled dashboards (most traffic fast, small % slow).
- **Fix:** (1) Redis client timeout 300ms + circuit-breaker; (2) autoscaled redis pool 2→3 pods; (3) `kubectl rollout restart` affected deployment.
- **Verify:** p99 latency back under SLO bucket (250–400ms); Tempo Query: zero `redis.get` spanning >1s; Grafana: p99 alerts now bucket-watch → p99 drop.
- **Prevent:** Metric SLO on **percentile p99**, not avg; **tail-sampling keep errors/slow**; dashboard panel shows last 1h p99 + p95 + count; **Trace-to-logs** configured so missed-alerts turn into 1-click path from metric → trace → log.

## Interview Corner | Sawal-Jawab (Senior Level)

**Q: Why OTel, industry status 2026?**
A: OTel = vendor-neutral API+SDK+collector; SWG: instrumentation once, export to Prometheus/Tempo/Loki/Azure AppInsights/Datadog. Stable API/SDK, auto-instrumentation default, collector (Alloy) expanded. Risk: avoid vendor lock-in; standardize on OTLP output.

**Q: Tells the difference between `rate` and `irate`?**
A: `rate[counter]` = average per-second over window — smooth, used in SLO burn & dashboards. `irate[counter]` = instant rate between last two samples — spiky, useful for spiky CPU but noisy for budgets. Prefer `rate` unless you explicitly want max-noise.

**Q: How do metrics, logs, traces correlate?**
A: Common trace_id: spans carry it; logs transport through OTel Logs SDK attach trace_id; backend join: Tempo trace→logs LogQL, or `inspect 'trace_id' in logs`. **Exemplars** link histogram bucket → traceid — Grafana Exemplar jump. Cardinality risk: don't add high-cardinality to raw label set, put lower-cardinality (tenant yes, user_id no).

**Q: RED vs USE — when?**
A: RED = external service health view (rate/errors/duration) — microservices/services. USE = infra view (utilization/saturation/errors) — CPU/disk/node. Both together; RED alerts "service slow", USE alerts "resource loaded".

**Q: Cardinality explosion — a real scenario?**
A: `request_path` or `user_id` or `trace_id` in labels → every unique value new serial series → long-term storage deaths, slow queries. Fix: high-cardinality → attributes (traces) only; metric labels = cardinality-controlled sets (service, endpoint class, status class). Toggle via **relabel_configs** / drop labels at collector.

## Quick Notes | Yaad Rakhna
- OTLP default protocol; collector = central lew control (sampling, enrichment, export)
- tr + pic: auto-instrument for wid (mobile/edge), manual spans on critical paths only
- RED for services, USE for infra — dono, ek nahi
- `rate` for SLO (smooth), `irate` rare; `histogram_quantile` for pXX
- High-cardinality → traces, not metrics labels
- Tail-sampling: keep errors + slow + small random — storage vs fidelity balance
- Dashboards-as-code (grafanalib/jsonnet) → reviewable, versionable, protectable

## Next | Aage Bolte Jaana
Day 39 platform me paisa aata hai — telemetry ke saath **cost** (FinOps) measure karna hai:
→ `day-39-finops-cloud-cost.md`