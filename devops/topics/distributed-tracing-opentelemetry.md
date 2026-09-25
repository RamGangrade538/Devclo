# Deep Dive: Distributed Tracing & OpenTelemetry — Request Ki Poori Yatra

> **Standalone deep dive:** Metrics = "kya?", Logs = "kya hua?", **Traces = "kaise slow".** Modern observability = teeno ka correlation. OpenTelemetry is us sabka standard.

---

## 1. Three Pillars of Observability

| Pillar | Kya Jawab | Kaun Kaunsi Tool |
|--------|-----------|------------------|
| **Metrics** | Kya ho raha (counters, gauges, histograms) | Prometheus, Grafana |
| **Logs** | Kya hua (events, errors) | ELK, Loki, CloudWatch |
| **Traces** | Request kab → kaha → kitna time | Jaeger, Tempo, Zipkin |

```
Metric: error_rate{service="auth"} = 0.5
Log:    13:04:02 ERROR auth login failed user=7
Trace:  GET /login → auth (120ms) → db.query (1s) → total 1.2s
```

**Correlation = asli power:** log me `trace_id` hota hai → trace kholo → kaha time-minus.

---

## 2. Traces Ka Anatomy — Span, Trace, Parent-Child

```
Trace (ek request)
 ├─ Span: GET /api/orders          (root, 900ms)
 │   ├─ Span: auth check           (parent → child, 100ms)
 │   ├─ Span: db query orders      (child, 600ms)
 │   └─ Span: serialize json       (child, 50ms)
```

- **Trace** = pure user-visible request / job
- **Span** = ek logical operation (with start, duration, name, tags, status)
- **Parent/child** = dependency tree — kaunse service ne kis ko call kiya
- **Context propagation** = trace ID ko service se service tak headers se bhejna (`traceparent` header)

```
Service A ------------------------> Service B
  span-1  (+ trace-id in header)     span-2 (same trace-id)
```

---

## 3. OpenTelemetry (OTel) — Why It's The Standard

Ek time pe har tool ka apna vendor SDK tha (Zipkin, Jaeger, Datadog, Skywalking...) → **lock-in**. OTel = open standard for **generate + collect + export** telemetry.

```
App (OTel SDK)
 └─ OTel Collector (optional, ilaj: buffering/processing/batching)
     └── exporters → Jaeger / Tempo / Prometheus / CloudWatch / Datadog
```

**OTel components:**
- **SDKs** (Python, JS, Go, Java...) — auto-instrumentation: HTTP/DB/queue calls pehle se trace karti
- **OTel Collector** — receive OTLP from apps, process, export anywhere
- **OpenTelemetry Protocol (OTLP)** — standard wire format
- **Semantic conventions** — consistent span names/attributes across vendors

**Python one-liner (FastAPI):**
```python
from opentelemetry import trace
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

FastAPIInstrumentor.instrument_app(app)
# Aage collector se hook: jaeger exporter
```

---

## 4. Trace Backend Options — Kab Kya

| Backend | Khud hosted? | Use |
|---------|--------------|-----|
| **Jaeger** | Yes (self-host) | Classic venderagnostic traces + UI |
| **Tempo** (Grafana) | Yes | Cheap object-store traces, Grafana native |
| **Zipkin** | Yes | Old school, tiny |
| **Azure App Insights** | Cloud | Azure-native, `APPLICATIONINSIGHTS_CONNECTION_STRING` |
| **AWS X-Ray** | Cloud | AWS-native, auto-service-map |

