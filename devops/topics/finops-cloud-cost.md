# Deep Dive: FinOps & Cloud Cost Optimization — Visibility, Rightsizing, Budgets

> **Standalone deep dive:** Cloud spend is governance-able: Inform → Optimize → Operate. Whoever creates resources owns their cost (showback/chargeback). From $0 → $1M apps, discipline scales.

---

## 1. The FinOps Operating Model

```
INFORM            OPTIMIZE            OPERATE
 │                   │                   │
 └─ Report/dashboards └─ Right-size       └─ Budgets & alerts
    Unit economics     └─ Right-scale        └─ Showback/chargeback
    Tagging           └─ Spot/savings        └─ Anomaly detection
    Anomaly           └─ Serverless/low      └─ Forecasting
                       └─ storage tiering     └─ FinOps review cadence
```
**Key norms:** shared accountability (engineers on RIG), decision-visible... "everyone can see cost", "team owns its cost", "demand & supply optimize together".

---

## 2. Visibility First — Or You Can't Save

**Tools**
- Azure Cost Management + Billing (native: cost analysis, budgets, anomaly)
- Kubecost / OpenCost (k8s pod-level; OpenCost = CNCF standard, free)
- CloudHealth/Polaris (enterprise multi-cloud)
- FinOps Hub in Azure (exports to ADL → dashboards)

**Unit economics** > total bill:
```
total cost/month grew $50k → is that bad?
cost per order stayed $0.00042 → GOOD → growth=scale, not waste
```
Track: `$/deploy`, `$/tenant`, `$/request`, `$/user` — the growth-truth metric.

---

## 3. Tagging = Allocation

```bash
az resource tag -g rg --tags env=prod team=platform owner=deploytrack
az resource tag -g rg --tags env=dev team=ml costcenter=ml-dev

az costmanagement query --type ActualCost --scope /subscriptions/x \
  --timeframe MonthToDate --group-by dimension tags --dataset ...
# group my tag → cost by env/team/owner
```
**Tag discipline:** applied at **IaC template level** (Terraform `tags` block on every resource), enforced by Azure Policy (deny untagged); `labels` on pod namespaces for k8s.

---

## 4. Rightsizing & Rightscaling (Biggest wins)

**Rightsizing (match capacity to demand):**
| Signal (Kubecost/CloudRight) | Action |
|------------------------------|--------|
| avg cpu < 20% for 30d | downgrade size / reduce replicas |
| avg cpu > 80% | upgrade / autoscale more |
| memory idle but reserved huge | reduce requests so VPA/autoscaler can pack |
| pod idle overnight | scale-to-zero (KEDA) / HPA 1 replicaI at night |

**Rightscaling (horizontal):**
- VMSS autoscale CPU %; AKS cluster-autoscaler (node pool by pod demand); **bin-packing** benefits from smaller instances
- HPA/KEDA per workload (Day 19, 36, 43)
**Spot/priority:** Azure Spot VMs / Spot node pools — up to ~90% cheaper, evictable → perfect for batch, CI runners, stateless web, ML preemption-ok
**Reserved/Savings Plans:** commit 1-3yr steady-state at ~20-60% discount; reserve the *stable* slice; mix spot+reserved+on-demand for spikes

---

## 5. "Engineering for cost" — habits (not just tools)

```
- Autoscale EVERYTHING (CPU/queue) — pay for demand not for "max
- Limits set → no runaway pods (HPA needs real requests)
- Serverless/Functions for sporadic loads (Day 43: scale-to-zero)
- Storage tiering: hot/cool/cold + lifecycle policies (blobs 90d→cool 365d→cold/delete)
- Data transfer: keep compute+data same region; ingress/egress free vs paid — engineer to avoid egress
- Delete orphans: VMs/NSGs/disks/IPs off day-after; shared dev clusters instead of per-dev
- Dev/test: smaller SKUs, single region, shutdown policy (M-F night down)
- Env scaling in GitOps: nonprod replicas 1 w/ hpa off — a "env profile" per overlay
```

---

## 6. Budgets & Anomalies — Actually Enforce

```bash
az costmanagement budget create -g rg --name azure-budget-devops \
  --amount 200 --time-grain Monthly \
  --contact-emails devops@example.com \
  --category Cost
# thresholds: 50/80/90/100% → actions (auto-shutdown workload, freeze deploys in gitops)
```
- K8s: **Kubecost namespace-alerts** (budget per ns); **quota** (limits) as hard guardrail
- Azure Policy: enforce tagging + deny expensive SKUs in nonprod (`Azure VM SKU allowlist`)
- Anomaly: MDC/Cost anomaly daily — unexpected 30%+ spike → ticket

---

## 7. Showback / Chargeback Pattern

```
finance → FinOps hub (exports to warehouse) → Power BI showback dashboard
per team/env budget; chargeback on paper; deviation → conversation (not surprise)
The message: "your tag is your bill" — engineers become cost-owners
```

---

## 8. Interview Questions — FinOps

| Question | Strong answer |
|----------|---------------|
| "FinOps kya?" | Operating model: Inform (visibility), Optimize (right-size/scale), Operate (budgets, showback) — shared cloud-cost accountability. |
| "Rightsizing signal?" | Kubecost CPU/usage vs requests; actions: downgrade or HPA; idle→scale-to-zero. |
| "Spot kya & kab?" | Evictable compute ~90% off; use for batch/stateless/CI; not for stateful critical. |
| "Reserved vs spot?" | RIs/savings plans: commit steady-state (discount, deterministic); spot: interruptible spikes. |
| "Tagging kaun/kaise?" | IaC default tags + Azure Policy enforce; group by env/team/owner/costcenter. |
| "Budget enforce kaise?" | Budget + threshold alerts → automation (shutdown/deploy-freeze); policy blocks expensive SKUs. |
| "Unit economics kahan apply?" | cost/order, cost/deploy vs total bill — growth-proof metric. |
| "Kubecost data?" | requests vs usage per pod/ns; savings insights (rightsizing/spot) proposals. |

**Related:** [Day 39](../day-39-finops-cloud-cost.md) · [Serverless](../topics/serverless-event-driven.md) · [Performance](../topics/performance-engineering.md) · [Platform Eng](../topics/platform-engineering-idp.md)