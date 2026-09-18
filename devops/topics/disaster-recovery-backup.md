# Deep Dive: Disaster Recovery & Backup — RTO/RPO, Velero, Site Recovery, Multi-region

> **Kaha ka hai:** Day 41 ka gahra version. DR isn't "backup exists" — it's RTO/RPO targets + a tested, documented plan. Choose tier by risk acceptance.

---

## 1. The Core Metrics

| Metric | What | Example |
|--------|------|---------|
| **RTO** (Recovery Time Objective) | Max downtime you accept | 2 hours |
| **RPO** (Recovery Point Objective) | Max data you can lose | 15 minutes |
| RTO=recovery RPO=data-loss | Both are **business decisions** | — |

```
RPO 15m, RTO 2h  →  need replication (not just nightly backup)
RPO 24h, RTO 24h → daily backup + restore process is fine
```

---

## 2. DR Tiers (from backup-only → active-active)

| Tier | What runs in DR | RTO | Example |
|------|-----------------|-----|---------|
| **Backup & Restore** | nothing; restore from backup | hours–day | daily blob/VM backup |
| **Pilot Light** | minimal control plane (DNS, LB) | 30-60m | small replicas for infra only |
| **Warm Standby** | scaled-down app running | minutes | mini AKS + replica DB |
| **Hot Standby / Active-Active** | full + traffic-split | seconds | Front Door + two regions |

Higher tier = higher cost; pick by business criticality, not tech capability.

---

## 3. Azure Foundation Piece-by-Piece

| Asset | Backup | DR Replica |
|-------|--------|-----------|
| **VMs** | Azure Backup (policy: daily/weekly, retention) | Azure Site Recovery (replicate → DR region, failover/failback, recovery plans) |
| **AKS workloads** | Velero → blob (GRS) | re-create via GitOps (helm/kustomize) + restore; ASR can also replicate whole cluster VMSS |
| **Azure SQL** | PITR (auto 7-35d) | geo-replication (sync/async) + failover group |
| **Cosmos DB** | continuous backup (PITR) | multi-region write/read config |
| **Blob storage** | lifecycle + versioning | GRS / RA-GRS (read-access geo) |
| **Config/KeyVault/IaM** | export/templates in git | GitOps + Key Vault geo-redundant copy |

**Mapping to RPO/RTO:**
```
RPO≈0    → SQL geo-sync, Cassandra multi-region, Garbage GPFS...
RPO≤15m  → ASR (15m-1h), SQL async geo, AKS GitOps re-deploy
RPO≤24h  → Azure Backup daily, Velero daily, blob GRS (within day)
```

---

## 4. Velero (K8s Backup) — Practical

```bash
velero install --provider azure --bucket velero-backups \
  --secret-file ./creds.json \
  --backup-location-config resourceGroup=rg,storageAccount=stgrsc \
  --snapshot-location-config apiTimeout=5m

# on-demand + schedule
velero backup create full --include-namespaces default
velero schedule create daily --schedule="0 3 * * *" --include-namespaces default
velero backup describe full --details
velero restore create --from-backup full
```
- Backs up **resources + PVC snapshots** to object storage (blob GRS = cross-region resilience)
- Restore into **new cluster** (DR region) → "restore items" granular
- Store backup in GRS region so it survives a region failure

---

## 5. Azure Site Recovery (VM-level DR)

- Agent-less replication of VMs/VMSS to paired DR region
- **Recovery Plans**: ordered failover (app → db) + pre/post scripts (Runbooks/Automation)
- **Test failover** → isolated DR VM — independent of prod traffic; do it quarterly
- Failover → app runs from DR; **failback** → replicas restored (don't forget failback!)

```bash
az site-recovery vault create -g rg -n asr-vault -l eastus
az site-recovery replication-policy create -v asr-vault -g rg -n rp60min \
  --app-consistent-snapshot-frequency-hours 1 --recovery-point-retention 24 \
  --replication-frequency 30
# then enable replication per VM via Portal/CLI (choose test/dry-run each quarter)
```

---

## 6. Multi-region AKS (the modern approach)

```
Region1 (east): AKS + SQL geo-Primary + Front Door endpoint
Region2 (west): warm standby AKS (GitOps Argo will materialize), geo-Replica

Failover: Front Door health probe → routes to region2; DNS flips automatically
Recovery: ArgoCD sync (helm values from Git) → app recreated; SQL failover-group to replica
RTO: minutes (infra pre-created), RPO: as SQL failover mode (sync=0)
```
Key: **GitOps = your DR config truth**. All manifests + secrets (ESO) in Git → any region can materialize the same stack. Add **OpenTelemetry** so DR region metrics compare.

---

## 7. The Human Side — Runbooks & Drills

```
Runbook sections: 
  - Contact/on-call escalation
  - Verify signs (what event triggers plan)
  - Ordered steps per tier (velero restore / ASR failover / FrontDoor flip)
  - Verification checklist (SLO probes, data integrity)
  - Failback procedure + cleanup
Drills: quarterly test failover, yearly full game-day (chaos day 40 synergy)
  - Wizardwagon: "test failover cost" — small, worth it
  - Record actual RTO vs target; fix the gap
```
**Post-incident review:** plan vs reality; update runbook; re-test.

---

## 8. Interview Questions — DR

| Question | Strong answer |
|----------|---------------|
| "RTO vs RPO?" | RTO max downtime to restore; RPO max data loss window; both business decisions that dictate architecture (async vs sync replication). |
| "Backup vs DR?" | Backup = point-in-time copies (RPO driven); DR = how the business runs w/o the primary (RTO driven) — backup is a component of DR. |
| "DR tiers?" | Backup&Restore → Pilot Light → Warm Standby → Active-Active (rising cost, falling RTO). |
| "Velero?" | K8s resource + PVC backup to object storage; schedule + restore; cross-cluster/cross-region restore. |
| "ASR?" | VM replication to DR region; recovery plans (ordered+scripts), test failover, failback; PITR point-based failover. |
| "Multi-region AKS sekema?" | GitOps (ArgoCD) materialize DR cluster + SQL geo-failover + Front Door routing; tested quarterly. |
| "Kya chize validate after restore?" | Data integrity (sample checks), app health probes, DNS resolution, secrets availability (ESO), monitoring alerts. |
| "RPO=15m kaise?" | Need replication (ASR/SQL sync), not daily backup. Cost follows your need. |

**Related:** [Day 41](../day-41-disaster-recovery-backup.md) · [Multi-cloud](../topics/multicloud-patterns.md) · [Chaos](../topics/chaos-engineering.md) · [GitOps](../topics/gitops-argocd.md)