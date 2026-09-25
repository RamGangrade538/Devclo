# 📈 Monitoring — Alerts, Dashboards, Health

> **Hinglish:** Monitoring = system ki **health par najar** rakhna — kya upar hai, kitna load hai, kya slow hai. Dashboards dikhate hain, alerts jab kuch bada ho toh jagate hain. Ye observability ka "actionable" hissa hai — kab pana karna hai.

## 📖 Overview — Ye Topic Kya Hai

**Observability** (data) se **Monitoring** (action) banati hai. Monitoring 3 kaam karta hai:
1. **Collect** — metrics/logs system se.
2. **Visualize** — dashboards me trends dekhna.
3. **Alert** — rule fail ho toh notify (Slack/PagerDuty/email).

Types: infrastructure (CPU/mem/disk), application (latency/errors), Kubernetes (pods/nodes), cloud (managed services), synthetic (fake user flows), uptime (ping/LB). Alerting ka dhyan: **sirf meaningful alerts** — rule quality, routing, akhir fatigue se yaad rakhna (alert fatigue real hai).

## 🟢 Beginner — Shuruaat yahan se

- Ek service ke liye dashboards banai (Prometheus + Grafana).
- Basic `up/down` + CPU/memory panels.
- Ek simple alert rule (CPU > 80% 5 min) + notification.
- Cloud console ke monitoring se service health check.

## 🟡 Intermediate — Ab meaningful alerts banao

- **Alert rules** — expressions with duration (for: 10m).
- **Alert routing** — teams ko relevant alerts (Slack/email/onduty).
- **Alert fatigue** — noise kam; rule tuning, threshold.
- **Health checks** — HTTP probes, deep (DB) probes.
- **Dashboards designed for response** — har panel action bad.

## 🔴 Advanced — Pro bano

- **Multi-level monitoring** — infra + app + k8s + cloud + synthetic.
- **Capacity monitoring** — trends se resource planning.
- **Alerts as code** — git version, PR review.
- **SLO-based alerting (burn rates)** — alerts ratio of error budget.
- **On-call handoff** — alerts + runbooks + escalation.

## ✅ Important Concepts (Checklist)

Tick karo jab concept clear lagge — localStorage me auto-save hota hai.

- [ ] **Infrastructure monitoring** — servers/network/storage metrics.
- [ ] **Application monitoring** — app latency, errors, throughput.
- [ ] **Kubernetes monitoring** — pods, clusters, capacity.
- [ ] **Cloud monitoring** — managed service telemetry.
- [ ] **Synthetic monitoring** — fake user flows test.
- [ ] **Uptime monitoring** — "service up/down" checks (ping/HTTP).
- [ ] **Health checks** — probe endpoints (`/healthz`).
- [ ] **Alerting** — rules → notify.
- [ ] **Alert rules** — condition + duration.
- [ ] **Alert routing** — alerts kis team/ke channel ko.
- [ ] **Alert fatigue** — bahut saare fake alerts; dhyan kam.
- [ ] **Dashboards** — charts jo trends dikhate hain.
- [ ] **Capacity monitoring** — trend se future needs estimate.
- [ ] **Scrape interval / frequency** — data kitni baar collect ho.
- [ ] **Data retention** — how long metrics logs rehte.
- [ ] **Golden signals** — latency, traffic, errors, saturation.
- [ ] **Baseline/trend** — "normal" kya hai expected.
- [ ] **Silence/maintenance** — alert pause during maintenance.
- [ ] **Escalation** — alert ignored then next person.
- [ ] **Notification channels** — slack/email/pager/sms.
- [ ] **Heartbeat monitoring** — system batao "main hoon".

## 🛠️ Recommended Tools

| Tool | Kya hai | Kab use kare |
|---|---|---|
| Prometheus | Metrics + alerting rules | Backend monitoring |
| Grafana + Alerting | Dashboards + alerts | Visualization + notify |
| Alertmanager | Alert routing/dedup | Multi-channel dispatch |
| Uptime Kuma / Statuspage | Uptime/synthetic | Public uptime status |
| Datadog / New Relic | Managed monitoring | Enterprise SaaS |
| Blackbox exporter | Probe endpoints | Synthetic/blackbox checks |

## 🧪 Practical Labs / Projects

- [ ] **Lab 1 — App Dashboard:** Apni service ke RED dashboard banao; labels sahi rakhne ka dhyan.
- [ ] **Lab 2 — Alert Rule:** CPU/memory threshold alert, duration ke saath; trigger karo aur notification dekh.
- [ ] **Lab 3 — Routing:** Alerts ko 2 channels (slack + email) par route karo severity ke hisaab se.
- [ ] **Lab 4 — Synthetic Check:** Blackbox/prom probe se website up/down + TLS expiry check.
- [ ] **Project — Runbook-Ready Monitoring:** Har alert ke liye runbook link; dashboards + alerts Git se provision (GitOps).

## 🔗 Related Topics

- [📡 Observability](../modules/observability.md)
- [🛰️ SRE](../modules/sre.md)
- [🚒 Incident Management](../modules/incident-management.md)
- [Day 24 — Prometheus & Grafana](../day-24-prometheus-grafana-monitoring.md)