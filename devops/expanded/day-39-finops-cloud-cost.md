# Day 39 — FinOps & Platform Cost (DevClo Expanded — Platform Engineering)

## Overview | Parichay
Platform Engineer ki ek team ka bill manager bhi hota hai — "apps kitne ka chal rahe hain" iska bil dena tumhara hi kaam hai. FinOps = cloud cost ko finance-meeting-art me manage karna: **Learn (Inform) → Optimize → Operate**, cost ko visibility (tags/budgets, unit economics) aur action (right-size, reservations, spot, idle cleanup) se drive karna. Showback/chargeback se tum developer ke cost-habits banaoge. Ye day interview me "maine AWS/Azure cost 40% cut kiya" jaise proof deta hai.

## What You'll Learn | Aaj Ki Seekh
- [ ] FinOps lifecycle: Learn (Inform) → Optimize → Operate (FINOS/CNCF)
- [ ] Cost observability: resource tags/labels, per team/app/env mapping
- [ ] Budgets + alerts: `az cost` budgets, threshold rules, anomaly alerts
- [ ] Unit economics: cost per deploy, per user, per request/tenant
- [ ] Right-sizing: from `kubectl top`/ARM recommendation to actual resize
- [ ] Reservations / Savings Plans + spot instances + autoscale patterns
- [ ] Idle cleanup: orphaned resources, unused disks, deallocated VMs
- [ ] Showback vs chargeback: reporting mechanics + incentive design
- [ ] Tooling: Kubecost + Azure Cost Management (export, queries, API)
- [ ] Cost-derived SLO/dashboards — FinOps COST dashboards as code

## Full Topic (LEARN) | Puri Detail

### 1. FinOps Lifecycle — The Framework
(finops.org / Linux Foundation CNCF)
1. **Learn/Inform**: visibility first — what exists, who owns it, what costs.
2. **Optimize**: right-size, reserved, remove waste.
3. **Operate**: what you do continuously + policy-based rates (FOCUS standard).

Key FinOps principles (senior talking points):
- Teams need to make **cost-based decisions** (they have data, they own cost).
- **Centralized team owns rate/commitments**; decentralized teams own usage.
- **Anomaly detection** + budgets required.
- **FOCUS** (FinOps CMaaS, Cloud Utilization & Controlling Cost) — vendor-neutral cost format (since 2023-24 standard — 1.0/Azure/GCP/AWS adopters). If backend supports FOCUS, use it — portable, queryable.
- FOCUS example line: `BilledCost, ChargeCategory, ResourceId, ResourceType, Region, Provider, ServiceName, SkuPriceId` — ek normalized CSV/SQL file, multi-cloud common analysis enabled.

### 2. Cost Tagging — The Root of Everything
No tags = no cost analytics. Tag discipline:
- **Tagging policy** (mandatory): `team`, `app`, `env` (dev/qa/prod), `owner`, `costcenter`.
- Azure tags: `az tag create --resource-id <rid> --tags team=payments env=prod`.
- Enforcement: Azure Policy **"requires tag"** + **tag with default value** — auto-default on resources missing.
- Kubernetes: label sync → Azure Monitor cost (Containers insights) mapping pod labels → cost per app. Kubecost pods→app mapping by labels.
- **Ownership rule:** har resource ka owner single-team ho. Monthly report `tag.team` unowned/untagged lines → showback me "ORPHAN/UNOWNED" line item — dev teams cost-habit yahi se strengthen hota hai.

**Cost query example:**
```bash
az cost-management query --type ActualCost --timeframe MonthToDate \
  --scope /subscriptions/$SUB \
  --dataset-grouping name=Service
```
Tag filters:
```python
az cost-management query --type ForecastCost --timeframe MonthToDate --scope $SUB \
  --dataset-filter '{"and":[{"dimensions":{"name":"Tag","operator":"Contains","values":["team:idp"]}}]}'
```

