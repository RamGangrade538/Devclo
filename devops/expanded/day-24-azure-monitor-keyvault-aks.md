# Day 24 — Azure Monitor + Key Vault on AKS (DevClo Expanded)

## Overview | Parichay

Aaj tumhare AKS cluster ko **dekhna aur surakshit karna** seekhoge: **Azure Monitor** (metrics, Log Analytics/KQL, alerts, Container Insights), **Managed Prometheus/Grafana** (Azure native, 2026 default) aur **Key Vault trick** — CSI Secrets Store driver + workload identity se bina hardcoded secret ke. Ye wahi cheez hai jo production me senior engineers daily use karte hain.

---

## What You'll Learn | Aaj Ki Seekh

- [ ] Azure Monitor architecture — Metrics vs Logs vs Alerts, Data Collection Rule
- [ ] Container Insights — cluster inventory, live telemetry, workload monitoring
- [ ] Managed Prometheus + Grafana (Azure Monitor addon) vs self-managed
- [ ] KQL basics: `where`, `timespan`, `take`, `summarize`, `project`, table explore
- [ ] Actionable alert rule design — severity, frequency, suppression, signal type
- [ ] Key Vault + AKS integration: CSI Secrets Store driver (mount secrets as volume)
- [ ] Workload identity (MSI per workload) — code/secret ke bina Azure resources access
- [ ] Alert → investigate → root-cause chain (`kubectl`, logs, telemetry combine)

---

## Full Topic (LEARN) | Puri Detail

### 1. Azure Monitor | Do Logins, Do Dashboards

Azure Monitor core ke parts:

| Component | Matlab |
|-----------|--------|
| **Metrics** | Numeric time-series (CPU, memory, requests) — low-latency, dashboard |
| **Logs (Log Analytics)** | Text logs + structured events → KQL se query |
| **Workbooks** | Interactive dashboards (metrics + logs ek jagah) |
| **Alerts** | Condition match → action (email, webhook, ITSM, autoscale) |
| **Action Groups** | Sab notofication/google endpoints (email, SMS, ITSM, webhook) |

AKS me agent **Container Insights** install hota hai (amaaks addon) — har node pe agent pods chalte hain → stdout logs + kubelet/cgroup metrics → Log Analytics workspace me. Data Collection Rule (DCR) govern karta hai kya collect hoga, kaunse table me.

### 2. Container Insights | Cluster Ka X-Ray

AKS blade → Monitoring (Insights) me: nodes CPU/mem, pod CPU/mem, containers, workload deployments. Live view = `kubectl`-style. Niche query se:

```kql
// Pod us aage CPU/mem top 10 (working set, meaningful)
KubePodInventory
| where TimeGenerated > ago(1h)
| where ClusterName == "aks-prod"
| project ClusterName, Namespace, Name, ContainerName
| distinct ClusterName, Namespace, Name, ContainerName
| join kind=inner (
    Perf
    | where TimeGenerated > ago(1h)
    | where ObjectName == "K8SContainer"
    | where CounterName == "cpuUsageNanoCores"
    | summarize CPU = percentile(CounterValue, 95) by CounterValue
    // simplified — real query uses ContainerID join
) on ClusterName
```

Simpler example jo seedhe kaam karta hai:

```kql
Perf
| where TimeGenerated > ago(30m)
| where ObjectName == "K8SContainer"
| where CounterName == "memoryWorkingSetBytes"
| summarize Samples = count(), MaxBytes = max(CounterValue) by InstanceName
| top 10 by MaxBytes desc
```

### 3. KQL Basics | Log Query Ki Bhaasha

- `| where` = filter (condition)
- `| take N` = first N rows
- `| project col1, col2` = select columns
- `| summarize count() by Field` = group-by aggregation (count/avg/max)
- `| order by Field desc`
- `timespan`: `ago(1h)`, `ago(24h)`

```kql
// Kitne error logs likhe apni app ne last 1 hr me, pod ke hisaab se
ContainerLog
| where TimeGenerated > ago(1h)
| where LogEntry has "ERROR" or LogEntry has "exception"
| summarize Errors_by_Pod = count() by PodName
| order by Errors_by_Pod desc
```

