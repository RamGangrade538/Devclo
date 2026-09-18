# Deep Dive: Observability — SLI/SLO/SLA, Prometheus, Grafana, ELK, OpenTelemetry

> **Kaha ka hai:** Day 24-25, 27 ka gahra version. "It works" nahi — **proof do** ki system healthy. Observability = **app ke andhar ki haalat ko bahar se batana** bina code fix kare.

---

## 1. Observability vs Monitoring — Difference

| Aspect | Monitoring | Observability |
|--------|------------|---------------|
| **Question** | "Kya toota?" (Known unknowns) | "Kyun toota?" (Unknown unknowns) |
| **Approach** | Pre-defined dashboards, alerts | Ad-hoc exploration, high-cardinality data |
| **Data** | Metrics (aggregated) | Metrics + Logs + Traces (correlated) |
| **Tooling** | Nagios, Zabbix, basic Prometheus | Prometheus + Grafana + Tempo/Jaeger + Loki |
| **Mindset** | Reactive | Proactive + Investigative |

**Observability = Three Pillars + Correlation:**
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  METRICS    │  │    LOGS     │  │   TRACES    │
│  (Numbers)  │  │  (Events)   │  │  (Journey)  │
│             │  │             │  │             │
│ CPU, RAM,   │  │ Error msg,  │  │ Request →   │
│ Req/sec,    │  │ Stack trace │  │ Service A → │
│ Latency p99 │  │ Audit trail │  │ Service B → │
│ Error rate  │  │ Debug info  │  │ DB → Cache  │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┼────────────────┘
                        ▼
              ┌─────────────────────┐
              │   CORRELATION       │
              │  (Same request ID,  │
              │   trace ID, span ID │
              │   across all three) │
              └─────────────────────┘
```

---

## 2. Three Pillars — Deep Dive

### 2.1 Metrics — Numbers That Tell Trends
**Prometheus Data Model:**
```
metric_name{label1="value1", label2="value2"} 123.456
```
- **Metric name:** `http_requests_total`, `cpu_usage_seconds`
- **Labels:** High-cardinality = **danger** (user_id, request_id); Low-cardinality = **good** (method, status, handler)
- **Types:**
  - **Counter:** Monotonically increasing (`http_requests_total`)
  - **Gauge:** Can go up/down (`memory_usage_bytes`, `active_connections`)
  - **Histogram:** Buckets for latency (`http_request_duration_seconds_bucket`)
  - **Summary:** Quantiles client-side (`http_request_duration_seconds`)

**PromQL Essentials:**
```promql
# Rate of requests per second (5m window)
rate(http_requests_total[5m])

# 95th percentile latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Error rate
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])

# CPU usage % (container)
rate(container_cpu_usage_seconds_total[5m]) * 100

# Memory usage %
(container_memory_usage_bytes / container_spec_memory_limit_bytes) * 100

# Pod restarts rate
rate(kube_pod_container_status_restarts_total[1h])

# Alert: High error rate
rate(http_requests_total{status=~"5.."}[5m]) > 0.05
```

**Cardinality Explosion (Production Killer):**
```promql
# BAD — user_id as label = millions of series
http_requests_total{user_id="12345", ...}

# GOOD — user_id in logs/traces, not metrics
http_requests_total{method="GET", handler="/api/users", status="200"}
```
**Rule:** Labels = **low cardinality** (method, status, handler, pod, namespace). High cardinality → **logs/traces**.

---

### 2.2 Logs — Events & Stories

**Structured Logging (JSON) — Mandatory for Observability:**
```json
{
  "timestamp": "2026-09-09T10:30:45.123Z",
  "level": "ERROR",
  "service": "payment-api",
  "trace_id": "a1b2c3d4e5f6",
  "span_id": "f6e5d4c3b2a1",
  "message": "Payment gateway timeout",
  "error": "context deadline exceeded",
  "user_id": "12345",
  "order_id": "ORD-789",
  "duration_ms": 30000
}
```

**Log Pipeline (EFK/ELK/Loki):**
```
Application
    ↓
Log Agent (Filebeat / Fluent Bit / Promtail)
    ↓
Buffer/Queue (Kafka / Redis / Loki ingester)
    ↓
Processor (Logstash / Fluentd / Loki compactor)
    ↓
Storage (Elasticsearch / Loki / OpenSearch)
    ↓
