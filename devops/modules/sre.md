# 🛰️ SRE — Site Reliability Engineering

> **Hinglish:** SRE = "DevOps ko engineering se scale karna" — reliability ko **number me** manage karte ho: SLIs, SLOs, error budgets. Toil kam, automation zyada, incidents blameless postmortem ke saath. Google ne is role ko banaya; aaj har senior DevOps/Platform role me iski demand hai.

## 📖 Overview — Ye Topic Kya Hai

Ek system kabhi bhi 100% up nahi rah sakta — cheezain fail hoti hain. **SRE** ka kaam hai: **ye decide karna ki kitni reliability "enough" hai** aur usse **cost vs feature speed** ke saath balance karna.

Core ideas:
- **SLI** — kya measure kar rahe ho (availability = % of successful requests).
- **SLO** — kitne ki target (`99.9%` monthly).
- **Error budget** — allowed failure `100 - SLO` = kalmala; error budget consume hone pe features ruko (deploy slow/stop), reliability fix karo.
- **Toil** — repetitive manual kaam; automate/reduce.
- **On-call + blameless postmortem** — incidents se learning.
- **Automation & capacity planning** — scale proactively.

## 🟢 Beginner — Shuruaat yahan se

- SLI vs SLO vs SLA — matlab aur uthaath.
- `99.9%` ka matlab — allowed downtime kya (monthly ~43 min).
- Error budget socho — formula, jab khatam ho.
- Availability equation: `successful / total * 100` — real data se.

## 🟡 Intermediate — Ab numbers se kaam karo

- SLO definitions: availability, latency (p99), error rate.
- **Burn rate alerts** — budget fast consume → page.
- **Toil reduction** — ek repetitive task automate karo (script/runbook).
- **On-call rotations** — handoff, escalation, SLO-based alerting.
- **Capacity planning** — growth estimate, headroom.

## 🔴 Advanced — Pro bano

- **Reliability engineering** — failure modes, fault tolerance design.
- **Chaos engineering** — deliberate failure testing (game days).
- **Multi-SLO service tiers** — critical vs best-effort.
- **Error budget policy** — when to stop fast rollout.
- **SRE dashboards + automation** — SLI dashboards, auto-remediation.

## ✅ Important Concepts (Checklist)

Tick karo jab concept clear lagge — localStorage me auto-save hota hai.

- [ ] **SRE principles** — reliability engineering ko production me le jaate hain.
- [ ] **Reliability** — users ka bharosa; consistent up-time.
- [ ] **SLIs** — indicators: success rate, latency, error rate.
- [ ] **SLOs** — targets: "99.9% requests successful".
- [ ] **SLAs** — legal agreements with customers (with consequences).
- [ ] **Error budgets** — allowed failures; 100% - SLO.
- [ ] **Availability** — uptime; 9s (99.9, 99.99…).
- [ ] **Latency** — response time (p50/p99).
- [ ] **Throughput** — requests/services per second.
- [ ] **Saturation** — resource kitna bhar gaya (normalize).
- [ ] **Toil** — manual, repetitive, automatable work.
- [ ] **Automation** — toil aur repetitive judgement ka compute.
- [ ] **Incident management** — process for outages.
- [ ] **On-call** — rotation; alerts ka ownership.
- [ ] **Escalation** — level-wise handoff.
- [ ] **Postmortems** — severe incident analysis after.
- [ ] **Blameless culture** — system failure, person not.
- [ ] **Capacity planning** — growth ke liye prepare.
- [ ] **Reliability engineering** — MTBF, MTTR, failure design.
- [ ] **Fault tolerance** — baki sab chale ek fail pe bhi.
- [ ] **Chaos engineering** — test failures deliberately.
- [ ] **Burn rate alerts** — error budget burn measured.
- [ ] **SLI dashboard** — har service ka SLI visible.
- [ ] **Error budget policy** — trade-off of features vs reliability.

## 🛠️ Recommended Tools

| Tool | Kya hai | Kab use kare |
|---|---|---|
| Prometheus + Grafana | SLI data + dashboards | SLO monitoring |
| Sloth / Pyrra | SLO tooling/code | SLOs as code |
| PagerDuty / Opsgenie | On-call scheduling | Incidents/on-call |
| Litmus / Chaos Mesh | Chaos engineering | Failure testing |
| Blameless / Jira Ops | Postmortems | Incident review |
| Terraform + runbooks | Automation | Self-healing fixes |

## 🧪 Practical Labs / Projects

- [ ] **Lab 1 — SLO Math:** Apni service ke metrics se SLI banao; 30-day SLO target compute karo.
- [ ] **Lab 2 — Error Budget Dashboard:** Remaining budget Grafana me show karne wala panel banao.
- [ ] **Lab 3 — Burn Rate Alerts:** 1h/5m burn-rate alert rules likho; trigger test karo.
- [ ] **Lab 4 — Toil Hunt:** Ek repetitive manual task find karo (job, dashboards) + automate karo.
- [ ] **Lab 5 — Game Day:** Issues simulate karo (kill pod, DB fail) — on-call simulation, postmortem likho.
- [ ] **Project — SLO-as-Code:** Multi-service ke SLI/SLO + alerts + dashboard sab Git me (Sloth)).

## 🔗 Related Topics

- [📈 Monitoring](../modules/monitoring.md)
- [📡 Observability](../modules/observability.md)
- [🚒 Incident Management](../modules/incident-management.md)
- [💪 Reliability & Resilience](../modules/reliability-resilience.md)
- [Observability & SRE (SLI/SLO)](../topics/observability.md)
- [Day 27 — SRE Concepts](../day-27-sre-concepts-reliability.md)