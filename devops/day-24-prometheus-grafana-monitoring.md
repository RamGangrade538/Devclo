# Day 24: Monitoring with Prometheus & Grafana
📚 Topic 24: Observability Deep Dive — Monitoring, Metrics & Alerting
✅ Prerequisite-checklist: (review Day 23 Azure services if needed)

## Overview | Parichay

Bina monitoring ke aapko pata nahi chalta ki system fail hone wala hai. **Prometheus** (metrics collection) aur **Grafana** (visualization/dashboards) - aaj hum observability ka pahla pillar seekhenge.

Jaise car dashboard bataata hai ki fuel, speed, temperature kya hai — waise hi **Prometheus = car ke sensors** (machine se numbers kheenchta hai) aur **Grafana = dashboard screen**. Metrics = numbers (CPU, requests/sec, latency). Prometheus **pull model** use karta hai: khud target ke `/metrics` pe jaake data lata hai — kaam khatam hone ka wait nahi karta (push ki tarah).

### Observability ke 3 pillars

Production system samajhne ke teen nazare hain: **Metrics** (numbers over time — CPU, latency; Prometheus yahan raja hai), **Logs** (events ki kahani — kya hua aur kyun; ELK Day 25), **Traces** (ek request ka safar across services). Aaj ka focus metrics — kyunki **you can't improve what you can't measure**. Monitoring ka matlab sirf graphs nahi: sahi cheez **collect** karo, unhe **dashboard** pe dekho, aur **alert** tab lagao jab user ko dukh shuru hone wala hai — warna dashboard sirf sundar wallpaper hain.

### Pull vs push — Prometheus ka signature move

Prometheus **pull model** use karta hai: har target apna `/metrics` endpoint khola rakhta hai aur Prometheus khud `scrape_interval` (default 15s) pe jaake data kheenchta hai. Fayda tactical hai: target mar gaya to **scrape hi fail** hoga aur metric `up == 0` aa jayega — system ko pata chalta hai ki "data aa raha hai" ya "sensor hi dead hai". Push model me agar exporter band ho jaye to notifications apne aap ruk jaate hain = monitoring hi andha. Exceptions hain (batch jobs, short-lived serverless) jahan Pushgateway hota hai, but default = pull.

Scrape ka practical side:

- `scrape_interval` default 15s — chhota karo to data + load dono badhte hain
- target list static (`targets:`) ya service discovery (k8s pod SD) se aati hai
- scrape timeout bhi hota hai — dheere response = scrape fail = `up 0`

### Metrics ke 4 types — kaun kis kaam ka

| Type | Kya hai | Example | Note |
|---|---|---|---|
| **Counter** | sirf badhta hai (kabhi neeche nahi) | `http_requests_total` | rate se speed nikalte hain |
| **Gauge** | up/down ja sakta hai | `node_memory_MemAvailable_bytes` | instant value |
| **Histogram** | buckets me distribution | `request_duration_seconds_bucket` | p95/p99 isi se |
| **Summary** | client-side quantiles | less common | histogram zyada flexible |

Galat type chunna = galat graph: counter ka raw value matlab kuch nahi, `rate()` hi asli baat bolta hai.

### Exporters — har cheez ka sensor

Prometheus sirf `/metrics` URL padhta hai — jo cheez khud ye format na de uske liye **exporter** hota hai, ek chhota adapter. `node_exporter` = OS ka (CPU, mem, disk, net), `mysqld_exporter` = DB ka, aur modern apps khud **client library** (`prometheus/client_python`, Go client) se apna endpoint kholte hain. Har exporter ka ek port fixed hai (node = `:9100`) taaki scrape config me targets saaf dikhein. Ye "har service ka apna sensor" wala model hi scale karta hai — app ko Prometheus ke baare me sochna hi nahi padta.

### PromQL — metrics ki SQL

**PromQL** Prometheus ki query language hai — time-series pe filter, aggregate aur math. Roz ke 4 kaam:

```promql
up == 0                                     # kaunsa target down hai
100 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100   # CPU%
rate(http_requests_total[5m])               # requests per second
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))   # p95 latency
```

