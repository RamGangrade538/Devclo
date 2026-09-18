# Day 30 — Project Verify + Operate + Document (DevClo Expanded — Capstone Project)

> Project: **DeployTrack** — aaj project duniya ke samne rakhte hain: monitoring + alerts + rollback drill + README + GitHub public. Interview me 10 min me explain karne layak.
---
## Overview | Parichay
- **Monitor karo:** Azure Monitor alerts (CPU, HTTP 5xx), Log Analytics KQL se investigation, Container Insights, Grafana dashboard.
- **Drill karo:** bad V2 rollout → probe fail → rollout block → alert fire → `kubectl rollout undo` → auto-recovery → postmortem. Yehi seniority hai: *planning for failure*.
- **Document karo:** README (architecture diagram + proof screenshots + incidents handled) aur GitHub pe public publish — portfolio kholo.
- **Aage ka thread:** GitOps repo + ArgoCD (Day 32), SLO-based alerting (Day 37) — sab isi project pe.

Day ke end tak: **interview me 10-min ka script + proof ka keeda ready.**

---
## Project Goal | Project Ka Lakshya
- [ ] Azure Monitor alert active: CPU > 80% (5 min) + HTTP 5xx error rate > 0 — dono fire karte hain.
- [ ] Log Analytics me 3 KQL queries saved (errors, pod status, deploy correlation) — copy-paste ready.
- [ ] Grafana dashboard: CPU, memory, replica count, error rate — screenshot.
- [ ] Bad-V2 drill: rollout atka (readiness fail), pods healthy nahi bann paye — screenshot.
- [ ] Alert fired (CPU/error) — notification screenshot.
- [ ] `kubectl rollout undo` → V1 wapas; `kubectl rollout status` success; `/health` green.
- [ ] Alert clear hua + Grafana recovery dikhaya.
- [ ] `docs/incidents.md` — 2+ real incidents ka log (ticket → root cause → fix → verify).
- [ ] README: architecture diagram + pipeline + monitor + drill screenshots.
- [ ] GitHub repo **public** — description, topics, screenshots embedded.
- [ ] 5-min demo script outline ready.
- [ ] DORA numbers (lead time, fail rate, MTTR) apne repo se nikale.

---
## Step-by-Step | Kadam Dar Kadam
### Phase A — Monitoring & Alerting
**Step 1 — Container Insights confirm karo.** Day 28 me `oms_agent` enable kiya tha. Verify:
```bash
az monitor log-analytics workspace show -g rg-deploytrack-dev -n la-deploytrack-dev \
  --query '[id, .name]' -o tsv
kubectl get pod -n kube-system | grep -i ama-logs       # daemonset pods running?
```
Logs na aa rhe? `az resource update` se Container Insights enable ya portal → AKS → Monitoring → Enable. Working steady-state tak wait karo (`kubectl get pod -n kube-system | grep ama-logs` → Running).

**Step 2 — CPU alert rule (azure CLI se — infra as code discipline):**
```bash
AKS_ID=$(az aks show -n aks-deploytrack-dev -g rg-deploytrack-dev --query id -o tsv)
az monitor metrics alert create \
  --name "alert-aks-cpu-high" --resource-group rg-deploytrack-dev \
  --scopes "$AKS_ID" \
  --condition "avg 'cpu usage percentage' > 80" \
  --window-size "5m" --evaluation-frequency "1m" \
  --action <action-group-email> --description "DeployTrack AKS CPU > 80% for 5 min"
```
Action group: `az monitor action-group create -n ag-oncall -g rg-deploytrack-dev --short-name oncall --email <you>@example.com`. Alert me query bhi karo: template me resourceName, metricName hota hai.

**Step 3 — HTTP 5xx alert (Log Analytics KQL based):**
```bash
az monitor scheduled-query create -g rg-deploytrack-dev -n alert-http-5xx \
  --scopes <LA_WORKSPACE_ID> \
  --condition "count 'ContainerLog' > 0" \
  --condition-query "ContainerLog | where LogEntry contains '500'" \
  --window-size "PT5M" --evaluation-frequency "PT5M" \
  --action <action-group-email> --description "5xx errors in app logs"
```

**Step 4 — Load generator banao (alert ko demo ke liye trigger karega).** `scripts/loadgen.sh`:
```bash
#!/usr/bin/env bash
set -euo pipefail
URL="${1:-http://localhost:8080}"    # SERVICE env me port-forward / ingress
echo "Hitting $URL/health in parallel with curl"
for i in $(seq 1 200); do
  curl -s -o /dev/null -w "%{http_code}\n" "$URL/health" &
  [ $((i % 30)) -eq 0 ] && sleep 1
done
wait
```