**Demo:** Is topic ke lab me Jaeger + OTel setup karke apna trace khud laake dekho (http://localhost:16686).

---

## 5. Sampling — Traces Zyada Hote Hain! (Sampling Strategy)

Har request pe trace banao to storage/network phat jayega. Sampling:

| Sampler | Kaisa |
|---------|-------|
| **Always** | Sab (test env) |
| **Ratio** (`parentbased_traceidratio`) | x% random — default 100% dev, 1-10% prod |
| **Tail-based** | Sampler **pehle full ke baad** decide (errors always keep, slow always keep) |
| **Priority** | Headers se client ka nishchay (async) |

```
production: trace_id hash % 100 < 5  → ek collector me karnayach (5% default)
error spans: hamesha store (severity prioritize)
```

---

## 6. Logs + Traces + Metrics — Correlation Pattern (SRE-Era)

```json
{"timestamp":"13:04:02","level":"ERROR","service":"auth",
 "trace_id":"4bf92f3577b34da6a3ce929d0e0e4736","message":"db timeout"}
```

- **Log me trace_id/span_id** inject karo (`otel.sdk.trace` context)
- **Graceful:** jaeger → search by trace id = pure controversy resolved
- **Alert** metric trigger → log drill → trace root-cause

**Prometheus + trace correlation (troubleshoot loop):**
```
p99 spike (metric) → dashboard drill in grafana → open trace → service/time → fix target
```

---

## 7. Real-World Scenarios & Fixes

| Scenario | Problem | Fix |
|----------|---------|-----|
| **Slow request — kaunsi service?** | No traces | OTel auto-instrument; trace tab open → time-to-pick tallest span |
| **Sampling too low, errors lost** | 0.1% prod | Tail-based sampling: errors 100%, normal 5% |
| **Trace dedumba (parent lost)** | Propagation missing | `traceparent` header через all hops; keepIds/context in API |
| **Terms cross-vendor** | OTLP vs custom | OTel SDK + collector; avoid vendor-only formats |
| **Collector high memory** | High rate | batching exporters + tail-sampling, resource limits |
| **Trace dekh pana nahi** | No UI/backend | Jaeger/Tempo via helm in-cluster |
| **Too many spans noise** | Verbose SDK | span limits, exclude static calls, name-normalization |

---

## 8. Interview Questions — Tracing/OTel

| Question | Strong Answer |
|----------|---------------|
| "Metrics vs Logs vs Traces?" | Metrics=aggregate what; Logs=events/details; Traces=request flow/timing. Combined with trace_id correlation. |
| "Trace/Span kya?" | Trace=one request; Span=one op w/ timing+status; parent-child causal tree. |
| "Context propagation kaise?" | `traceparent`/`trace-id` headers carry context service→service; SDKs do automatically. |
| "OTel kyun?" | Vendor-neutral standard: one SDK, one collector, export anywhere. Avoids lock-in. |
| "Sampling kaise karte?" | Ratio prod 1-10%; tail-based keep errors+slow always; dev 100%. |
| "Jaeger vs Tempo?" | Both trace backends; Jaeger self-contained UI; Tempo cheap object-store integration with Grafana. |
| "Log se trace kaise?" | Inject trace_id into logs; search `trace_id=<opaque>` in backend. |
| "Distributed tracing value delivery?" | Avg time-to-root-cause drops: from hours probing logs to minutes trace tree. |

---

## 9. Hands-On Lab (Local — Jaeger + FastAPI minimal)

```bash
# 1. Jaeger container
docker run -d --name jaeger -p 16686:16686 -p 4317:4317 -p 4318:4318 jaegertracing/all-in-one:latest

# 2. Python OTel demo
mkdir -p ~/tracelab && cd ~/tracelab
python3 -m venv .venv && source .venv/bin/activate
pip3 install opentelemetry-api opentelemetry-sdk \
  opentelemetry-exporter-otlp-proto-http \
  opentelemetry-instrumentation-fastapi uvicorn fastapi

cat > app.py <<'EOF'
import time
from fastapi import FastAPI
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

provider = TracerProvider()
provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter(endpoint="http://localhost:4318/v1/traces")))
trace.set_tracer_provider(provider)

app = FastAPI()
FastAPIInstrumentor.instrument_app(app)

@app.get("/slow")
def slow():
    time.sleep(0.3)
    return {"ok": True, "took": 0.3}
EOF

uvicorn app:app --port 8000 & sleep 2
for i in 1 2 3 4 5; do curl -s localhost:8000/slow; echo; done
kill %1
# 3. UI: http://localhost:16686  → "Search" → service: app → find "GET /slow"
# service map + span (sleep 0.3s) dikhega!
```

---

## 10. Summary | Yaad Rakho

1. Metrics ("what") + Logs ("what happened") + **Traces ("why slow")** — teeno correlated by `trace_id`
2. Trace = request; Span = op; parent-child tree = causal chain
3. **OTel** = vendor-neutral standard (SDK + collector + OTLP)
4. Context propagation via `traceparent` — service hop hop
5. **Sampling** prod 1-10% (tail-based keeps errors), dev 100%
6. Backends: Jaeger (self), Tempo (Grafana), App Insights/X-Ray (cloud)
7. Instrument via auto-SDK (FastAPI/Flask/Go/Java); don't hand-write spans everywhere
8. Root-cause flow: metric spike → log drill → **trace tree** → fix

---
**Related:** [Day 24](../day-24-prometheus-grafana-monitoring.md) · [Day 25](../day-25-elk-logging-stack.md) · [Observability Deep Dive](../topics/observability.md) · [Performance Engineering](../topics/performance-engineering.md) · [Day 33 Mesh](../day-33-service-mesh-istio-linkerd.md)