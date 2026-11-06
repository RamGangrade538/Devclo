# Demo: Prometheus + Grafana (Local, No Cloud)

Ye ek **fully local** demo project hai jo Prometheus aur Grafana ka real use dikhata hai —
koi cloud account nahi chahiye, bas Docker. Sab kuch `docker compose` se ek command me chal jaata hai.

## Kya banaya hai isme

| Service | Kaam | Port |
|---|---|---|
| **demo-app** (Python/Flask) | Custom metrics banata hai aur `/metrics` pe expose karta hai | `8000` |
| **Prometheus** | Targets ko pull karke TSDB me store karta hai | `9090` |
| **node-exporter** | Host OS ke metrics (CPU, RAM, disk) deta hai | `9100` |
| **Alertmanager** | Alert rules fire hone par webhook pe bhejta hai | `9093` |
| **Grafana** | Dashboards + visualization (auto-provisioned) | `3001` |

> Note: Host pe `3000` already busy tha, isliye Grafana ko `3001` pe map kiya hai.

> **Bina Docker chahiye?** Dekho [`native/README.md`](native/README.md) — wahi setup binaries se,
> `./start.sh` se chalta hai. Docker optional hai.

## Flow (kaise data travel karta hai)

```
demo-app:8000/metrics ─┐
node-exporter:9100 ────┼─► Prometheus (pull + store) ─┬─► Grafana:3001 (dashboards)
prometheus:9090 ───────┘                             └─► Alert rules ─► Alertmanager:9093 ─► app:8000/alerts
```

## Pehle samjho (Hinglish)

- **Prometheus = sensor + memory.** Ye har target ke `/metrics` pe khud jaake (pull) numbers kheenchta hai
  aur time-series database me rakhta hai. Iska kaam collect + store + alert.
- **Grafana = dashboard screen.** Ye khud data collect nahi karta — Prometheus ko datasource bana ke
  uske numbers ko sundar graphs me dikhata hai.
- Dono ek saath chahiye: Prometheus ke paas data hai par achhe graphs nahi; Grafana ke paas graphs hain
  par own data nahi.

## Prerequisites

- Docker + Docker Compose
- Ports free: `8000, 9090, 9100, 9093, 3001`

## Chalao (Run) — 1 command

```bash
cd /home/ubuntu/Desktop/DevClo/devops/demos/24-prometheus-grafana
docker compose up -d --build
```

Agar aapko `docker compose` pe credential-helper panic aata hai (`credsStore: desktop` missing), to
clean config ke saath chalao:

```bash
DOCKER_CONFIG=/tmp/opencode/dockerconfig docker compose up -d --build
```

Ready hone me ~15-20 sec lagte hain.

## Khol ke dekho (URLs)

| Kya | URL | Login |
|---|---|---|
| Grafana dashboard | http://localhost:3001 | `admin` / `admin` |
| Prometheus UI (targets/queries) | http://localhost:9090 | — |
| Prometheus targets | http://localhost:9090/targets | — |
| Alertmanager | http://localhost:9093 | — |
| Demo app | http://localhost:8000 | — |
| Demo app metrics | http://localhost:8000/metrics | — |

## Targets verify karo (saare UP hone chahiye)

```bash
curl -s localhost:9090/api/v1/targets | python3 -m json.tool | grep -E '"job"|"health"'
```

Output me `demo-app`, `node`, `prometheus` — teeno `up` dikhne chahiye.

## PromQL practice (Prometheus UI me daalo)

```promql
up{job="demo-app"}                                                              # 1 = app zinda
sum(rate(demo_http_requests_total[1m]))                                         # requests per second
sum by (status) (rate(demo_http_requests_total[1m]))                            # status-wise rate
histogram_quantile(0.95, sum(rate(demo_request_latency_seconds_bucket[1m])) by (le))   # p95 latency
100 * sum(rate(demo_errors_total[1m])) / clamp_min(sum(rate(demo_http_requests_total[1m])), 0.001)  # error %
sum(rate(demo_orders_total[1m]))                                               # orders/sec
demo_queue_size                                                                 # current queue depth
100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[1m])) * 100)               # host CPU %
100 * (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)        # host RAM %
```

## Alert demo (error rate fire karo)

App ke `/api/error` pe load maaro taaki error ratio 20% se upar jaye:

```bash
end=$((SECONDS+150)); while [ $SECONDS -lt $end ]; do curl -s -o /dev/null localhost:8000/api/error; done
```

~1 min baad:

```bash
curl -s localhost:9090/api/v1/alerts | python3 -m json.tool   # HighErrorRate firing dikhega
docker logs pg-demo-app | grep ALERT                          # Alertmanager ka webhook app pe aaya
```

Alertmanager `http://app:8000/alerts` pe bhejta hai, aur demo app us alert ko log karta hai.

## Grafana me kya milega

Datasource aur dashboard **auto-provisioned** hain (manual add karne ki zaroorat nahi):
`Demo` folder me **"DevClo - Prometheus & Grafana Demo"** dashboard khul jayega jisme:
App Up, Req/s, Error %, p95 latency, orders, queue size, host CPU/RAM panels hain.

## Roko / saaf karo

```bash
docker compose down            # containers + network hatao (data volumes rehte hain)
docker compose down -v         # volumes (Prometheus/Grafana data) bhi hatao
```

## Folder structure

```
24-prometheus-grafana/
├── docker-compose.yml
├── app/                      # demo Flask app + custom metrics
│   ├── app.py
│   ├── requirements.txt
│   └── Dockerfile
├── prometheus/
│   ├── prometheus.yml        # scrape config + targets
│   └── alert-rules.yml       # 4 alert rules
├── alertmanager/
│   └── alertmanager.yml      # webhook receiver
└── grafana/
    ├── provisioning/         # datasource + dashboard auto-load
    └── dashboards/demo-dashboard.json
```

## Troubleshooting

- **App `up 0` dikha raha?** `docker compose ps` se dekho sab Up hain; app logs: `docker logs pg-demo-app`.
- **Grafana pe "No data"?** Datasource URL andar network ke naam se hota hai (`http://prometheus:9090`),
  host se `localhost:9090` — dono sahi hone chahiye.
- **Credential panic** (jab `docker compose` crash kare): upar wala `DOCKER_CONFIG=...` trick use karo,
  root cause `~/.docker/config.json` me `"credsStore": "desktop"` hai par helper install nahi.
- **Port busy**: `docker-compose.yml` me mapping badal do (jaise `"3001:3000"`).

---
Ye demo Day 24 (`day-24-prometheus-grafana-monitoring.md`) ka hands-on companion hai.