Visualize (Kibana / Grafana / OpenSearch Dashboards)
```

**Log Levels:**
| Level | When | Retention |
|-------|------|-----------|
| **DEBUG** | Detailed flow, variable values | Dev only, short |
| **INFO** | Business events (order placed, user login) | 30-90 days |
| **WARN** | Recoverable issues (retry, fallback) | 90 days |
| **ERROR** | Failed operations, need investigation | 1-2 years |
| **FATAL** | Process crash, immediate attention | Permanent |

**Structured Logging Best Practices:**
1. **Always JSON** — parseable, queryable
2. **Trace/span IDs** — correlate with traces
3. **Consistent field names** — `service`, `level`, `message`, `error`
4. **No PII in logs** — mask emails, tokens, passwords
5. **Sample DEBUG** — don't log DEBUG in prod at full volume

---

### 2.3 Traces — Request Journey

**Distributed Trace = Spans forming a tree:**
```
Trace: a1b2c3d4e5f6 (12 spans, 2.3s total)
├─ Span 1: GET /api/orders (api-gateway) — 2.3s
│  ├─ Span 2: Auth check (auth-service) — 45ms
│  ├─ Span 3: Validate request (api-gateway) — 12ms
│  ├─ Span 4: GET /orders (orders-service) — 1.8s
│  │  ├─ Span 5: DB query (PostgreSQL) — 1.2s
│  │  └─ Span 6: Cache check (Redis) — 8ms
│  ├─ Span 7: GET /payments (payment-service) — 320ms
│  │  └─ Span 8: External API (Stripe) — 280ms
│  └─ Span 9: Response serialization — 5ms
```

**Key Span Fields:**
| Field | Purpose |
|-------|---------|
| `trace_id` | Unique across entire request |
| `span_id` | Unique per operation |
| `parent_span_id` | Links to parent (tree) |
| `name` | Operation name (HTTP method + route) |
| `start_time` / `end_time` | Duration calculation |
| `attributes` | Key-value (http.method, db.statement, error) |
| `events` | Timestamped annotations (log within span) |
| `status` | OK / ERROR + message |

**OpenTelemetry (OTel) — Industry Standard:**
```go
// Go example
import (
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/trace"
)

tracer := otel.Tracer("payment-service")
ctx, span := tracer.Start(ctx, "ProcessPayment",
    trace.WithAttributes(
        attribute.String("order.id", orderID),
        attribute.Float64("amount", amount),
    ))
defer span.End()

// ... business logic ...
if err != nil {
    span.RecordError(err)
    span.SetStatus(codes.Error, err.Error())
}
```

**Exporters:** OTLP (gRPC/HTTP) → Tempo, Jaeger, Zipkin, Datadog, New Relic, Honeycomb.

---

## 3. SLI / SLO / SLA — The Reliability Contract

| Term | Definition | Example | Owner |
|------|------------|---------|-------|
| **SLI** (Service Level Indicator) | **Measure** — quantifiable metric | % requests < 200ms latency | Platform team |
| **SLO** (Service Level Objective) | **Target** — SLI threshold over window | 99.9% requests < 200ms per 30 days | Product + Eng |
| **SLA** (Service Level Agreement) | **Contract** — legal, penalties | 99.95% uptime or 10% credit | Business/Legal |

**Error Budget = 100% - SLO**
```
SLO: 99.9% uptime (30 days)
Total minutes = 30 * 24 * 60 = 43,200
Error budget = 0.1% = 43.2 minutes/month allowed downtime
```

**Error Budget Policy:**
| Budget State | Action |
|--------------|--------|
| **> 50% remaining** | Normal releases, feature work |
| **10-50% remaining** | Slow down, focus on reliability, reduce risk |
| **< 10% remaining** | **Freeze releases** — only hotfixes, reliability work |
| **Exhausted** | All hands on reliability; postmortem required |

**Burn Rate Alerting (Better than threshold):**
```promql
# Fast burn: 2% error budget consumed in 1h (14.4x normal)
# Alert if: error rate > 14.4 * (1 - SLO) / window
rate(http_requests_total{status=~"5.."}[1h]) 
  > 14.4 * (1 - 0.999) * rate(http_requests_total[1h])
```

---

## 4. Prometheus — Deep Dive

### Architecture:
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Targets    │────▶│  Prometheus │────▶│ Alertmanager│
│  (exporters)│     │  (TSDB)     │     │  (Alerts)   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Grafana    │
                    │ (Dashboards)│
                    └─────────────┘
```

### Service Discovery (Auto-discover targets):
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
```

### Recording Rules (Pre-compute expensive queries):
```yaml
groups:
- name: recording.rules
  rules:
  - expr: sum(rate(http_requests_total[5m])) by (job, handler)
    record: job:http_requests_rate5m:sum
  - expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, job))
    record: job:http_latency_p95:5m
```

### Alerting Rules:
```yaml
groups:
- name: alerts
  rules:
  - alert: HighErrorRate
    expr: |
      sum(rate(http_requests_total{status=~"5.."}[5m])) by (job)
      /
      sum(rate(http_requests_total[5m])) by (job)
      > 0.05
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High error rate on {{ $labels.job }}"
      description: "{{ $value | humanizePercentage }} of requests failing"