### 4. Managed Prometheus + Grafana | 2026 Default

Azure Monitor ke andar ab **Azure Monitor managed service for Prometheus** + **Managed Grafana** available hai — cluster pe Prometheus operator nahi chalana padta (agent mode, no storage mgmt). Benefits: scale, RBAC integration (Entra), Grafana dashboards (kubernetes/aks templates), PromQL compatible.

```
aks addon: azureMonitorMetrics = managed Prometheus
Explore: az k8s.azure.com/namespace...
Grafana data source: Azure Monitor Prometheus
```

Compare: self-managed Prometheus EKS ke andar (node-exporter + Prom operator + pvc) vs managed (same PromQL, zero ops). AKS free tier + managed Grafana free bhi hai.

### 5. Key Vault + AKS | Bina Secret Ke Secrets

Key Vault = managed vault for secrets/certs/keys (soft-delete, purge protection, RBAC). Storage in code/ConfigMap = no. **CSI Secrets Store driver** (AKS addon) secrets ko mount karta hai — read-only volume, rotated vault changes → new location same path. YAML me secret value nahi, volume reference.

```yaml
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: app-spc
spec:
  provider: azure
  parameters:
    usePodIdentity: "false"
    useVMManagedIdentity: "true"
    userAssignedIdentityID: "<client-id-of-workload-identity>"
    keyvaultName: "kv-devclo"
    objects: |
      array:
        - |
          objectName: db-password
          objectType: secret
    tenantId: "<tenant-id>"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
spec:
  template:
    spec:
      containers:
      - name: app
        image: app:1.0
        volumeMounts:
        - name: secrets
          mountPath: /mnt/secrets
          readOnly: true
      volumes:
      - name: secrets
        csi:
          driver: secrets-store.csi.k8s.io
          readOnly: true
          volumeAttributes:
            secretProviderClass: app-spc
```

App ab `/mnt/secrets/db-password` se padhega. **Workload identity** (Entra workload identity federation) — har app (pod) ko uski own identity (user-assigned MSI) milti hai; SPN secret rotation wala pura pain khatam. YAML: pod me `azure.workload.identity/use: "true"` + service account annotated, IAM grant on identity (Key Vault Secrets User).

### 6. Alert Design | Sabse Important Skill

Alert = condition + signal + action. Actionable hone ke liye: meaningful signal (working set not CPU), frequency (ek minute 6x), severity (sev3), and **no noise** (suppression window, cooldown). Alert rule (metric):

- Signal: `Kubernetes_node_status_NotReady` (Container Insights) / `Memory working set %`, threshold > 85% for 5 min.
- Action: Log Analytics workspace-based: run a query → serve as an alert (logs alerts). Metrics alerts faster.

Aur alert ke saath context: shot link to docs, which team, which runbook.

### 7. 2026 Notes | Latest Kya Hai

- **Workspaces / DCR** — data isolation + cost control; table schema now `ContainerLogV2` (structured).
- **Managed Prometheus in GA** widely behind; Prometheus semantics (rate, histogram) native.
- **Sentinel/query over cloud resources**; grafana + AI/ML anomaly (anomaly detection signals).
- **CSI driver v1.5+ / EnableKeyRotation** — key rotation auto-syncs with mount (`--enable-secret-rotation`).
- **Workload identity GA** — MI federation across AKS + Azure DevOps agents; SPN secret era end.
- **ARC/Monitor** — cross-cluster (k8s + other clouds) via Azure Arc + Grafana data source.

---

## Cheat-Sheet | Yaad Rakhna Commands

