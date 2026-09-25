# 📡 Observability — Metrics, Logs & Traces

> **Hinglish:** System me "kya ho raha hai" ye janne ka tariqa hai Observability. Logs goya diaries, Metrics goya health check, Traces goya phone-tap (ek request ka pura safar). Ye teen pillars modern monitoring ka base hain — Prometheus, Grafana, OpenTelemetry, Loki, Jaeger, ELK.

## 📖 Overview — Ye Topic Kya Hai

Ek request aa rahi hai, response slow hai — kahan rukgi? **Observability** ka jawab: system ko **instrument** karo (code + infra me telemetry) jisse tum **bahar se** samajh sako **andar kya chal raha hai** — bina manual digging ke.

Teen pillars:
- **Metrics** — numbers (request rate, CPU, latency p99, error count) — time-series.
- **Logs** — discrete events with context (structured, levels).
- **Traces** — distributed call-path per request (span/trace) — response kahan time khaya.

**OpenTelemetry** = in tino ko collect karne ka standard (SDK + collector). Ye data ke **backend system** (Prometheus, Loki/Tempo/Jaeger, ELK) tak bheja jata hai. "Three pillars + OpenTelemetry" interview favourite question hai.

## 🟢 Beginner — Shuruaat yahan se

- 3 pillars ka difference samjho — metrics numbers, logs events, traces paths.
- Prometheus pe ek exporter scrape; Grafana dashboard dekh.
- Ek app me log statements; structured logging.
- OpenTelemetry se hello trace bhejo (Jaeger me dekho).

## 🟡 Intermediate — Ab meaning nikal do

- **Metrics types** — counter, gauge, histogram, summary.
- **Rates & percentiles** — p50/p99; jaise latency.
- **Cardinality** — labels zyada = data blow up; careful.
- **Log levels + structured logs** — JSON logs, parseable.
- **Centralized logs** — aggregator (Loki/ELK), search/alert.
- **Distributed tracing** — trace→spans, context propagation (traceparent).

## 🔴 Advanced — Pro bano

- **OTel collector pipelines** — receive/process/export; sampling.
- **Service-level dashboards** — tail-Latency analysis, RED/USE methods.
- **Trace-to-metrics correlation** — incident RCA fast.
- **Sampling strategies** — head vs tail base.
- **Observability-as-code** — dashboards/alerts in git.

## ✅ Important Concepts (Checklist)

Tick karo jab concept clear lagge — localStorage me auto-save hota hai.

- [ ] **Three pillars** — metrics + logs + traces.
- [ ] **Metrics** — time-series numbers (requests, errors, latency).
- [ ] **Logs** — event records (timestamp + message + context).
- [ ] **Traces** — ek request ka distributed call-path.
- [ ] **Counters** — only-increasing counters (total requests).
- [ ] **Gauges** — current value (CPU, memory).
- [ ] **Histograms** — buckets; latency distribution.
- [ ] **Percentiles** — p50/p95/p99 — apne latency ka "sach".
- [ ] **Cardinality** — unique label combinations; high = heavy.
- [ ] **Structured logging** — machine-readable logs (JSON).
- [ ] **Log levels** — info/warn/error/debug — filter karo.
- [ ] **Centralized logging** — sab servers ki logs ek jagah.
- [ ] **Log aggregation** — collect + index + search.
- [ ] **Log retention** — logs kab tak rakhne (cost/compliance).
- [ ] **Distributed tracing** — seprated services me call-path.
- [ ] **Trace** — poori request ka journey.
- [ ] **Span** — ek operation measure (with parent/child).
- [ ] **Context propagation** — span context request headers me (traceparent).
- [ ] **OpenTelemetry** — standard: SDK + collector for all 3.
- [ ] **Prometheus** — metric storage + query language (PromQL).
- [ ] **Grafana** — dashboards from metrics/logs.
- [ ] **Loki** — log aggregation (Grafana ecosystem).
- [ ] **Jaeger / Tempo** — tracing backends.
- [ ] **Elasticsearch / Fluent Bit / Fluentd** — log pipelining.
- [ ] **Scrape vs push** — Prometheus pull; Loki push; OTel both.
- [ ] **RED method** — Rate, Errors, Duration (request-focused).
- [ ] **USE method** — Utilization, Saturation, Errors (resource-focused).
- [ ] **Service map** — services ke beech dependencies visual.
- [ ] **Alerting from telemetry** — "kab action lena hai" rules.

## 🛠️ Recommended Tools

| Tool | Kya hai | Kab use kare |
|---|---|---|
| Prometheus | Metrics DB + PromQL | Time-series metrics |
| Grafana | Visualization | Dashboards + alerts |
| OpenTelemetry | Telemetry standard SDK | Instrument #all apps |
| Loki / Promtail | Log aggregation | Logs search, cheap |
| Elasticsearch + Kibana | Log/ES stack | Full-text log analysis |
| Jaeger / Tempo | Trace backends | Distributed tracing |
| Fluent Bit | Lightweight log collector | Forwarding logs |

## 🧪 Practical Labs / Projects

- [ ] **Lab 1 — Instrument a Web App:** App add Prometheus metrics endpoint, scrape, Grafana dashboard 3 panels.
- [ ] **Lab 2 — Structured Logs:** JSON logs emit karo, Loki me query, search demo.
- [ ] **Lab 3 — Trace a Request:** OTel SDK se hello service pai trace bhejo, Jaeger waterfall dekh.
- [ ] **Lab 4 — RED Dashboard:** Request rate + error rate + p99 latency dashboard banai.
- [ ] **Project — OTel Collector:** Collector se app→OTel→(Prom+Loki+Tempo) pipeline, sampling set karo.

## 🔗 Related Topics

- [📈 Monitoring](../modules/monitoring.md)
- [🛰️ SRE](../modules/sre.md)
- [🩺 Troubleshooting](../modules/troubleshooting.md)
- [Observability & SRE (SLI/SLO)](../topics/observability.md)
- [Distributed Tracing / OpenTelemetry](../topics/distributed-tracing-opentelemetry.md)
- [Day 24 — Prometheus & Grafana](../day-24-prometheus-grafana-monitoring.md)
- [Day 25 — ELK Logging Stack](../day-25-elk-logging-stack.md)