### Phase B — Log Analytics KQL (investigation ki bhasha)
**Step 5 — KQL query #1: app errors 5-min bucket me.**
```kql
ContainerLog
| where Namespace == "deploytrack-dev"
| where LogEntry contains "ERROR" or LogEntry contains "500"
| summarize ErrCount = count() by bin(TimeGenerated, 5m), ContainerName
| order by TimeGenerated desc
```
Save as "App Errors"; pin to shared dashboard. Trial me chalao:
```bash
az monitor log-analytics query -w <LA_WORKSPACE_ID> \
  --analytics-query "ContainerLog | where LogEntry contains '500' | take 20"
```

**Step 6 — KQL query #2: pod health (CrashLoopBackOff / pending):**
```kql
KubePodInventory
| where Namespace == "deploytrack-dev"
| where PodStatus in ("CrashLoopBackOff", "ImagePullBackOff", "Pending")
| summarize by Name, PodStatus, TimeGenerated
| top 20 by TimeGenerated desc
```

**Step 7 — KQL query #3: deploy correlation — SHA → image → pod age.** Isi se "konse image ka deploy" prove hota hai:
```kql
KubePodInventory
| where Namespace == "deploytrack-dev"
| where PodStatus == "Running"
| project Name, Image, CreatedTime
| order by CreatedTime desc
| take 10
```
> Interview me: *"Push ke baad main Log Analytics se exact image SHA pod pe confirm karta hoon — deployment aur code me end-to-end traceability."* — ye line unhe pasand aayegi.
**Step 8 — Grafana dashboard.** Azure Managed Grafana ya community Grafana ko Azure Monitor data source se link karo:
```bash
az grafana create \
  -n grafana-deploytrack -g rg-deploytrack-dev --sku Standard
```
Data source: Azure Monitor → managed identity (workload identity se). Panels: CPU (Perf), memory (Perf), replica count (KubePodInventory / 2), error rate (ContainerLog). Dashboard import karo; screenshot lo.

### Phase C — Bad-V2 Rollout Drill (fail, learn, fix)
**Step 9 — Drill setup: ek **bad V2** image banao** jo `/health` pe 500 deta hai. `backend/bad_version.py` (branch me hi):
```python
from app import app
import logging
logging.getLogger("werkzeug").setLevel(logging.CRITICAL)

@app.get("/health")
def health_bad():
    return {"status": "bad", "version": "v2-bad"}, 500
```
Isse CI se image `deploytrack-api:v2bad` (ya SHA) ACR me push karo. Script ko prod pipeline deploy karne se pehle **dev** me hi drill karo — rule: drill hamesha prod pe nahi, lower env pe pehle.

**Step 10 — Bad-V2 deploy (drill):**
```bash
kubectl set image deployment/deploytrack-api deploytrack-api=acrdeploytrackdev.azurecr.io/deploytrack-api:v2bad -n deploytrack-dev
kubectl rollout status deployment/deploytrack-api -n deploytrack-dev --timeout=120s && echo "ROLLED" || echo "ROLLOUT BLOCKED"
```
Kya hoga: RollingUpdate `maxUnavailable: 0` + `maxSurge: 1` — nayi pod atki (readiness fail), purani blue pod continue serve karti hai. **Yehi "auto-rollback by design" hai:** Kubernetes turant old pods nahi kat-ta. Observe: `kubectl get events ... | grep -i failed` + `kubectl get po -w`.

**Step 11 — Alert fire karo (live):**
```bash
./scripts/loadgen.sh http://localhost:8080   # port-forward / ingress URL
```
5xx count badha → Step 3 ka alert fire (email/portal notification). Screenshot lo — ye "detect" ka proof.

**Step 12 — Investigate (kubectl+logs, guess nahi):**
```bash
kubectl describe pod -n deploytrack-dev -l app=deploytrack-api | grep -iA3 "Readiness\|CrashLoop"
kubectl logs deploy/deploytrack-api -n deploytrack-dev --tail=30
az monitor log-analytics query -w <LA> --analytics-query "ContainerLog | where LogEntry contains '500' | take 10"
```
Root cause milega: health handler 500 → readiness fail → rollout block. Fix = wapas V1 image.

**Step 13 — Rollback:**
```bash
kubectl rollout undo deployment/deploytrack-api -n deploytrack-dev
kubectl rollout status deployment/deploytrack-api -n deploytrack-dev --timeout=180s
kubectl get po -n deploytrack-dev -o wide                      # image wapas <SHA>-V1
curl -s localhost:8080/health                                  # {"status":"ok"}
```
Alternative fixes dikha sakte ho: `kubectl set image ...:v1` (rollback), `kubectl rollout undo` (revision), ya fix-forward (naya build). Senior answer: *"Depends on incident — metadata rollback best jab same SHA repush nahi kar sakte; fix-forward jab root cause known + quick."*