Yaad rakho: **counter pe hamesha `rate()`/`increase()`** lagao (raw counter kabhi graph mat karo), aur window chhoti = noisy, badi = late. Labels se filter/split hote hain (`{job="node"}`) — but label me **user_id jaisa high-cardinality** mat daalo, warna TSDB phat jayega.

### Grafana — numbers ko picture banao

**Grafana** visualization layer hai: datasource ke roop me Prometheus connect karo, phir panels me PromQL likho — CPU, latency, error rate ke dashboards ban jaate hain. Production formula: **RED** (Rate, Errors, Duration — service ke liye) aur **USE** (Utilization, Saturation, Errors — infra ke liye) dashboards. Sharing superpower: dashboard export/import JSON — community dashboards (jaise `1860` node exporter wala) ek import me ready. Variables se ek dashboard 100 machines ke liye chalta hai (`$instance` dropdown).

### Alerting — Alertmanager ka design

Alert likhna aasan hai, **sahi alert** mushkil. Rule file me: `expr` (kab fire), `for: 5m` (lagatar rehna chahiye — 2 second ke spike se page mat jao), `severity` (page vs warn). **Alertmanager** phir grouping (10 replicas ka alert = 1 message), routing (critical → PagerDuty, warning → Slack), silencing (maintenance window) karta hai. Gotchas: 1) sirf **user impact** pe alert (error rate up), sirf resource pe nahi (CPU high), 2) har alert ka runbook/link ho, 3) jo alert koi dekhta nahi wo alert nahi — noisy alerts = alert fatigue = asli incident miss.

Alert design ke 4 sawaal (har rule pe): 1) ye alert **user ko** rok raha hai ya sirf machine dikha raha hai? 2) `for` duration enough hai ki 2-sec ka blip na aaye? 3) is alert ka **runbook link** hai? 4) agar iska response kuch karna hi nahi to alert hata do. Aur haan: **SLO-based burn rate alerts** (Day 27) = threshold alerts se better — kyunki wo budget ki speed dekhte hain, sirf ek number nahi.

### Interview angle

Interview me yahi aksar aata hai: "**pull model ke fayde?**" (down target `up==0` se dikhta hai, central config, target ko Prometheus ke baare me pata nahi), "**counter aur gauge ka fark?**" (monotonic vs fluctuating), "**p95 kaise nikalte ho?**" (histogram + `histogram_quantile`), "**15s scrape vs 1s?**" (cost vs resolution — default enough). 4 golden signals (Day 27): **latency, traffic, errors, saturation** — inhe dashboard pe hamesha rakho.

## What You'll Learn | Aaj Ki Seekh

- [ ] Metrics types: Counter, Gauge, Histogram, Summary
- [ ] Pull vs Push — Prometheus pull kyun karta hai (failures dikh jaati hain)
- [ ] `prometheus.yml` scrape_configs — kaunsi targets, kab scrape
- [ ] Exporters: `node_exporter` (OS metrics) ka full example
- [ ] PromQL: `rate()`, histogram_quantile, basic queries
- [ ] Grafana datasource + dashboards
- [ ] Alertmanager + alert rules (kab fire, kab kisko bhejo)

## Diagram | Dekho Kaise Kaam Karta Hai

```mermaid
flowchart LR
    NE["node_exporter\n:9100/metrics"]
    APP["App (prom client)\n:9090/metrics"]
    PROM["Prometheus\n(pull + TSDB)"]
    GRA["Grafana\ndashboards :3000"]
    AM["Alertmanager\n:9093"]
    SLACK[("Slack / PagerDuty")]
    NE -->|"scrape /metrics"| PROM
    APP -->|"scrape /metrics"| PROM
    PROM --> GRA
    PROM -->|"alert rules fire"| AM
    AM --> SLACK
```

## Demo | Copy-Paste Karke Chalao

```bash
# 1. node_exporter run karo (Linux) - OS ka metrics endpoint
curl -L -O https://github.com/prometheus/node_exporter/releases/download/v1.8.2/node_exporter-1.8.2.linux-amd64.tar.gz
tar xzf node_exporter-*.tar.gz
./node_exporter-*/node_exporter --web.listen-address ":9100" &
curl localhost:9100/metrics | head   # node_cpu_seconds_total, node_memory_MemAvailable_bytes...
```

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
rule_files:
  - "alert-rules.yml"