```

### HA Prometheus (Thanos / Cortex / Mimir):
- **Thanos:** Sidecar + Query + Compactor + Store Gateway → Global query, long-term storage (S3/GCS)
- **Cortex:** Microservices architecture, multi-tenant
- **Mimir:** Grafana's Cortex fork, better performance

---

## 5. Grafana — Dashboards & Visualization

### Dashboard JSON Structure:
```json
{
  "title": "Kubernetes Cluster Overview",
  "panels": [
    {
      "title": "CPU Usage %",
      "type": "timeseries",
      "datasource": "Prometheus",
      "targets": [
        {
          "expr": "sum(rate(container_cpu_usage_seconds_total[5m])) by (pod) * 100",
          "legendFormat": "{{pod}}"
        }
      ],
      "fieldConfig": {
        "defaults": {
          "unit": "percent",
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {"color": "green", "value": null},
              {"color": "yellow", "value": 70},
              {"color": "red", "value": 90}
            ]
          }
        }
      }
    }
  ]
}
```

### Key Dashboard Patterns:
| Pattern | Use Case |
|---------|----------|
| **RED** (Rate, Errors, Duration) | Request-driven services |
| **USE** (Utilization, Saturation, Errors) | Resources (CPU, disk, network) |
| **Golden Signals** (Latency, Traffic, Errors, Saturation) | Google SRE standard |
| **Drill-down** | Click panel → detailed dashboard (service → pod → trace) |

### Alerting in Grafana:
- **Grafana Alerting** (unified) or **Prometheus Alertmanager**
- Notification channels: Slack, PagerDuty, Opsgenie, Email, Webhook
- **Silences/Inhibit rules** for maintenance windows

---

## 6. Loki — Logs Like Prometheus (Labels, Not Full-Text Index)

**Loki = Prometheus for logs** — indexes **labels only**, stores compressed chunks.

```yaml
# promtail config (agent)
clients:
  - url: http://loki:3100/loki/api/v1/push
scrape_configs:
  - job_name: kubernetes
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        target_label: app
      - source_labels: [__meta_kubernetes_namespace]
        target_label: namespace
```

**LogQL (Loki Query Language):**
```logql
# All error logs from payment service
{app="payment-service", level="error"}

# Filter by text
{app="payment-service"} |= "timeout"

# Parse JSON and filter
{app="payment-service"} | json | level="error" | order_id="ORD-789"

# Rate of errors
sum by (app) (rate({app=~".*"} |= "error" [5m]))
```

---

## 7. OpenTelemetry — Unified Instrumentation

**OTel Collector Architecture:**
```
Application
    │
    ▼
┌─────────────────────────────────────┐
│        OTel Collector               │
│  ┌─────────┐  ┌─────────┐          │
│  │Receivers│──▶│Processors│────▶│Exporters│
│  │(OTLP,   │  │(batch,   │  │(Prom,   │
│  │ Prom,   │  │ memory,  │  │ Tempo,  │
│  │ Logs)   │  │ filter)  │  │ Loki,   │
│  └─────────┘  └─────────┘  └─────────┘
└─────────────────────────────────────┘
```

**Collector Config:**
```yaml
receivers:
  otlp:
    protocols:
      grpc:
      http:
  prometheus:
    config:
      scrape_configs:
        - job_name: 'my-app'
          static_configs:
            - targets: ['app:9090']

processors:
  batch:
    timeout: 10s
    send_batch_size: 1000
  memory_limiter:
    check_interval: 1s
    limit_mib: 400

exporters:
  prometheus:
    endpoint: "0.0.0.0:9090"
  otlp/tempo:
    endpoint: "tempo:4317"
    tls:
      insecure: true
  loki:
    endpoint: "http://loki:3100/loki/api/v1/push"

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch, memory_limiter]
      exporters: [otlp/tempo]
    metrics:
      receivers: [otlp, prometheus]
      processors: [batch]
      exporters: [prometheus]
    logs:
      receivers: [otlp]
      processors: [batch]
      exporters: [loki]
