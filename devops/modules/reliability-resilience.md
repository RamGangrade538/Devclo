# 💪 Reliability & Resilience — Fail Hoga Hi, Design Aisa Karo

> **Hinglish:** Har system kabhi na kabhi fail hota hai — asli engineer wahi hai jo **failures ko design me include kare**: redundancy, failover, backups, multi-AZ, circuit breakers, retries. Ye module system ko "kuch bhi ho, chalte raho" banata hai.

## 📖 Overview — Ye Topic Kya Hai

**Reliability** = system apne promised behavior ko consistently dene ki ability. **Resilience** = jab cheezein fail ho rahi hon, tab bhi gracefully degrade + recover hone ki ability. Ye synonyms nahi, complement hain.

Design patterns: **redundancy** (extra copies), **failover** (primary git hua toh backup le lo), **backups + restore** (data protection), **replication** (multi-node copies), **multi-AZ/multi-region** (location redundancy), **graceful degradation** (features kam but core on), **rate limiting/circuit breakers** (explosion roko), **bulkheads** (ek service fail → andar isolate), **retries + timeouts** (transient errors handle), aur **chaos engineering** (practice failures se pehle).

## 🟢 Beginner — Shuruaat yahan se

- Redundancy vs backup — farak samjho.
- Single point of failure (SPOF) — apne setup me dhoondo.
- Retry + timeout basics — kab karna, kab nahi.
- Multi-AZ concept — 2 availability zones me duplicate.

## 🟡 Intermediate — Ab design karo

- **Failover strategies** — active/passive vs active/active.
- **Backup types** — full vs incremental; RPO/RTO couple.
- **Replication** — primary/replica, read replicas.
- **Circuit breaker** — bahut saare failures ke baad threshold → open.
- **Graceful degradation** — feature degradation UX.
- **Rate limiting / bulkhead** — shared resources protect.

## 🔴 Advanced — Pro bano

- **Chaos engineering** — game days, fault injection (Litmus).
- **Multi-region active-active** — global failover.
- **Self-healing** — auto-restart, auto-scale, auto-replace.
- **Resiliency scorecards** — regular tests; budgets.
- **DR drills** — scheduled restore/testing.

## ✅ Important Concepts (Checklist)

Tick karo jab concept clear lagge — localStorage me auto-save hota hai.

- [ ] **Fault tolerance** — ek part fail pe bhi system chale.
- [ ] **Redundancy** — extra resources/copies banao.
- [ ] **Failover** — primary fail → backup assume.
- [ ] **Disaster recovery** — big outage from backup recover.
- [ ] **Backup** — data copy; regular + tested.
- [ ] **Restore** — backup se wapas laana (and test it!).
- [ ] **Replication** — multiple copies live sync.
- [ ] **Multi-AZ** — diff availability zones me duplicate.
- [ ] **Multi-region** — poora region fail → dusra.
- [ ] **Graceful degradation** — over loaded pe chote experience.
- [ ] **Rate limiting** — server pe overload control.
- [ ] **Circuit breakers** — repeated failures pe trip (open circuit).
- [ ] **Bulkheads** — ek service ka failure alag rakho.
- [ ] **Retries** — transient errors retry.
- [ ] **Timeouts** — hung calls time-bound.
- [ ] **Chaos engineering** — deliberate failure testing.
- [ ] **Single point of failure** — ek jagah ka dependent weak.
- [ ] **Health checks + auto-restart** — orchestrator detect+fix.
- [ ] **Load shedding** — overload pe low priority drop.
- [ ] **Quorum / majority** — distributed decisions consensus.
- [ ] **Data durability** — data kabhi na kho (versioning, registry).
- [ ] **Disaster recovery drill** — practice recovery.

## 🛠️ Recommended Tools

| Tool | Kya hai | Kab use kare |
|---|---|---|
| Litmus / Chaos Mesh | Chaos testing | Failures inject karna |
| Velero | K8s backup/restore | Cluster DR |
| Restic / Cloud backups | Data backups | Automated backup |
| Terraform | Multi-AZ/DR infra | Redundant topologies |
| HPA / autoscaler | Auto scaling | Self-healing capacity |
| Statuspage | DR status | Public comms |

## 🧪 Practical Labs / Projects

- [ ] **Lab 1 — SPOF Hunt:** Apni app ka diagram banao + SPOF dhoondo — fix design (replicas, LB).
- [ ] **Lab 2 — Failover Drill:** Primary DB kill karo, failover hote dekh, recover karo.
- [ ] **Lab 3 — Backup + Restore:** Velero restic backup karo, restore in isolation, verify data.
- [ ] **Lab 4 — Circuit Breaker:** Apne code/tool me circuit breaker pattern test karo (trip + recover).
- [ ] **Project — DR Runbook + Drill:** Multi-AZ redundant stack; scheduled chaos drill + DR runbook complete karo.

## 🔗 Related Topics

- [🛰️ SRE](../modules/sre.md)
- [🚒 Incident Management](../modules/incident-management.md)
- [🗄️ Databases](../modules/databases.md)
- [Chaos Engineering](../topics/chaos-engineering.md)
- [Disaster Recovery & Backup](../topics/disaster-recovery-backup.md)
- [Day 40 — Chaos Engineering](../day-40-chaos-engineering.md)
- [Day 41 — Disaster Recovery & Backup](../day-41-disaster-recovery-backup.md)