# Day 26 — Terraform State, Drift, DR & Scaling (DevClo Expanded)

## Overview | Parichay

Aaj infra ko **manage karna** seekhoge — state files ke saath khelna (`import`, `state list/show/rm/mv`), **drift** detect karna (kisne portal me change kiya?), **DR/backup** concept, aur last me asli scaling: **HPA (metrics), KEDA (event-driven)**, Cluster Autoscaler aur NAP/Karpenter. Kal ka plan-padho mindset + aaj ka drift-kill mindset = senior infra engineer.

---

## What You'll Learn | Aaj Ki Seekh

- [ ] State sub-commands: `list`, `show`, `rm`, `mv` — kab aur kaise
- [ ] `terraform import` — existing resources ko Terraform me adopt karna
- [ ] Drift: kya hai, plan kaise expose karta hai, `refresh` vs plan
- [ ] Drift prevention: pipeline policy, no-manual-changes rule, `prevent_destroy`
- [ ] DR/backup: state backup (redundancy, version), restore drill, multi-region patterns
- [ ] HPA: metrics-server, CPU/memory target, `kubectl get hpa`, behavior
- [ ] KEDA: event-driven scalers (queue, HTTP — scale to zero)
- [ ] Cluster Autoscaler + NAP/Karpenter: node-level scaling

---

## Full Topic (LEARN) | Puri Detail

### 1. State Deep Dive | Terraform Ki Memory

```bash
terraform state list                              # resources viewed
terraform state show azurerm_kubernetes_cluster.aks
terraform state rm azurerm_virtual_network.main   # remove from state (cloud untouched!)
terraform state mv azurerm_resource_group.main azurerm_resource_group.backup
terraform state pull > backup.tfstate             # manual backup copy
terraform state push backup.tfstate               # restore (danger, rarely)
```

`state rm` ≠ destroy. `rm` sirf Terraform ka track hata deta hai — resource cloud me **reh jata hai**. Use: jab resource ab managed nahi chahiye (keep infra). Kabhi bhi state direct **edit** mat karo (yaml/json corrupt risk) — safer through `rm/mv/import`.

`import` = adopt existing (manual/legacy) resource into state + config:

```bash
terraform import azurerm_resource_group.main /subscriptions/<sub>/resourceGroups/rg-devops
# then write matching resource block in .tf, then: terraform plan to confirm
```

Import ke baad config likho aur plan verify karo (mismatch = drift). This is how you reclaim "someone built it in portal" resources.

### 2. Drift | Reality Vs Config

**Drift** = cloud me resource ka actual state ≠ `main.tf` me desired state. Causes: manual portal edit, temp fix, deleted resource, another pipeline, cloud automation (e.g., VM auto-shrink bot). Effects: `terraform plan` shows unexpected changes.

Demo — thrift manual change:
```bash
az vm stop -g rg-dev -n vm-dev       # manual (portal) change
terraform plan                        # shows: -/+ destroy then create (VM stopped != running)
# or
az storage account update --name sa --allow-blob-public-access true  # manual
terraform plan                        # ~ update in-place (drift back)
```

**Refresh vs plan:**
- `terraform plan` = refresh + diff (refresh-low weight unless `-refresh-only`).
- `terraform plan -refresh-only` = sirf state update karo (align state to cloud) bina changes apply — use when they cloud moved and you want state honest.

### 3. Drift Management | Handle Ki Janet

1. **Detect:** periodic `terraform plan -detailed-exitcode` in CI — exit 0 (clean), 2 (drift). Nightly pilot.
2. **Triage:** is change desired? Auto-reconcile (app source) vs investigate first.
3. **Import** if legitimate (someone built it properly — adopt config) or **revert** by updating config so plan no diff.
4. **Prevent (the senior move):** 
   - Rule: no manual portal changes (documented runbook).
   - Pipeline gates: plan-stage artifact + approval.
   - Policy: `prevent_destroy` on critical, `moved` block instead of rm, modules.
   - Azure Policy: deny manual deletion/misconfig (e.g., require tags).

