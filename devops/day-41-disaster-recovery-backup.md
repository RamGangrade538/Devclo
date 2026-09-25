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

### DR ka matlab — "when", not "if"

DR (Disaster Recovery) ka sawal ye nahi hai ki disaster **hoga ya nahi** — data center outage, ransomware, bad deploy, region failure — kuch na kuch **kabhi na kabhi** hoga. Sawal hai: us din business kitni jaldi wapas chalega aur kitna data wapas aayega. Isliye do numbers pehle likho: **RTO** (Recovery Time Objective — max downtime business tolerate kar sakega, e.g., 2 ghante) aur **RPO** (Recovery Point Objective — max data loss acceptable, e.g., last 15 min ya bilkul 0). Ye do numbers hi poori architecture decide karte hain — RPO 0 chahiye to real-time **replication** chahiye (backup nahi chalega), RTO 6 ghante hai to manual restore bhi chalega. Simple analogy: backup = insurance, DR plan = accident ka emergency number — insurance akela kaam ka nahi jab raat 2 baje bulaana ho.

### RTO/RPO — numbers jo design decide karte hain

| Term | Matlab | Example | Driven by |
|---|---|---|---|
| **RTO** | max restore time | 2h, 15min | revenue/min of downtime |
| **RPO** | max data loss window | 24h, 15min, 0 | data value (orders vs logs) |

RPO 24h hai to **daily backup** kaafi; RPO 15min hai to hourly/daily dump nahi — **replication** ya continuous log shipping chahiye; RPO 0 chahiye to sync replication (jo latency/deta hai — hamesha possible nahi). RTO 5min hai to restore manually nahi hoga — **warm/hot standby** chahiye. Ye equation interview me aksar aata hai: *"E-commerce ke liye RTO/RPO kya rakhoge?"* → checkout down = direct revenue loss, to RTO minute-level (hot standby); payment records = RPO ~0 (geo-replica), logs = RPO 24h bhi chalega. Har component ka RTO/RPO alag ho sakta hai — tier-wise decide karo.

### DR tiers — kitna ready rakhna hai

Chaar classic tiers (cost vs speed ka trade-off):

- **Level 0 — Backup & Restore**: sirf backups; DR site nahi. RTO/RPO = hours-din; sabse sasta. Dev/non-critical ke liye.
- **Level 1 — Pilot Light**: chhota control/data replicated rehta hai (e.g., DB replica chalu, app deploy nahi); failover pe app spin hota hai. RTO ~tens of minutes.
- **Level 2 — Warm Standby**: mini version prod ka chalu rehta hai (smaller scale); traffic badhao, scale-up karo. RTO minutes.
- **Level 3 — Hot Standby / Active-Active**: dono sites live, traffic split (Front Door/Geo-DNS). RTO ~seconds; sabse mehnga.

Ye ladder hai — sab tier 3 ki zaroorat nahi. Tier decide karo: criticality * RTO/RPO * budget. Azure me **paired regions** hote hain (East US <-> West US) — paired region isliye ki replication aur updates coordinate ho sake.

### Backup vs DR — dono alag cheez hain

Ek bada confusion: "backup hai to DR hai" — nahi. **Backup** = data ki point-in-time copy (kaam aati hai corruption, user delete, ransomware me); **DR** = pura system wapas chalana (infra + app + data + config + traffic). Backup lene ka kaam easy hai, **restore** ka test nahi kiya to wo "paper backup" hai — industry me sabse common failure: "backups 2 saal se chal rahe the, restore pe pata chala corrupt the". Rule: **backup tabhi hai jab restore test hua ho**. Aur DR me sirf data nahi chahiye — Terraform se infra re-create, GitOps se manifests, secrets, DNS/Traffic Manager switch, aur **runbook** (kaun kya karega) — ye sab bhi chahiye. Isliye Velero (k8s resources + PVC) alag hai, Azure Backup (VM disks) alag, SQL geo-replica alag — teeno ka role alag hai.

### Tools ka role — Velero, ASR, geo-replica, Front Door

- **Velero**: k8s ka backup tool — cluster resources (deployments, services, configmaps) + PVCs ko object storage (blob/S3) me dump karta hai; schedule + restore + cluster migrate bhi. K8s recreate → Velero restore = app wapas.
- **Azure Backup**: VM/file share/DB ke managed backups — policy (daily/weekly + retention), vault me restore points.
- **ASR (Azure Site Recovery)**: VM disk **replication** DR region me + ordered **recovery plans** + sabse zaroori — **test failover** bina prod impact ke. Backup se zyada "site failover" hai.
- **SQL geo-replication / Cosmos multi-region**: PaaS tier pe HA built-in — failover endpoint switch, RPO ~0 possible.
- **Front Door / Traffic Manager**: traffic ko primary se secondary me **steer** karna (health probe based). DR me yehi "switch" aapke paas hai.

Sawaal: "AKS app ka DR kaise?" → infra = Terraform re-run, state = Velero, DB = geo-replica, traffic = Front Door — combined answer chahiye.

### Testing — drill bina DR ka koi value nahi

DR plan tab tak **hypothesis** hai jab tak test nahi hua. Monthly/quarterly **recovery drill** chalao: primary simulate down → failover trigger → time note karo (**actual RTO**) → data check karo (**actual RPO**) → runbook update → **failback** bhi test karo (wapas primary pe jaana failover jitna hi mushkil hota hai). ASR ka **test failover** feature isliye hai — isolated environment me, production pe bina effect ke. Metrics log karo: "Target RTO 2h, actual 45min — pass". Common traps: restore test kabhi nahi, retention zero (compliance fail), same-region vault (region down to backup bhi gaya), failback ka plan hi nahi. Chaos ke saath pair karo (Day 40): gameday me pod-kill + failover dono. Interview me: *"DR test kab kiya tha?"* — iska jawab date ke saath hona chahiye.

### Interview angle — DR ke sawal

Common asks: (a) "RTO/RPO define karo" → downtime vs data loss, examples ke saath. (b) "DR options batao" → 4 tiers with cost/speed. (c) "0 RPO kaise doge?" → sync replication (SQL primary/secondary sync mode), active-active writes (Conflict-free/Quorum) — trade-offs latency/complexity. (d) "backup vs DR difference" → restore file vs run whole site. (e) "k8s DR tool?" → **Velero**. (f) "failover kaise trigger hota hai?" → health-probe based (Front Door/Traffic Manager) ya manual recovery plan. Bonus: RPO/RPO mismatch = "daily backup but requirement was 15 min" — replication chahiye tha. Ek line: DR = "written + tested + numbers-driven", else it's just hope.

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