```

---

## 8. Real-World: Production Observability Stack

### Kubernetes Cluster (AKS/EKS/GKE) — Recommended Stack:
| Component | Tool | Why |
|-----------|------|-----|
| **Metrics** | Prometheus (kube-prometheus-stack) | Native K8s, service discovery, HA via Thanos/Mimir |
| **Logs** | Loki + Promtail | Cheaper than ELK, label-based, integrates with Grafana |
| **Traces** | Tempo + OTel Collector | Object storage backend, no index, fast |
| **Dashboards** | Grafana | Unified, supports all 3 data sources |
| **Alerting** | Alertmanager + Grafana Alerting | Routes, silences, inhibition |
| **Profiling** | Pyroscope / Parca | Continuous profiling (CPU, memory, goroutines) |

### Cost-Optimized Logging:
- **Hot (7 days):** Loki/ES SSD
- **Warm (30 days):** Compressed chunks, cheaper storage
- **Cold (1-7 years):** S3/GCS/Blob, Athena/BigQuery for compliance queries

---

## 9. Interview Questions — Observability

| Question | Strong Answer |
|----------|---------------|
| "Monitoring vs Observability?" | Monitoring = known unknowns (predefined dashboards); Observability = unknown unknowns (ad-hoc exploration via metrics+logs+traces correlation). |
| "Three pillars?" | Metrics (numbers, trends), Logs (events, debug), Traces (request journey). Correlation via trace_id across all three. |
| "SLI vs SLO vs SLA?" | SLI=measure (latency %), SLO=target (99.9% <200ms), SLA=legal contract with penalties. |
| "Error budget kaise kaam karta hai?" | Budget = 100%-SLO. 99.9% = 43 min/month. Budget >50% = normal releases; <10% = freeze releases. |
| "Prometheus cardinality explosion kya hai?" | High-cardinality labels (user_id, request_id) → millions of series → OOM/slow. Fix: low-cardinality labels only; high-cardinality in logs/traces. |
| "PromQL: 95th percentile latency kaise nikale?" | `histogram_quantile(0.95, sum(rate(http_duration_bucket[5m])) by (le, job))` |
| "Loki vs ELK?" | Loki = label-indexed (like Prometheus), cheaper, no full-text index; ELK = full-text search, heavier, better for forensic. |
| "Distributed tracing kaise kaam karta hai?" | Trace ID propagates via headers (W3C traceparent); each service creates spans; collector aggregates; Tempo/Jaeger stores. |
| "OpenTelemetry kyun?" | Vendor-neutral, single instrumentation, multiple exporters (Prometheus, Tempo, Loki, Datadog, etc.). |
| "Alert fatigue kaise kam karein?" | Burn rate alerting (not static thresholds), silencing/inhibition, actionable alerts (runbook link), SLO-based not symptom-based. |

---

## 10. Hands-On Lab (Local Stack)

```bash
# 1. Start local observability stack (Docker Compose)
cat > docker-compose.observability.yml << 'EOF'
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:v2.47
    ports: ["9090:9090"]
    volumes: ["./prometheus.yml:/etc/prometheus/prometheus.yml"]
  
  grafana:
    image: grafana/grafana:10.1
    ports: ["3000:3000"]
    environment:
      GF_SECURITY_ADMIN_USER: admin
      GF_SECURITY_ADMIN_PASSWORD: admin
    volumes: ["./dashboards:/etc/grafana/provisioning/dashboards"]
  
  loki:
    image: grafana/loki:2.9
    ports: ["3100:3100"]
    volumes: ["./loki.yml:/etc/loki/local-config.yaml"]
  
  tempo:
    image: grafana/tempo:2.3
    ports: ["3200:3200", "4317:4317"]
    volumes: ["./tempo.yml:/etc/tempo.yaml"]
  
  otel-collector:
    image: otel/opentelemetry-collector-contrib:0.88
    ports: ["4317:4317", "8888:8888", "9090:9090"]
    volumes: ["./otel-collector.yml:/etc/otelcol-contrib/config.yaml"]
EOF

# 2. Start
docker compose -f docker-compose.observability.yml up -d

# 3. Access
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3000 (admin/admin)
# Tempo: http://localhost:3200
# Loki: http://localhost:3100
```

---

## 11. Summary | Yaad Rakho

1. **Observability = Metrics + Logs + Traces + Correlation** — not just monitoring
2. **SLI = measure, SLO = target, SLA = contract** — Error Budget = 100% - SLO drives release policy
3. **Metrics:** Low-cardinality labels; PromQL for queries; recording rules for perf
4. **Logs:** Structured JSON + trace_id; Loki (labels) or ELK (full-text)
5. **Traces:** OpenTelemetry standard; W3C traceparent propagation; Tempo/Jaeger storage
6. **Prometheus:** Pull model, service discovery, Alertmanager, HA via Thanos/Mimir
7. **Grafana:** Unified dashboards for all 3; RED/USE patterns; alerting
8. **OpenTelemetry:** Single instrumentation, multiple exporters — vendor neutral
9. **Error Budget Policy:** >50% normal, 10-50% slow down, <10% freeze releases
10. **Cost:** Hot/warm/cold tiering for logs; sampling for traces (10-100%)

---
**Related:** [Day 24](../day-24-monitoring-with-prometheus-grafana.md) · [Day 25](../day-25-logging-with-efk-elk-stack.md) · [Day 27](../day-27-sre-principles-and-error-budgets.md) · [K8s Architecture](../topics/kubernetes-architecture.md) · [DevSecOps](../topics/devsecops.md)