**Step 14 — Verify recovery + alert clear.**
```bash
kubectl rollout status deployment/deploytrack-api -n deploytrack-dev
az monitor log-analytics query -w <LA> --analytics-query "ContainerLog | where LogEntry contains '500' | count"
```
5xx count 0; Grafana pe CPU normal; portal me alert "Fired → Resolved" dikhao (screenshot #2).

**Step 15 — Incident log (`docs/incidents.md`).** Format (senior hai ye):
```
# INC-0917 · DeployTrack V2bad drill — "health 500 after rollout"

Detection        : Alert "HTTP 5xx" fired 14:32 IST (loadgen ke 30s baad)
Severity/Role    : SEV2 · on-call (capstone drill)
Impact           : dev namespace only — prod untouched (blue alive, deploy history)
Root cause       : bad health handler returned 500 → readiness probe failed → new pod never Ready
Resolution       : kubectl rollout undo → V1 → readiness pass (MTTR 2m 40s)
Prevention       : (a) pipeline health gate remains, (b) future canary 5% in prod idea
Lesson           : don't change health semantics in V2 without tests; probe + healthy image = deploy gate
Verifier         : curl /health 200 · Log Analytics 5xx=0 · Grafana CPU normal · alert Resolved
```

### Phase D — README, Screenshots, GitHub Public
**Step 16 — README banao** (`README.md`) — portfolio ka front page. Structure:
```markdown
# DeployTrack — Deployment Tracking + Full DevOps

Web app tracking deployments, with a complete Azure DevOps → AKS platform behind it.

## Architecture
[mermaid/ascii diagram: Dev → Azure Repos → Pipelines → ACR → AKS → KV/CSI → Azure Monitor]

## Stack & Why
Flask · Docker/distroless · AKS · Terraform (AVM mention) · Azure DevOps · Key Vault CSI ·
Log Analytics/Grafana · Workload Identity Federation

## CI/CD (Day 29)
[multi-stage pipeline summary + screenshot `docs/screenshots/pipeline-green.png`]

## Monitoring (Day 30)
[alert rules + KQL + Grafana screenshot]

## Incidents Handled
| INC | Detected | Root cause | Fix | MTTR |
|-----|----------|------------|-----|------|
| INC-0917 | alert 5xx | health handler 500 | rollout undo | 2m 40s |
| ...     | ...      | ...         | ... | ...  |

## Proof / Verification
- Pipeline green: `docs/screenshots/pipeline-green.png`
- Alert fired+resolved: `docs/screenshots/alert-5xx.png`
- Rollback drill: `docs/screenshots/rollback-undo.png`
- Terraform apply: `docs/screenshots/terraform-apply.png`

## Run It Locally / Reproduce
```bash
make test && make scan && docker compose up # then terraform + az devops setup (day-28 doc)
```
## DORA Numbers
lead time, deployment frequency, change-failure rate, MTTR (table)
```

**Step 17 — Screenshots looto (ordered list):**
```bash
mkdir -p docs/screenshots
# 1) Azure DevOps → Pipelines → green run      (pipeline-green.png)
# 2) Portal → Alerts → Fired/Resolved          (alert-5xx.png)
# 3) Grafana dashboard                         (grafana-dash.png)
# 4) kubectl rollout undo log + pods           (rollback-undo.png)
# 5) terraform apply output                    (terraform-apply.png)
# 6) KQL query result                          (kql-errors.png)
```
Har screenshot ke saath 1-line caption README me — recruiter bhi samjhe.

**Step 18 — GitHub public + polish:**
```bash
git remote set-url origin https://github.com/<YOU>/deploytrack.git   # ya mv to GitHub
gh repo create deploytrack --public --source=. --push
gh repo edit deploytrack --description "DeployTrack: Flask + AKS + Azure DevOps + Terraform + monitoring capstone"
gh repo edit deploytrack --add-topic devops,kubernetes,azure,terraform,azure-devops,ci-cd
```
Topics + README screenshot = pehla impression. Purana Naukri/resume me: "DeployTrack — End-to-end Azure DevOps → AKS; CI/CD, IaC, observability, rollback drills (link)".

**Step 19 — 5-min demo script outline (`docs/demo-script.md`):**
```
min-0:00  Problem + repo tour (structure)          [1 min]
min-0:30  Pipeline green run karke dikhao (approval) [1 min]
min-1:30  Live deploy prod (approve) + health verify [1 min]
min-2:30  Monitoring: Grafana + alert rule + KQL      [1 min]
min-3:30  Rollback drill: bad V2 → undo → verify     [1.5 min]
min-5:00  Close: DORA numbers + GitOps next step      [0.5 min]
```

**Step 20 — Final sweep + commit:**
```bash
make test && make scan
terraform plan -out /dev/null 2>&1 || terraform plan -out /dev/null
git add . && git commit -m "docs(day30): monitoring, incidents, drill proof + README"
git push && gh repo view --web
```

---
## Architecture | Architecture Diagram
```
Dev ─► Azure Repos ─► Azure Pipelines (CI: test→build→ACR push SHA)
        │               │
        │               └► CD: dev → approval → prod (blue/green)
        ▼               
     AKS ◄── pull ── ACR
        │
        ├── CSI Secrets Store ◄── Key Vault (db-password)
        ├── Azure Monitor (Container Insights)
        │        ├── metrics → alerts (CPU / HTTP 5xx)
        │        └── logs → Log Analytics (KQL)
        └── Grafana dashboard (metrics + error rate)
                  ▼
        README + docs/incidents.md + GitHub public
```

```
Day 28: infra code  →  Day 29: code→ACR→gated CD  →  Day 30: monitor + drill + document
```

---
## Verification Checklist | Project Verify Karo
- [ ] `ama-logs` pods Running — Container Insights data a raha hai
- [ ] Alert rules exist: `alert-aks-cpu-high` + `alert-http-5xx` (az CLI se verify)
- [ ] Loadgen se CPU/5xx bada → alert **Fired** (screenshot) → recovery pe **Resolved**
- [ ] KQL #1/#2/#3 run karke meaningful results saved
- [ ] Grafana dashboard live + screenshot (CPU, mem, replicas, errors)
- [ ] Bad-V2 drill: `rollout status` timeout/block — screenshot
- [ ] `kubectl rollout undo` → `rollout status` success — screenshot
- [ ] `curl /health` → 200; Log Analytics `500` count = 0
- [ ] `docs/incidents.md` me 2+ incidents (template se)
- [ ] README: architecture + stack + CI/CD + monitoring + incidents + proofs
- [ ] GitHub repo public; description + topics set; screenshots embedded
- [ ] 5-min demo script outline ready; self-demo recorded in 6 min
- [ ] DORA numbers table filled (real, from repo/pipeline)

---
## Deliverables | Submit Kya Karo
- **Public GitHub link** (`github.com/<YOU>/deploytrack`) — README pe sab
- `README.md` — full portfolio document (diagram + stack + proofs)
- `docs/incidents.md` — incident log (2+), `docs/demo-script.md` — 5-min outline
- `docs/screenshots/` — pipeline-green, alert-5xx, grafana-dash, rollback-undo, terraform-apply, kql-errors
- Pipeline + alert + drill ke live runs (record karke YouTube/loom ya repo me)

---
## Interview Talk Track | Interview Me Kaise Bolna
**Problem (30 sec):** *"Deploys ke paas koi visibility nahi thi — pata nahi kaunsa version live hai, aur nahi pata jab cheez tooti. DeployTrack me monitoring + alert + rollback drill ka pura loop hai."*
**Architecture (1 min):** *"Code → Azure Repos → Pipelines (CI: test+build+ACR SHA push; CD: gated blue/green) → AKS. Keys Key Vault me, CSI driver se pod me. Azure Monitor + Log Analytics + Grafana se dekh rahe hain. Sab Terraform, remote state locked."*
**Meri role (1 min):** *"Poori chain khud banayi aur — monitoring alerts, KQL queries, load test, bad-V2 drill, recovery, aur documentation. Matlab fail hone se pehle hi main soch sakta hoon kya hogi."*
**Challenges (3 min):**
- *"Alert CPU>80% pehle false-positive karta tha (system node pressure) — filter + threshold tune kiya."*
- *"5xx alert Log Analytics me ContainerLog se laga — logs ane me 2-3 min lagte hain, isliye short window nahi chahiye. Sampling/slippage samjha."*
- *"Bad-V2 rollout block hua — readiness fail, par blue alive — maxUnavailable:0 + maxSurge:1 ka design hi hai."*
- *"Rollback `undo` se 2m 40s me — alert fired, root cause health handler 500, fix kiya, verify cycle."*
**Mistakes + fixes (1 min):** *"Ek baar action group email galat tha — alerts na aaye. Portal me verify karke fix. Ek baar drill prod pe karne laga tha — rule ab hai: drill pehle lower env."*
**Metrics (1 min):** *"Push→dev ~6 min, push→prod ~9 min (approval excluded). Change-failure rate: 1 in last 20 (V2bad drill). MTTR (rollback) 2m 40s. DORA ke saare 4 repo/pipeline se nikaale, README me table."*
**Closer (30 sec):** *"Project GitHub public + documented. Aage isi pe GitOps (ArgoCD) aur SLO-based canary laga raha hoon — Day 32 plan."*

> **Senior tip:** 10 min ka script hai — khud 6 min me record karke dekho. Jo point flail ho wo mat bola karo, screenshot do. Interview me log badhe bhaad se sunne ka role hai — tumhara proof unki tension door karta hai.