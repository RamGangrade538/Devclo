# Day 41: Disaster Recovery & Backup — RTO/RPO, Velero, Azure Site Recovery, Multi-region

> DR = "jab data center down ho to business kitni jaldi chalega." RTO (recovery time) & RPO (data loss window) define plan. Backup = versioned copies; Recovery = bring apps + data to run again (multi-AZ → multi-region).

## Overview | Parichay

Survival not about "will it break" but "when it breaks, what's the recovery story." Key concepts:
- **RTO** = max time to restore service (e.g., 2h)
- **RPO** = max acceptable data loss (e.g., 15 min or 0)
- **Backup** = point-in-time copies (retention/versioning)
- **DR site** = where recovery runs (Azure Paired Region, second region clone)
- **Tiers:** 
  - Level 0: Backup & Restore (no DR site)
  - Level 1: Pilot Light (small replicated control)
  - Level 2: Warm Standby (mini app running)
  - Level 3: Hot Standby / Active-Active (both running)

Tools: **Velero** (K8s backup to object storage + restore), **Azure Backup** (VM/DB/file), **ASR (Azure Site Recovery)** (replicate VM to DR region, failover test), **Azure SQL geo-replication** (PAAS copy), **Azure Front Door / Traffic Manager** (traffic steering).

## What You'll Learn | Aaj Ki Seekh

- [ ] RPO/RTO taxonomy + DR tiers (Backup < Pilot < Warm < Hot)
- [ ] Velero: back up k8s resources + PVC to Blob/AWS—scheduled + on-demand; restore/migrate
- [ ] Azure Backup: VM backup policy, retention, restore points
- [ ] ASR: replicate + failover/failback, **recovery drills without impact**
- [ ] Azure SQL geo-replica / Cosmos multi-region — PAAS HA baked in
- [ ] Multi-region AKS: two regions + GitOps + Active-Active design (Front Door)
- [ ] DR plan testing: recovery drills, RTO validation, runbooks

## Diagram | Dekho Kaise Kaam Karta Hai

```mermaid
flowchart TD
    PROD["Primary (Azure East US)
    AKS + SQL + Storage"]
    ASR["Azure Site Recovery
    replication (vSphere/VM/disk)"]
    VELERO["Velero
    k8s: resources + PVC → blob"]
    SQLREP["SQL geo Replica
    (PAAS, async/sync)"]
    DR["DR Site (Azure West US)
    AKS GitOps restore + Front Door"]
    GOAL["Traffic → West when East down
     (Front Door health routing)"]
    PROD --> ASR
    PROD --> VELERO
    PROD --> SQLREP
    VELERO -->|blob (geo-redundant)| DR
    SQLREP -->|replica| DR
    ASR -->|failover| DR
    DR --> GOAL
```

ASCII:
```
Backup: Velero(blob) + ASR(VM disks) + SQL-replica → DR template (GitOps clone infra)
Recovery: Front Door failover → DR cluster → validate → restore workloads → check RTO
Test: monthly recovery drill with telemetry (RTO vs actual)
```

## Demo | Copy-Paste Karke Chalao

```bash
# 1. Velero install (k8s backup)
velero install --provider azure \
  --bucket velero-backups --secret-file ./credentials-azure \
  --backup-location-config resourceGroup=rg,storageAccount=savelogs \
  --snapshot-location-config apiTimeout=5m

# 2. Backup now + schedule
velero backup create bkg-all --include-namespaces default
velero schedule create daily-backup --schedule="0 3 * * *" \
  --include-namespaces default

# 3. Restore (after battery disaster)
velero restore create --from-backup bkg-all
velero backup describe bkg-all --details

# 4. Azure VM backup
az backup vault create -g rg -n vault-backup -l eastus
az backup policy create -g rg -vault-name vault-backup \
  --policy-name Daily1wk \
  --backup-management-type AzureIaasVM \
  --schedule "@daily" --backup-time 02:00 \
  --retention-daily 7 --retention-weekly 4 \
  --retention-monthly 12
az backup protection enable-for-vm -g rg --vault-name vault-backup \
  --vm vm-web --policy-name Daily1wk

# 5. ASR (site recovery)
# portal → Recovery Services vault → Enable replication (VM) → DR region (West US)
# Create recovery plan (groups + failover order + post-scripts)
az site-recovery vault create -g rg -n asr-vault -l eastus
# then: portal select vm → enable replication → choose target (region)

# 6. SQL geo-replica (PAAS)
az sql db replica create -g rg -s srcserver -d mydb \
  -p dstserver --partner-resource-group rg-dst

# 7. Traffic Manager (DNS failover)
az network traffic-manager profile create -g rg -n tm-web \
  --routing-method Priority --unique-dns-name webdr
az network traffic-manager endpoint create -g rg --profile-name tm-web \
  -n primary --type azureEndpoints --target-resource-id /.../app-east \
  --priority 1 --endpoint-status Enabled
az network traffic-manager endpoint create -g rg --profile-name tm-web \
  -n secondary --type azureEndpoints --target-resource-id /.../app-west \
  --priority 2 --endpoint-status Enabled
```

## Real-Life Example | Industry Me

**DR plan (full-stack, e.g., e-commerce):**
```
Component        Backup/Replica            DR behavior
AKS cluster      Velero → blob GRS         terraform recreate in west; restore from latest
Stateful DB      SQL geo-replica (sync=1)  failover SQL endpoint; RPO≈0
Storage blobs    Geo-redundant (GRS) + backup policy   read from replica
Config/Secrets   repo + Vault-ish         GitOps re-apply (auto)
Front Door       health probe to east      auto fail → west endpoint w/ PreFlight
```
**Test day:** simulate east outage → Front Door fails → west takes traffic (Active-Active) → revenue continues; hot standby, RTO <15min, RPO ≤1min. **Then failback** east.

**Common traps:** 
- Backup enabled but **restore never tested** (paper DR)
- RPO mismatch: backup daily but requirements "15 min data loss" → need replica not dump
- GVault same region only → pick GRS/region pair
- Backups no retention → compliance audit fail
- No DR runbook → panic (10x real downtime)

## Practice Exercise | Abhi Karein

1. Velero: install, backup ns, delete pod/deploy, restore — verify
2. Schedule daily backup + retention verify in blob
3. ASR: enable replication for 1 VM, run **test failover** (isolated) — validate restore, **failback**
4. SQL geo-replica: update source → replica csu; read replica query
5. Traffic Manager profile: endpoints primary/secondary, test endpooint markdown — traffic flip
6. Compute your app's RTO/RPO DOC — write DR plan (tiers) + monthly drill checklist

## Quick Notes | Yaad Rakho

```
- RTO = max downtime; RPO = max data lost; tier drives design:
  Backup-only | Pilot Light (control plane) | Warm Standby | Hot/Active-Active
- Velero: k8s resources + PVC → object storage; scheduling/retention; restore-items
- Azure Backup: VM, policy (daily/weekly/monthly) + retention; restore points
- ASR: replication + failover/failback + Recovery Plans (ordered, with scripts) + TEST FAILOVER freely
- PAAS HA: SQL geo-replica, Cosmos multi-region write/read — cheaper than full DR
- Storage: LRS vs GRS vs ZRS — match RPO; GRS for DR region
- Multi-region AKS: GitOps re-create in DR region + Front Door failover
- DR = DOCUMENTED runbook + tested (drills) — else it's just "hope"
- Failback plan as important as failover; monitor both directions
```

**Agla:** Multi-Cloud & Cloud-Agnostic Patterns — ports, feathers, Terraform multiversal.