### 3. Budgets + Alerts
Create budget per team/app/env:
```bash
az consumption budget create --resource-group rg --budget-name prod-budget \
  --amount 5000 --time-grain Monthly \
  --category Cost --start-date 2026-01-01 \
  --threshold 80 100 --notification-operator GreaterThan \
  --notification-contact-emails platform-cost@example.com
```
- Thresholds: 50% / 80% / 100% (+ action group webhook).
- **Budget = spending commitment** — review monthly, adjust amount on business change, not on anxiety.
- **Forecasted budget alerts** (spend trajectory over threshold) — catch creeping spend before real breach.
- **Anomaly alerts** (Cost Management → Anomaly): machine learning detects unexpected Daily spend spike.
- Budget type granularity: per team/app/env; daily burn vs monthly cap — check both.

### 4. Unit Economics (the platform metric)
Absolute $ is noise; **unit cost** answers "is it worth it?":
- **Cost per deploy**: (cluster + CI cost)/deploy-count — ab push-to-prod cheap.
- **Cost per user / per tenant**: tag workloads, divide billed cost by active tenants.
- **Cost per request** (practical): total app stack cost / total requests (from telemetry counts).
- **Who benefits**: aligns dev team decisions with business value; e.g., "API v2 uses half per user budget — rollout justifies".

### 5. Optimization Playbook
**Right-sizing** (biggest quick win):
- Data: `kubectl top pods` (CPU/mem), ARM usage insights, Azure Advisor recommendations.
- Convert request/limits to reality from 7d median vs peak — resize via Terraform.
- Context: **requests vs limits** — platform can see both; over-requesting ≠ over-using, limits control capacity, over-provisioning → idle cpu billed.
- Automation: **KEDA/HPA + cluster autoscaler** — autoscale keeps utilization 40-70%; node pools per workload class (general/burst).

**Reservations / Savings Plans:**
- **Azure Savings Plan (for Compute)** — 1y/3y commit, flexible across VM families/regions; starts where RIs don't cover. Similar to AWS Savings Plan.
- Reserved VM instances (1y/3y): commit VM exact family/region.
- Rule: buy only for **stable base load**, never chasing peaks; utilization ≥80%; leftover = spot/RI hybrid.
- Coverage metrics: RI+SP coverage % → cloud cost → report.

**Spot instances** (preemptible):
- Best: stateless batch/CI, HPA-friendly workloads, Kafka/Spark.
- Azure Spot VMs: eviction risk → design with graceful shutdown, not for stateful.

**Idle cleanup:**
- Unused VM (stopped/deallocated — still billed for disk!), orphaned disks, unattached public IPs, empty ACR repos, old container images.
- Azure: `az vm deallocate` stops billing for VM compute (disk/data persists); `az network public-ip list --query empty`.
- Run **monthly idle report** script → tag-owner → asks "tumhara hai?"
- Kubernetes idle: `kubectl top nodes` vs allocatable, Kubecost "idle node $"; scale node pools down on low utilization windows.
- Image hygiene: ACR retention policy (delete untagged > N days), `az acr repository show-tags --orderby time_desc` review.

### 6. Showback vs Chargeback
- **Showback**: report cost per team (no money moved) — transparency first, least friction; team sees own spend vs budget.
- **Chargeback**: actual internal ledger $ per team — stronger signal, needs finance opt-in; internal GL entries required.
- Incentive design: **don't punish first month**, start showback → recommendations → team-owned budgets → chargeback later. Centralized team holds commitments (RI/SP) centrally, distributes usage charge.
- **Kubecost**: namespace/app/team split view, node attribution to namespaces, idle node cost report, right-sizing recommendations, savings summaries — plus Azure Cost integration.
- Dashboard to build: `spend by team (tag.team)` stacked + `budget %` + `unit cost trend` + `idle $` — one "Cost Command Center" panel, PR-reviewed as code (Day 38 link).

### 7. Azure Kubernetes Cost (AKS + Kubecost)
- **Azure Cost Management page for AKS**: `az aks show` → blade "Cost Management" → cost per namespace, node pool aggregated — from Labels.
- Kubecost enterprise features: allocation to pod/namespace/deploy, cluster idle analysis, cluster and node metrics, "savings" page (spot suggestions).
- **Setup kubecost** quick: helm `kubecost` chart, expose service, Grafana-connected.
- KQL-accessible cost in Log Analytics is a nice bonus via Container Insights.
- **Export for long-term:** `az cost-management export create` (daily/monthly CSV to storage) → ingest into BI (PowerBI/Focus pipeline) — monthly report automation.