| Command / Query | Kaam |
|-----------------|------|
| `az aks show -g rg -n aks --query addonProfiles` | Addons enabled? (monitoring, secrets-store) |
| `az aks enable-addons -g rg -n aks --addons monitoring --workspace-resource-id <ws>` | Container Insights addon on |
| `az aks enable-addons ... --addons azure-keyvault-secrets-provider` | CSI driver addon |
| `kubectl get pods -n kube-system \| grep -E "ama-logs\|azuremonitor\|csi-secrets-store"` | Agents running check |
| `az monitor log-analytics workspace query -g rg -w ws --analytics-query "Perf \| ..."` | CLI se query |
| `az keyvault secret show --vault-name kv --name db-password` | Secret value reference (not in logs/image!) |
| `kubectl get secretproviderclass -A; kubectl get pods` | SPC binding + mount check |

---

## Practice Lab | Abhi Karein

1. AKS cluster banao with `--enable-addons monitoring --enable-msi-auth-for-monitoring --enable-managed-identity --enable-secrets-store-csi-driver` (ya portal from free tier).
2. Wait for agents: `kubectl get pods -n kube-system` → `ama-logs-*`, `csi-secrets-store-*` visible.
3. **Metrics bhejo:** apni web deployment deploy karo, 20s load — ab Azure Portal → AKS → Insights.

4. **KQL explore (Logs blade):** query run karo:
```kql
let end = now();
let start = end - 1h;
KubeNodeInventory | where TimeGenerated between (start..end) | summarize by k8s.nodepool... 
```
(free style: `Perf | where ObjectName == "K8SContainer" | summarize Percentile95 = percentile(CounterValue,95) by CounterName, InstanceName | order by Percentile95 desc | take 10`)

5. **Managed Prometheus + Grafana:** portal par Azure Monitor workspace + Grafana instance add karo; dashboard template `Kubernetes / Views / Global`.
6. **Alert rule:** memory P95 > 80% for 5min → action group (email/webhook). Simulate load (write a rush loop pod), alert fire karo, verify notification.
7. **Key Vault banao:** `az keyvault create -n kv-devclo-<3chars> -g rg-devops`. Secret add: `az keyvault secret set --vault-name <kv> --name db-password --value "S3cure!"
`
8. **Workload identity grant:** `az role assignment create --role "Key Vault Secrets User" --assignee <workload-identity-client-id> --scope <keyvault-id>`
9. **SPC + Deployment YAML** (upar wala) apply karo. `kubectl exec -it <pod> -- mount | grep secrets` → mount available.
10. Verify value: `cat /mnt/secrets/db-password` → `S3cure!` (app reads from file, code me kabhi nahi).
11. **Rotation demo:** secret value update → `kubectl rollout restart deploy/app` → naya value mount — CSI driver sync.
12. Cleanup / notes: alert screenshot + secret-mount proof ka screenshot portfolio me.

---

## Incidents / Tickets | Real Practice

### INC-607 · Monitor Alert — CPU > 90%

- **Situation:** 2 AM — alert "AKS node average CPU 92% > 90% for 10 min" fire. `payments-api` slow, latency graph up. Sab pods Running.
- **Investigate (chain):** 1) `kubectl get nodes` → 3 nodes, none NotReady. 2) `kubectl top nodes` → node `aks-np1-2` ~93% CPU. 3) `kubectl top pods -A --sort-by=cpu | head` → `payments-api-<id>` top consuming. 4) `kubectl logs payments-api --tail=200` → pattern: repeated DB connection retries + backoff logs. 5) `kubectl get events -A` recent → pod scheduled normally.
- **Root cause:** Payments team ne database connection pool unlimited + query without index push kiya — app ab busy-wait (loop) me hai CPU pe, real processing nahi. Node CPU pe wasn't infra — app saturated.
- **Fix:** Rollout pause `kubectl rollout pause deployment/payments-api`. App code pool limit + index/query fix (dev team). Post-fix: rollout resume, resources set (requests/limits), readiness elan. `kubectl rollout restart`.
- **Verify:** `kubectl top nodes` → <50%. Prometheus/container insights CPU % line down. Latency back. Alert auto-clear.
- **Blast radius | Prevent:** Node saturation → scheduling delay, DNS/sidecars affected (potentially whole node pools). Detect kaise: metrics alerts pehle hi apne pod usage — `container_cpu_usage_seconds_total` pod-level alert (not just node). Prevent: CPU request/limit on deploy + app-level pooling limits + load-test gate in CI.