### 4. DR / Business Continuity | Bada Sochna

- **State DR:** backend blob redundant (RA-GRS), you hold `terraform state pull` backups in protected storage. Restore drill: restore blob/version → `terraform state push` → `terraform plan` → apply.
- **Infra DR patterns:** single-RG single-region (dev) vs multi-region redundancy:
  - **active-passive** (regions copy, promote on failover) — data geo-replicated.
  - **active-active** (both serve) — k8s multi-cluster, DNS/global LB.
- **Restore drill (test it!):** quarterly simulate region down → failover, RTO/RPO documented.
- For AKS: backup etcd + resources (Azure Backup dedicated; `kubectl` + Velero style), node pool strategy.

### 5. HPA (Horizontal Pod Autoscaler) | Pods Scale-out/In

Metrics-server provides current pod/node metrics (`kubectl top`). HPA controller scales replicas to meet target.

```bash
kubectl autoscale deployment web --cpu-percent=60 --min=2 --max=10
kubectl get hpa -w
```

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 60
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0
    scaleDown:
      stabilizationWindowSeconds: 300
```

**Critical requirement:** pods me **requests.cpu** must be set — HPA utilization = current usage / requests. No requests → no computation → HPA "unknown" (INC-704).

### 6. KEDA | Event-Driven Autoscaling

KEDA is external metering + HPA scaling logic — scale by events (HTTP per-request, Kafka queue depth, Azure Service Bus/Queue storage, etc.) even **scale to zero** (no queue = no pods). Custom resource `ScaledObject`.

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: worker-scaledobject
spec:
  scaleTargetRef:
    name: worker
  minReplicaCount: 0            # scale to zero!
  maxReplicaCount: 30
  cooldownPeriod: 60
  triggers:
  - type: azure-queue
    metadata:
      queueName: jobs
      queueLength: "20"
      connectionFromEnv: QUEUE_CONN_STRING
---
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: api-http
spec:
  scaleTargetRef: { name: api }
  minReplicaCount: 1
  maxReplicaCount: 50
  triggers:
  - type: http
    metadata:
      hosts: ["api.example.com"]  # HTTP add-on: per-host request rate
      scalingMetric: "rps"
      targetValue: "50"
```

KEDA workflows: message queue, HTTP, cron, Kinesis, RabbitMQ etc. Ideal for batch/worker (scale to zero = cost save) + HTTP autoscaling (RPS target).

### 7. Cluster Autoscaler, NAP, Karpenter | Node-Level Comedy

HPA scales pods; but if nodes can't fit pods (Pending), you need **node scaling**:

- **Cluster Autoscaler (AKS)** — node pools scale on pending pods (based on requested resources being evictable/unschedulable). Cloud integration (VMSS).
- **Node Autoprovisioning (NAP)** / **Karpenter** — 2026-gen: scheduling-aware node provisioning (kubernetes the native resource; nodes AJA per workload characteristics — spot usage, burstable, taints). Also **Karpenter** original from AWS; now AKS NAP = AKS job. Benefits: tighter bin-packing, faster node add, faster scale-in.

Both coexist: HPA (pod level) + CA/NAP (node level) = resilient autoscaling chain.

### 8. 2026 Notes | Latest Kya Hai

- **KEDA v2.15+ added** — HTTP add-on GA, queue-based base, permission: `keda-operator` on AKS namespaces.
- **HPA v2 stable** — multiple metrics + behavior windows (stabilization — scale-down noise).
- **NAP (Node Autoprovisioning) in AKS** preview/GA advancing; integrates with Unplanned/planned node pool.
- **`terraform plan -refresh-only`** + drift detection CI (Nightly Plan) becomes standard platform practice.
- **OpenTofu** also works for all this; `tofu` import/plan same.
- **Kubernetes 1.31+** — HPA `memoryUtilization` + `custom` fine; metrics-server removed from core (deploy separate).
- **State encryption (client-side)** on azurerm backend evolving; always backup.