### 2026 Notes
**FOCUS 1.0** is now the standard normalized cost format (Azure/GCP/AWS revealed `focus` dataset), main FinOps lifecycle. **Kubecost 2.x** mature with Azure integration; **Azure Cost Management** improvements around anomaly + workloads. CI **cost-gating** nascent: cost per diff/PR testing tools, but enterprise rarely arm. Kyverno-team tags enforced gateways mature. Focus usage: **cost-per-unit dashboards** now common ask of platform.
- Platform teams often add a weekly "cost retro" meeting: budget vs actual, what helped, what regressed.
- Azure Advisor "cost recommendations" gives right-size + unused-resource suggestions — schedule review.
- Unit economics benchmark: industry average cloud spend per active user is $5-30/month (depends on SaaS nature); your number is the baseline, not the goal.

## Cheat-Sheet | Yaad Rakhna Commands

| Command | Kaam |
|---------|------|
| `az cost-management query --type ActualCost --timeframe MonthToDate --scope $SCOPE` | actual spend |
| `az cost-management query --type ForecastCost ...` | forecast |
| `az consumption budget create --amount 5000 --threshold 80 100 --notification-contact-emails ...` | budget zone |
| `az tag create --resource-id $RID --tags team=idp env=prod` | tag resource |
| `az vm list --query "[?tags.env=='dev']"` | find tagged dev VMs |
| `az vm deallocate -g rg -n myvm` | stop VM compute billing |
| `kubectl top nodes` / `kubectl top pods -A` | usage right-size base |
| `az network public-ip list --query "[?ipConfiguration==null].name"` | orphan IPs |
| `kubectl get ns --show-labels` | label-based cost split |
| `helm install kubecost kubecost/kubecost -n kubecost` | kubecost deploy |
| `az cost-management export create --type ActualCost --storage-account ...` | export to storage |
| `az advisor recommendation list --category Cost -o table` | right-size recommendations |
| `az consumption budget list --output table` | budget status |

## Practice Lab | Abhi Karein
10-12 steps (budget subscription access chahiye; local kubecost with kind/aks too).
1. `az cost-management query --type ActualCost --timeframe MonthToDate --scope $SUB -o table` → current spend line.
2. Add mandatory tags: `az tag create --resource-id <rg-id> --tags team=idp env=dev` + verify `az resource show ... --query tags`.
3. Per-service breakdown: query grouped `--dataset-grouping name=Service` → top 3.
4. Create budget: 80% + 100% thresholds; `az consumption budget list` → verify.
5. Simulate spend/absent data — check forecast query output.
6. `kubectl top nodes; kubectl top pods -A` — capture 7d sampler (two or More snapshots).
7. Install Kubecost (`helm repo add kubecost`, `helm install`), wait pods.
8. Open Kubecost dashboard (`kubectl port-forward svc/kubecost-cost-analyzer 9090:9090`): annotate namespace cost / idle spend.
9. Right-size recommendation populates; note a candidate (e.g., "reduce request cpu 1→0.5").
10. Idle report: run small script (`az vm list ... --query '[?tags.env==dev && powerState!=Running]'`) — find parked dev VMs, `az vm deallocate`.
11. Unit economics: pick app → compute app's full stack $/month (from query), divide by requests/month (metrics) → $"per 1k requests".
12. Write 1-page FinOps summary (spend, top services, recommendations, savings estimate).
13. **Line-item sanity:** `az cost-management query ... per Resource` — explain why highest resource listed is highest.
14. Record demo: budget alert blast → teammate emergency respond → unit-cost story (45 seconds max).
Expected outputs: budget + tags proof, unit-cost number ~$X/1k-requests, 2-3 concrete optimization actions with $$ savings.

## Real Incidents | Ek "Platform" Problem

### PLAT-039 · $12k Bill Spike on Dev Cluster
- **Situation:** Monthly forecast alert fires: dev AKS cluster cost jumped 4x in 3 days — `$1,200 → $4,800` current. Kubecost budget (dev team) crossing 80% threshold, forecast 130%. Developers surprised.
- **Investigate:**
  ```bash
  az cost-management query --type ActualCost --timeframe Last3Days --dataset-grouping name=Resource -o table
  az cost-management query --type ActualCost --timeframe Last3Days --dataset-grouping name=Service --dataset-filter '{tag team: dev}'
  kubectl top nodes --context dev; kubectl top pods -A -n dev 2>/dev/null | sort -nk2 | tail
  # kubernetes cost attribution:
  kubectl exec -n kubecost deploy/kubecost-cost-analyzer -- /var/lib/kubecost/kubectl ... # or dashboard
  ```