### INC-608 · Key Vault Access Denied on AKS

- **Situation:** New pod `report-service` startup me error: "Key Vault access failed — Forbidden". Other apps (using same vault) fine. Manifest me SPC correct, secret exists in vault.
- **Investigate:** `kubectl get secretproviderclass report-spc -o yaml` → correct keyvaultName/objects. `kubectl describe pods | grep -A5 volumes` → mount path. Container logs: authentication error. `az keyvault show ... --query properties` → same tenant? `az role assignment list --assignee <client-id>` → **empty**.
- **Root cause:** Service account/workload-identity (MSI) ke paas vault par RBAC grant **nahi** thi — `Key Vault Secrets User` role missing, ya old `usePodIdentity=true` with pod-managed identity off. 2026: pehle `AzureKeyVault` provides permission. Here: role assignment miss.
- **Fix:**
```bash
az role assignment create --role "Key Vault Secrets User" --assignee <workload-identity-client-id> --scope <keyvault-resource-id>
kubectl rollout restart deployment report-service
```
Federation credential bhi verify: `az identity federated-credential list --identity-name <mi-name>`.
- **Verify:** `kubectl exec -it report-service -- cat /mnt/secrets/db-password` → value. App startup clean, no error. Vault access log shows success.
- **Blast radius | Prevent:** New pod deploy broke — config/report features unavailable. Detect faster: CSI provider errors in kube-system (secret provider failures) + KV `audit` logs; workload identity alerts. Prevent: IaC (Bicep/Terraform) me role assignment declarative; PR gate checks SPC objects exist; least-privilege (Secrets User not Owner).

---

## Interview Corner | Sawal-Jawab

**Q1: Azure Monitor me Metrics vs Logs me kya difference hai?**
Metrics = numeric time-series (fast, alerting low-latency, dashboards). Logs = text/structured events (queryable via KQL, deeper investigation). Microsoft recommends both: realtime alert on metrics, root-cause via logs.

**Q2: Alert design kaise karte ho (actionable)?**
Signal meaningful (working set not raw CPU), threshold + window (5 min sustained), severity, action group (email/webhook/ITSM), suppression to avoid noise, and context in alert (runbook link, team). Golden: — alert should fire *before* users notice.

**Q3: Key Vault ko AKS se kaise connect karte ho?**
1) Enable CSI Secrets Store driver addon, 2) Create `SecretProviderClass` (keyvaultName + objects), 3) Grant workload identity RBAC (`Key Vault Secrets User`), 4) volumeMount in deployment + read-only volume → secret file. Value kabhi code/env direct nahi.

**Q4: Workload identity vs service principal (SPN) me kya difference?**
SPN: static client secret (rotation pain, secret leak risk). Workload identity: per-pod/user-assigned identity via federation — no secret to rotate; Kubernetes service account ↔ Azure ID binding. Azure DevOps agents bhi ab yehi use karte hain.

**Q5: Container Insights kya collect karta hai aur kahan jata hai?**
Node/pod/container metrics + stdout/stderr logs + inventory. Kubelet/cgroup se agent (ama-logs) gather karta hai → Log Analytics workspace (Perf, ContainerLog, KubePodInventory tables). Prometheus managed agent alag.

---

## Quick Notes | Yaad Rakhna

- Monitor = metrics + logs + alerts; Container Insights single pane for cluster health.
- KQL order: `where` → `project` → `summarize` → `order`; `ago()` times intern samajho.
- Alerts: sustained-threshold (5 min) + right signal + moan suppression; alert should fire before users.
- Secrets: Key Vault + CSI driver mount allow read-only; workload identity = no static SPN.
- SPC (SecretProviderClass) ↔ secrets-store pods — golden troubleshooting pair for access denied.
- Managed Prometheus/Grafana = PromQL without ops; 2026 default.
- Logs me secrets/keys kabhi mat log karo — KV audit ka use.

---

**Kal:** Terraform + Azure shuru — IaC, HCL, state aur remote backend.