---

## Cheat-Sheet | Yaad Rakhna Commands

| Command | Kaam |
|---------|------|
| `terraform state list/show/rm/mv` | Inspect + edit state mapping |
| `terraform import <address> <id>` | Adopt cloud resource into state |
| `terraform plan -detailed-exitcode` | CI: 0=clean, 2=drift detected |
| `terraform plan -refresh-only` | Sync state with reality, no changes |
| `terraform state pull / push` | Backup/restore state file |
| `kubectl get hpa` / `autoscale` | Pod scaling status/targets |
| `kubectl top pods` | Current usage (HPA knows requests) |
| `kubectl get scalers` (with KEDA) | ScaledObjects list |
| `kubectl describe keda` / scaledobject | Scaling events/condition |

---

## Practice Lab | Abhi Karein

1. Cluster ready (kind/AKS). Deployment `web` (nginx) apply with:`resources.requests.cpu: 200m`, replicas 1.
2. **HPA create:** `kubectl autoscale deployment web --cpu-percent=50 --min=1 --max=6`
3. **Load generate:** busybox loop with CPU (`curl` in loop) / use `hey` tool with many requests. `kubectl get hpa -w` → target % rises, pod count increases 3-6.
4. `kubectl top pods` → usage ~ target. Scale-down after stopping load (`stabilizationWindowSeconds`).
5. **KEDA install:** `helm repo add kedacore https://kedacore.github.io/charts; helm install keda kedacore/keda` — verify pods.
6. **ScaledObject (mock queue):** use `cron` trigger instead of real queue if no queue service — apply worker-scaledobject, observe 0 replicas → fires on schedule (scale-out), cooldown → 0 (scale-in).
7. **Terraform drift** — Terraform managed RG `rg-drift-test` (block in main.tf) apply.
8. **Break it:** portal/CLI se RG `tags` change karo, storage account tier change karo (manual).
9. `terraform plan -detailed-exitcode` → exit code 2 (drift). Show diff — tags mismatch.
10. **Reconcile:** correct tag in config → plan applies → clean. Ab `terraform import` demos lagao (free tier resources).
11. `terraform state list/show` me dekhna + `state rm` demo (careful: resource cloud me reh jata hai).
12. Notes + cleanup (destroy cost).

---

## Incidents / Tickets | Real Practice

### INC-703 · State Drift

- **Situation:** Nightly drift plan flags changes: production `azurerm_storage_account.data` shows `~` update (account_replication_type LRS→GRS) and an AKS node pool showing unexpected — someone manually edited Azure.
- **Investigate:** 1) `terraform plan -detailed-exitcode` → exit 2, resource listed. 2) Check Azure change history / portal activity log (`az monitor activity-log list` for the storage) → found a support engineer changed replication for "faster DR" 2 weeks back. 3) `terraform show` state vs cloud (`az storage account show`) — confirmed mismatch.
- **Root cause:** Manual change outside IaC (portal) — "urgent fix" jisme engineer ne config update ka route nahi follow kiya. Next `apply` would overwrite manual change.
- **Fix:** Legit change? → Update config to GRS (declare it): edit main.tf + `terraform plan` + apply. If accidental → revert cloud to state (no config change): 
```bash
terraform apply -refresh-only   # state sync
terraform plan                   # confirm clean
```
Commit message documents decision ("GRS intentional, reflected in IaC").
- **Verify:** `terraform plan -detailed-exitcode` → exit 0 repeatedly (no drift). Pipeline gate green.
- **Blast radius | Prevent:** Silent drift creates surprise changes on next deploy. Detect faster: nightly drift plan job (alerts on exit 2). Prevent: manual-change prohibition runbook, policy (deny storage replication manual toggle via Azure Policy), CI apply-after-plan guarantee.

### INC-704 · HPA Not Scaling