- **Root cause:** A dev accidentally ran `kubectl scale deployment api --replicas=80 -n qa-shared` (from a stress-test script, meant `qa` namespace, they typo'd) on **dev cluster**; also HPA had no `maxReplicas` cap → node pool auto-scaled 3 → 15 large-node VMs. Billing attribution KV: no `team=qa` tag (mock script used `env=dev` generic).
- **Fix:** (1) Scale back: `kubectl scale deployment api --replicas=3 -n qa-shared`; (2) Add HPA `maxReplicas: 10`, `minReplicas: 1` + resource requests set; (3) Terraform: node pool autoscale 15→5; (4) Node pool delete extra nodes (`kubectl drain` + `az aks nodepool scale`).
- **Verify:** `kubectl get nodes` count 5; Kubecost "clusters idle & right-size" caches down, next-day spend normal (< $60/day); budget % back under threshold; `az cost-management` next-day reflects decrease; `az advisor recommendation list --category Cost` — stale/unscaled recommendations closed.
- **Root-cause math:** 15 × large VM × 3 days = ~$3,600 wasted (compute only); Kubernetes node-pool sizing "cluster autoscaler max" caps now prevent future same-blast.
- **Prevent:** **Quota/limit** enforcement (ResourceQuota in namespaces), **HPA defaults** (max cap in team templates), **cluster autoscaler** size limits, **tag enforcement policy** so every resource is owned; **anomaly alert** on dev cost + `kubectl get pods -A | count` alert > 200.

## Interview Corner | Sawal-Jawab (Senior Level)

**Q: Right-sizing vs reserved vs spot — order of action?**
A: Fix allocation (tags) → chargeback in "Inform". Right-size the waste (biggest percentage) → then reservations/savings plans for the **stable base** (never buy for spikes) → spot only for stateless/batch. Idle cleanup ongoing (least effort, steady drip). Order: tags → right-size → commit → spot → cleanup.

**Q: Cost per deploy / per user — how to compute?**
A: (Per deploy) total CI + env bill ÷ deploys in month (deploy count from CI API). (Per user/tenant) tagged stack cost ÷ active tenant count; make from telemetry request count. It's a **business-aligned number** — shows Ops cost per business unit.

**Q: Showback vs chargeback?**
A: Showback = report only (teams know own cost, incent sense), low friction. Chargeback = internal bill, finance involvement, real $ transfer. Start showback, optional chargeback when incentives need teeth. Centralized **commitment ownership** (RIs/SP) then allocation.

**Q: Kubecost worth it — what does it actually give?**
A: Namespace/pod/team cost split (node attribution), **idle node cost** (biggest hidden savings), right-size recommendations, budget when integrated. But cost = tags/labels — log attribution accuracy depends on label hygiene; you need policy-gate labels too.

**Q: Anomaly to find cheap cloud cost spikes?**
A: Resource-based (unexpected new resources or scale out), usage-based (network/CPU spikes) → Cost anomalies (Azure anomaly detection / Kubecost spike detection). Action: attribute by tag/namespace → owner → right-size or revert, capped by **cluster autoscaler + quota** first-layer prevention.

## Quick Notes | Yaad Rakhna
- FinOps = lifecycle: **Inform → Optimize → Operate**, not a tool
- Tags/labels = cost attribution foundation; enforce via policy (Azure Policy/kyverno)
- Budgets + forecast + anomaly alert = the "engine"
- Unit economics (per deploy/user/request) > absolute spend
- Optimization order: tags → right-size → reservations/SP → spot → idle cleanup
- Showback first, chargeback later; central commitments, usage decentralized
- FOCUS normalized cost standard (portable queries across clouds)

## Next | Aage Bolte Jaana
Day 40 — sab kuch lock karna: **security + supply chain + policy + compliance + GRAND CAPSTONE** — poori platform ki story:
→ `day-40-platform-security-capstone.md`