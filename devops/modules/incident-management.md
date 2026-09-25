# 🚒 Incident Management — Outage Se Recovery Tak

> **Hinglish:** Production tooti! "Kis chakkar me kya kahani, kaun kya kare, kab escalate kare" — ye incident management ka game hai. Detection → triage → containment → resolution → blameless postmortem. Runbooks, on-call, aur communication sab isi ke hisse hain.

## 📖 Overview — Ye Topic Kya Hai

Incident = user-visible impact ya severe degradation. **Incident management** wo disciplined process hai jo incident ko **fast + calmly** handle karta hai — confusion nahi, panic nahi.

Lifecycle: **Detection** (monitoring/alert/user) → **Triage** (severity decide) → **Containment** (damage roko — failover, feature off) → **Mitigation/Resolution** (service bachao) → **Postmortem** (root cause + actions). Saath me **communication** (status updates, users ko batana), **runbooks** (pehle se test kiye GYE steps), aur **on-call rotations**.

## 🟢 Beginner — Shuruaat yahan se

- Incident ke types/levels kya hain (minor, major, critical).
- Severity levels (SEV1-4) matlab samjho.
- Pehla on-call experience: alert aa, triage, contain.
- Status page update/dhayan (`operational`, `degraded`).

## 🟡 Intermediate — Ab process chalao

- **Detection**: alerts kya trigger kare, monitoring quality.
- **Triage & escalation matrix** — kab IC/manager ko lana.
- **Runbooks** likhna: step-by-step + commands + rollback.
- **Postmortems** likhna: timeline, RCA, action items (blameless).
- **Communication templates** — incident status updates.

## 🔴 Advanced — Pro bano

- **Incident Command (IC)** — roles: IC, comms lead, responders.
- **Pre-mortem / game days** — pehle se practice.
- **MTTR, MTBF metrik** — improvements measure karo.
- **On-call scheduling & handoff** — pager fatigue manage karo.
- **Automated remediation** — scripts se auto-fix, alert auto-check.

## ✅ Important Concepts (Checklist)

Tick karo jab concept clear lagge — localStorage me auto-save hota hai.

- [ ] **Incident lifecycle** — detect → respond → recover → learn.
- [ ] **Detection** — alert/user poc/uptime check se pata chala.
- [ ] **Triage** — kya, kab, severity, kisko bhejo.
- [ ] **Severity** — impact level (sev1 = down, sev4 = minor).
- [ ] **Escalation** — level ke saath handoff.
- [ ] **Mitigation** — temporary fix (rollback, offload).
- [ ] **Resolution** — root fix + recovery complete.
- [ ] **Root cause analysis (RCA)** — asli wajah (not the trigger).
- [ ] **Postmortems** — after-incident documented review.
- [ ] **Runbooks** — tested steps for known issues.
- [ ] **Playbooks** — repeatable action checklists.
- [ ] **Incident communication** — stakeholders ko status updates.
- [ ] **On-call rotations** — alert wala wakt, owner.
- [ ] **PagerDuty / Opsgenie concepts** — on-call scheduling tools.
- [ ] **Severity matrix** — rules for assigning severity.
- [ ] **Status page** — external users ko updated state.
- [ ] **Incident commander** — leader who decides.
- [ ] **Timeline** — incident ki record (pehla time → recovery).
- [ ] **Blameless postmortem** — system focus, not "kisi ki galti".
- [ ] **Action items** — fix commitments postmortem se.
- [ ] **MTTR / MTBF** — repair vs failure metrik.
- [ ] **War-game / simulation** — incident practice.
- [ ] **On-call best practice** — handoff, rest, fair rotation.

## 🛠️ Recommended Tools

| Tool | Kya hai | Kab use kare |
|---|---|---|
| PagerDuty | On-call + incident mgmt | Alerts → on-call |
| Opsgenie (Atlassian) | Alert/on-call | Jira ecosystem |
| Statuspage | Public status | Users ko update |
| Slack/#incident | Communication | Real-time collaboration |
| Jira / Linear | Postmortem tracking | Actions track |
| Grafana/Alertmanager | Detection source | Incident detection |

## 🧪 Practical Labs / Projects

- [ ] **Lab 1 — Runbook Likho:** Apne app ke 2 known failure (DB down, OOM) ke runbooks likho.
- [ ] **Lab 2 — Severity Matrix:** Apni team ki severity definitions banao (SEV1-4, examples).
- [ ] **Lab 3 — Simulation:** Lokal pe incident simulate karo (kill DB) — triage, contain, resolve by clock.
- [ ] **Lab 4 — Postmortem:** Sare steps likho — timeline, RCA (5 Whys), actions (blameless tone).
- [ ] **Project — On-Call Setup Kit:** Alerts + runbook + escalation + status page kit banao ek service ke liye.

## 🔗 Related Topics

- [📈 Monitoring](../modules/monitoring.md)
- [🛰️ SRE](../modules/sre.md)
- [💪 Reliability & Resilience](../modules/reliability-resilience.md)
- [Day 40 — Chaos Engineering](../day-40-chaos-engineering.md)
- [Day 41 — Disaster Recovery & Backup](../day-41-disaster-recovery-backup.md)