- **Situation:** High traffic on `orders-api`, but `kubectl get hpa` targets "unknown" / 0 replicas change; pods stress. Users slow.
- **Investigate:** 1) `kubectl get hpa orders-api -o yaml` → status.conditions: `ScalingActive: False`, reason `FailedGetResourceMetric`. 2) `kubectl describe hpa orders-api` → "unable to compute cpu metric: failed to get cpu metric: resource cpu not defined on containers" 3) `kubectl get pods <pod> -o yaml | grep -A5 resources` → **no resources.requests** block (only limits). 4) `kubectl top pods` → shows values though.
- **Root cause:** HPA CPU utilization formula = currentUsage / **requests.cpu**. Pods me requests.cpu missing → ratio undefined → HPA can't scale. Limits alone nahi chalti — requests zaroori.
- **Fix:** Add requests in deployment:
```yaml
resources:
  requests: { cpu: 200m, memory: 256Mi }
  limits: { cpu: 500m, memory: 512Mi }
```
`kubectl apply -f` → rolling update → `kubectl get hpa` → target shows real %.
- **Verify:** Load generate → `kubectl get hpa -w` → CPU% rises, replicas max ke toward scale. Resource utilization alerts settle.
- **Blast radius | Prevent:** Full service saturated → latency/capacity for all orders. Detect faster: HPA scaling-active alert (HPA not scaling = red flag), latency SLO alert. Prevent: standard scaffolding sets requests+limits (limitrange/default), pipeline validates surfaces `requests` presence, load-test baseline data for targets.

---

## Interview Corner | Sawal-Jawab

**Q1: HPA kaise kaam karta hai?**
Metrics-server (from kubelet stats) exposes cpu/mem per pod; HPA controller polls, computes avg utilization (usage/requests), scales deployment replicas toward target, respecting min/max + behavior windows (stabilization). Multiple metrics support; reports via `kubectl get hpa` conditions.

**Q2: Troubleshoot "HPA not scaling" ka process?**
1) `kubectl get hpa` + `-o yaml` → conditions (ScalingActive false reason). 2) `kubectl describe hpa` shows error messages. 3) Check pod resources.requests (missing = "cpu metric not defined"). 4) metrics-server healthy? `kubectl top` — if no data, metrics-server addon down. 5) target based on app baseline.

**Q3: Drift kya hai aur kaise manage karte ho?**
Drift = cloud actual ≠ config declared. Detect: `terraform plan -detailed-exitcode` nightly, exit 2. Respond: investigate (activity log), adopt-if-legit (config update) vs revert-if-accident (`apply -refresh-only`, or plan+apply), then prevent (no manual changes, policy deny, preview pipeline).

**Q4: `terraform import` vs `state rm`?**
Import = bring unmanaged resource under Terraform (state + config). rm = remove from state while cloud keeps it (Terraform won't touch it). Both need config alignment; import followed by plan avoids surprise.

**Q5: HPA vs KEDA vs Cluster Autoscaler — kaun kya karta hai?**
HPA: pod count by predefined resource metrics (CPU/memory). KEDA: pod scaling by external event signals (queue depth, HTTP RPS — scale-to-zero). Cluster Autoscaler/NAP/Karpenter: node count when pods can't fit (Pending solvers). Full chain: KEDA/HPA (pods) + CA/NAP (nodes) = cost + resilience.

---

## Quick Notes | Yaad Rakhna

- State sub-commands: `list`, `show`, `rm`, `mv`, `import` — state ka full control system indesh/first-class.
- Drift = plan shows changes you didn't intend — nightly CI job, exit code 2 = alert.
- `-refresh-only` aligns state to real infra (no apply) — safe form of sync.
- HPA ka secret: **requests.cpu** zaroori hai, warna target "unknown" — no requests, no scaling.
- KEDA scale-to-zero = worker cost game-changer; triggers event-based.
- Cluster Autoscaler + NAP/Karpenter handle node level (Pending) — pod + node scaling combine.
- Azure Policy + pipeline gates = drift prevention at platform level.

---

**Kal:** Poora AKS troubleshooting day — nodes, ConfigMap staleness, rollout stuck, 5-issue challenge.