alerting:
  alertmanagers:
    - static_configs:
        - targets: ["localhost:9093"]
scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]
  - job_name: "node"
    static_configs:
      - targets: ["localhost:9100"]
```
```bash
# 2. Prometheus chalao (host network = localhost targets kaam karein)
docker run -d --name prom --network host \
  -v "$(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml" \
  -v "$(pwd)/alert-rules.yml:/etc/prometheus/alert-rules.yml" \
  prom/prometheus

# open http://localhost:9090/targets
# PromQL: 100 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100 = CPU% | MemAvailable/MemTotal = RAM%
```

```yaml
# alert-rules.yml
groups:
  - name: node-alerts
    rules:
      - alert: NodeDown
        expr: up{job="node"} == 0
        for: 1m
        labels: { severity: critical }
        annotations:
          summary: "node_exporter down hai"
      - alert: HighCPU
        expr: 100 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100 > 80
        for: 5m
        labels: { severity: warning }
        annotations: { summary: "CPU 80% se upar {{ $labels.instance }}" }
```

```yaml
# alertmanager.yml
route:
  receiver: "slack-demo"
  group_by: ["alertname"]
receivers:
  - name: "slack-demo"
    slack_configs:
      - api_url: "https://hooks.slack.com/services/T000/B000/XXXX"
        channel: "#alerts"
```

```bash
docker run -d --name am --network host -v "$(pwd)/alertmanager.yml:/etc/alertmanager/alertmanager.yml" prom/alertmanager
docker run -d --name grafana --network host -e GF_SECURITY_ADMIN_PASSWORD=admin grafana/grafana:10.1

# Grafana me Prometheus datasource API se add karo
curl -X POST http://admin:admin@localhost:3000/api/datasources \
  -H "Content-Type: application/json" \
  -d '{"name":"Prometheus","type":"prometheus","url":"http://localhost:9090","access":"proxy"}'
```

## Real-Life Example | Industry Me

**Production me:** Har prod server pe `node_exporter` (daemon), har app apne `/metrics` pe Prometheus format server karta hai. Prometheus har 15s **pull** karta hai. Grafana pe RED dashboard (Rate, Errors, Duration) + USE dashboard (Utilization, Saturation, Errors). Alertmanager se critical alert → PagerDuty/Slack. **Push vs Pull:** pull se pata chalta hai ki target mar gaya (`up == 0`) — push model mein agar exporter down hai to notifications apne aap ruk jaate hain = andha. Isliye pull standard hai.

## Practice Exercise | Abhi Karein

1. node_exporter download karke chalao, `/metrics` curl karke labels dekho
2. `prometheus.yml` likho (node + prometheus job) aur Prometheus Docker se run karo
3. `localhost:9090/targets` pe dono jobs **UP** verify
4. PromQL likho: CPU%, memory%, `rate(node_disk_read_bytes_total[5m])`
5. Grafana + Prometheus datasource + dashboard 1860 import karo
6. `alert-rules.yml` + Alertmanager + Slack webhook test (node_exporter maro → alert aaye)
7. grafana dashboard par latency/error panels banao (apne app ka dummy metric)

## Quick Notes | Yaad Rakho

```
- Prometheus = pull based TSDB; exporter = /metrics endpoint
- Pull > push: down hone par turant pata chalta hai (up metric)
- node_exporter = OS ke saare counters (cpu, mem, disk, net)
- Counter (up only), Gauge (up/down), Histogram (latency buckets)
- rate(counter[5m]) = per-second speed; histogram_quantile(0.95, ...) = latency
- prometheus.yml: scrape_interval + scrape_configs (job per target group)
- Grafana = visualization + datasources; dashboard import = sharing superpower
- Alertmanager: routes + receivers (Slack/PagerDuty/webhook); for: duration
- Metrics high-cardinality (user_id as label) = MAHA danger - avoid
- 4 golden signals (Day 27): latency, traffic, errors, saturation
```

**Agla:** Logging — ELK Stack se centralized logs (generate → ship → parse → store → visualize) (Day 25).