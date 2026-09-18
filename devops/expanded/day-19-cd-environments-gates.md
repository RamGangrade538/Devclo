# Day 19 — CD + Environments + Gates (DevClo Expanded)

## Overview | Parichay

Ab tak CI ne **artifact (SHA-tagged image)** de diya. Aaj wahi artifact **dev → QA → prod** tak promote karte ho — multi-stage CD ke saath **manual approvals** aur **automatic gates**. Yahan "deploy" sirf image lagana nahi; safety valves hain: approval checks, health gates, and deployment strategies (rolling/blue-green/canary). Ye din kaht hai ki prod deploy **by design** safe ho — production me push button sirf approver ke haath me.

---

## What You'll Learn | Aaj Ki Seekh

- [ ] Multi-stage YAML CD likho: dev → QA → prod (saath `environment:` blocks)
- [ ] Environments me **approvals** configure karo (manual gate)
- [ ] **Gates**: health check gates, monitor/API gates, wait duration
- [ ] Deployment strategies samjho: **rolling, blue-green, canary**; deployment groups
- [ ] AKS se CD: service connection (kubeconfig), `Kubernetes@1`/`kubectl`/`HelmDeploy` tasks
- [ ] Rollout failure detect karo (readiness check, logs, rollback hook)
- [ ] GitOps intro: pull model vs push model (ArgoCD/Flux peek)
- [ ] Same artifact har env me deploy karo

---

## Full Topic (LEARN) | Puri Detail

### 1. Multi-Stage CD — YAML Anatomy

CI me build hua; CD ek pipeline ke andar **deployment stages** hain. Har stage `deployment:` block (Java ke andar) use karta hai to agent par deploy hota hai — aur environment BINDS context (approval/gate yahan attach hote hain).

```yaml
stages:
- stage: Build
  jobs:
  - job: build_image
    steps:
    - task: Docker@2            # (Day 18) build+push ACR
      ...
    - task: PublishBuildArtifacts@1 ...

- stage: DeployDev
  dependsOn: Build
  jobs:
  - deployment: DeployDevJob
    environment: 'dev'                     # environment reference — approvals/gates yahan
    strategy:
      runOnce:                             # simplest strategy
        deploy:
          steps:
          - download: current
            artifact: 'devclo-api'
          - task: Kubernetes@1
            inputs:
              connectionType: 'Azure Resource Manager'
              azureSubscription: 'aks-connection'   # AKS service connection
              namespace: 'dev'
              command: 'apply'
              useConfigurationFile: true
              configuration: 'manifests/deployment-dev.yaml'
```

**Key points:**
- `environment:` block = Azure Pipelines **Environments** page me env (dev/qa/prod) baan jata hai; approvals + gates isi ke andar configure hote hain.
- `strategy: runOnce | rolling | blueGreen | canary` — deployment strategy choose karo.
- download artifact: CD wali stage **same run** se (`download: current`) — artifact CI se CD me migrate.
- `DependsOn` chain se order fix.

### 2. Approvals (Manual Gate)

**Environments kya hain:** logical named target (`dev`, `qa`, `prod`) jo pipeline ko context deta hain — inhe approvers + gates bhi attach hoti hain.

Setup (portal):
```
Pipelines → Environments → New → name: prod
  → Approvals and checks → Add → "Approvals"
      → Approvers: ops-team (group) ; Timeout: 30 min (Xtallah)
```

YAML me bas `environment: 'prod'`; approvals UI par manage hoti hain (check-based, infra-as-code me pipeline me nahi dabba). **Deploy gate** apart:** approval = insaan click; gate = automatic condition** — dono milke prod safety.

- Approval timeout set karo (default 30 min), approvers group-level rakho (individual user nahi, taki leaves pe stuck na ho).
- 2026 note: environments per branch split ho sakti hain (`dev` per developer), approved prod env ek single-team culture.

### 3. Gates (Automatic Quality Checks)

Gates = deployment ko **auto allow/deny** karte hain, policiness condition (approval se alag):

- **Azure Monitor query gate:** alert queury se wait + condition (`failed`/`healthy`) — `evaluate` at waitDuration.
- **Invoke REST API gate:** health endpoint se result — `https://api.devclo.app/healthz` return success.
- **Work item gate:** production ke liye linked work items (tests) present hona zaroori.

Har gate ke 3 knobs: **deployment start timeout**, **sampling interval**, **minimum success duration**. Rollout failure detect karne ke liye health task (`Kubernetes` `rollback` hook ya logs) + gate dono use karoge.

### 4. Deployment Strategies

| Strategy | Kya hai | Kahan use |
|----------|---------|-----------|
| **runOnce** | Simple — pods replace karo (default) | Dev/test |
| **rolling** | `maxUnavailable/ maxSurge` se ek-ek pods swap | QA (zero-downtime) |
| **blue-green** | `blueGreen:` — new image `green` namespace, phir switch; rollback = switch back | Prod (zero-downtime) |
| **canary** | `canary:` — 10% traffic, `increments:` se 25→50→100%, health check per step | High-risk prod |
| **deployment groups** | VM-based (not k8s) rolling deploy to collection of VMs | Legacy VM apps |

```yaml
strategy:
  canary:
    increments: [10, 25, 50]     # pehle 10%, phir 25%, etc.
    deploy:
      steps:
      - download: current
        artifact: 'devclo-api'
      - task: Kubernetes@1        # apply to canary
        inputs:
          command: 'apply'
          configuration: 'manifests/canary.yaml'
    on:                           # termination hooks
      success:
        strategy: rolling\runOnce
      failure:
        steps:
        - script: kubectl set image deployment/devclo ... (rollback)
```

### 5. AKS Service Connection + kubectl/Helm

- **Service connection to AKS:** Project Settings → Service connections → **Kubernetes** → Azure subscription → cluster select. Connection me `kubeconfig` (cluster auth via managed identity / workload identity) milta hai.
- **kubectl tasks:** `Kubernetes@1` (kubectl wrappers: apply/exec/logs), `HelmDeploy@0` (chart install/upgrade), raw `script: kubectl ...` (enable service connection via `azureSubscription` + resourceGroup). 2026: networking/CD best = helm upgrade + `--atomic` + `--timeout`.

```yaml
- task: HelmDeploy@0
  inputs:
    connectionType: 'Azure Resource Manager'
    azureSubscription: 'aks-connection'
    azureResourceGroup: 'devclo-rg'
    kubernetesCluster: 'devclo-aks'
    command: 'upgrade'
    chartType: 'FilePath'
    chartPath: 'charts/devclo'
    releaseName: 'devclo'
    overrideValues: 'image.repository=$(ACR)/devclo-api,image.tag=$(Build.SourceVersion),replicaCount=3'
    install: true
```

### 6. Gate + Rollout Integration

```yaml
stages:
- stage: DeployProd
  dependsOn: DeployQA
  jobs:
  - deployment: ProdDeploy
    environment: 'prod'            # approvals + Azure Monitor gate attached
    strategy:
      rolling:
        maxParallel: 2
        deploy:
          steps:
          - task: Kubernetes@1
            inputs: { command: 'apply', configuration: 'manifests/prod.yaml' }
    postSteps:                     # deployment ke baad health confirm
    - task: Kubernetes@1
      inputs: { command: 'logs', ...}
      displayName: 'Check readiness'
```

### 7. GitOps Intro (Pull Model)

Push model (aaj ka): CI/CD image ko **push** karta hai cluster me. **GitOps:** desired state = **git repo me YAML**, aur operator (ArgoCD/Flux) cluster ko usse **pull/apply** karta hai — drift karne par **auto-reconcile** (self-heal). Deep dive Day 32; aaj bas fark yaad rakho: *"duniya me push ka kaam turant hota hai but verifiable state ka home git hai."*

---

## Sample Pipeline | Example YAML

```yaml
# azure-pipelines.yml — Day 19: CD dev->QA->prod with approvals + gates
# Hinglish comments. Prerequisite: ACR image (Day 18) + AKS service connection.

variables:
  ACR: 'devcloacr12.azurecr.io'
  IMAGE: 'devclo-api'

stages:
- stage: DeployDev
  jobs:
  - deployment: dev_deploy
    environment: 'dev'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: HelmDeploy@0
            inputs:
              connectionType: 'Azure Resource Manager'
              azureSubscription: 'aks-connection'
              azureResourceGroup: 'devclo-rg'
              kubernetesCluster: 'devclo-aks'
              command: 'upgrade'
              chartType: 'FilePath'
              chartPath: 'charts/devclo'
              releaseName: 'devclo-dev'
              overrideValues: 'image.repository=$(ACR)/$(IMAGE),image.tag=$(Build.SourceVersion)'
              install: true

- stage: DeployQA
  dependsOn: DeployDev
  jobs:
  - deployment: qa_deploy
    environment: 'qa'              # approval (ops-team) attach hoga
    strategy:
      rolling:
        deploy:
          steps:
          - script: echo "deploying to QA via rolling"
            displayName: 'QA deploy'

- stage: DeployProd
  dependsOn: DeployQA
  jobs:
  - deployment: prod_deploy
    environment: 'prod'            # prod: approvers + Azure Monitor gate (UI par)
    strategy:
      canary:
        increments: [10, 25, 50]   # traffic step-by-step badhao
        deploy:
          steps:
          - task: HelmDeploy@0
            inputs:
              connectionType: 'Azure Resource Manager'
              azureSubscription: 'aks-connection'
              azureResourceGroup: 'devclo-rg'
              kubernetesCluster: 'devclo-aks'
              command: 'upgrade'
              chartType: 'FilePath'
              chartPath: 'charts/devclo'
              releaseName: 'devclo-prod'
              overrideValues: 'image.repository=$(ACR)/$(IMAGE),image.tag=$(Build.SourceVersion)'
              namespace: 'prod'
              install: true
    postSteps:
    - script: echo "prod health ok (gate verifies)"
      displayName: 'Post-deploy check'
```

**Chalao → expected flow:** deploy karte hi dev green → QA manual approval requested (UI me pending check) → approve → QA rolling → prod gate + approval → canary 10→25→50%. Har step ready pe check (gates) attach hote hain.

---

## Commands Cheat-Sheet | Yaad Rakhna Commands

| Command/Task | Kaam |
|--------------|------|
| `az devops environments create --name prod` | Environment banao |
| `az pipelines approvals` / UI | Approvals add karo (env checks) |
| `Kubernetes@1` (apply/rollback) | kubectl tasks |
| `HelmDeploy@0 upgrade --atomic` | Helm release deploy (rollback on fail) |
| `strategy: runOnce/rolling/blueGreen/canary` | Rollout strategy |
| `kubectl rollout status deployment/<name>` | Deploy completion + readiness |
| `kubectl get events --sort-by=.lastTimestamp` | Rollout errors detect |
| `DownloadPipelineArtifact@2` (or `download: current`) | CD me artifact le lo |
| `az aks get-credentials --name <aks> --resource-group <rg>` | Local kubeconfig |
| `kubectl set image deployment/devclo-api app=<img>:<tag>` | Quick image update/rollback |

---

## Practice Lab | Abhi Karein

1. (Optional) AKS cluster haine ho to create karo: `az aks create -g devclo-rg -n devclo-aks --node-count 2`.
2. Azure DevOps me 3 environments banao: `dev`, `qa`, `prod`.
3. `prod` environment me **Approvals** check add karo (approver: koi doosra user/group, timeout 15 min).
4. Sample YAML copy karke run karo → DeployDev green; DeployQA **pending approval** par ruk jaata hai.
5. Approve karo → QA rolling → DeployProd approval ke liye RUK jaa raha hai.
6. Approve → prod canary: increments 10→25→50% UI me routing dikhta hai.
7. `prod` env me **Invoke REST API gate** add karo: `https://<your-api>/healthz` (JSON path `.status == "ok"`), interval 5 min, waait 15 min.
8. Gate fail scenario: health endpoint ko ek baar 503 return karo (apne app ko temporarily off karke) → pipeline gate par ruk jaye, code red no.
9. AKS me verify: `kubectl get deploy -n prod`, `kubectl rollout status deployment/devclo-prod`, event logs padho.
10. Blue-green experiment: `strategy: blueGreen` me `greenSlice` wali config apply karo + `kubectl get endpoints` se switch verify.
11. Rollback drill: prod me wrong image tag deploy karke `kubectl rollout undo deployment/devclo-prod` (ya Helm `--rollback`) se recovery dikhao.
12. GitOps section padho aur likho: push vs pull model ka fark apne words me (ArgoCD/Flux ki role kya hogi).
13. **Expected result:** Multi-stage CD dev→prod approvals ke sath, gates fail/approval pending par release controlled hota hai, rollout health verified — "deploy by design" wala mindset pakka.

---

## Incidents / Tickets | Real Practice

### INC-509 · Deployment Failed at Stage
- **Situation:** DeployQA (AKS) stage par pipeline `Kubernetes apply` error: "the server was unable to return a response for the request / Forbidden (403)". Releases stuck.
- **Investigate:**
  ```bash
  az pipelines runs log --id <runid> | grep -iE "403|forbidden|denied|error" | head -30
  az acr show --name <acr> --query 'id' -o tsv     # ACR resource ID
  # AKS <-> ACR pull rights check:
  az aks show -g devclo-rg -n devclo-aks --query 'aciProfile|identity'
  kubectl get events -n qa --sort-by=.lastTimestamp | tail -20   # image pull?
  ```
  ACR private hai to AKS ko pull-credentials chahiye (`acr pull` role ya workload identity).
- **Root cause:** AKS cluster ki identity ke paas ACR me `AcrPull` role nahi hai (private registry image pull deny) — ti SPN/Identity based pull-rights missing; ya service connection (workload identity) ki k8s apply permission expired/invalid.
- **Fix:**
  ```bash
  az aks show -g devclo-rg -n devclo-aks --query 'identity.principalId' -o tsv > pid.txt
  az role assignment create --assignee "$(cat pid.txt)" \
    --role AcrPull --scope "/subscriptions/<sub>/resourceGroups/devclo-rg/providers/Microsoft.ContainerRegistry/registries/<acr>"
  ```
  Service connection ka scope/role bhi check: Project → Service connections → `aks-connection` → verify certificate/federated credential validity (workload identity ka OIDC issuer consistent).
- **Verify:** `az pipelines run` dobara → DeployQA succeed; `kubectl get pods -n qa` → Running (ImagePullBackOff nahi).
- **Blast radius | Prevent:** CD stuck = release freeze (pura pipeline chain blocking). Pull-rights hamesha **cluster-managed identity** ko grant karo (least privilege `AcrPull`), IAM policy-as-code me version them (bicep) and rotate/federate credentials via workload identity — no long-lived secrets to expire. Monitoring: image pull failure alerts ko post-deploy gate me include karo.

### INC-510 · Secret Failed in CD
- **Situation:** Prod deploy me app pods `CrashLoopBackOff` — "invalid credentials / connection refused to secret store". Dev+QA deploy hua tha, prod hi fail.
- **Investigate:**
  ```bash
  kubectl describe pod -n prod | grep -A5 "Events"      # error detail
  kubectl logs <pod> -n prod --previous | tail -20       # app-level secret error
  # KV reference/sidecar check:
  kubectl get secret -n prod
  # Key Vault reference ya CSI driver mount:
  kubectl describe pod -n prod | grep -i "vault\|secret"
  az keyvault secret list --vault-name <kv> --output table
  algo 'keyvault' variable group logs = check pipeline
  ```
- **Root cause:** Production app ke liye **Key Vault reference / CSI ended broken**: KV me secret missing/purged (soft-delete restore not done), ya prod MSI/identity ko KV par `Key Vault Secrets User` role nahi hai (rbac vs access policy). Ya service connection (SPN) secret **expire** ho gaya (INC-406 pattern, ab CD-ke-liye form).
- **Fix:**
  ```bash
  # missing secret restore ya banao
  az keyvault secret set --vault-name <kv> --name db-password --value <new>
  # Identity ko role do (RBAC model):
  az role assignment create --assignee <msi-principal-id> \
    --role "Key Vault Secrets User" \
    --scope "/subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.KeyVault/vaults/<kv>"
  ```
  Service connection ke liye (SPN-based CD bala problem) → workload identity federation switch karo + credentials rotate.
- **Verify:** Pods restart ho kar `Running`; `kubectl get pods -n prod` + health API 200; pipeline run green; KV ke audit logs me successful secret get dikhta hai.
- **Blast radius | Prevent:** Prod secrets fail = full outage (CrashLoop). Secrets ko **single-source (KV)**, RBAC-first model (Entity-driven, no access policies stale), MSI/workload identity se give least-privilege role, `appRole` delete kar ke rotated. Secrets timeout gating: deployment ke saath secret state verify (readiness) karne ka hook — "secret not resolvable = don't start app" bhi design pattern.

---

## Interview Corner | Sawal-Jawab

1. **Q: CI aur CD ka farak pipeline context me?** A: CI = code ko artifact tak (build+test+scan+push — deterministic, fast feedback). CD = artifact ko environments tak safely promote karna (approvals, gates, deployment strategies, rollback). Day 8 ke concept ka real form.
2. **Q: Approval vs gate?** A: Approval = **manual** insaan ka anumati (business/ops). Gate = **automatic** condition (health endpoint 200, Azure Monitor no alerts, work items). Approvals reservations ko no nhi, gates certinza.
3. **Q: Rolling/blue-green/canary me kya fark?** A: Rolling = purane pods ko ek-ek karke replace (simple). Blue-green = 2 complete env, naya traffic par, phir one-shot switch (fast rollback via switch). Canary = % traffic step-by-step (10→25→50→100), risk ka sabse Kam, health verifiable har step par.
4. **Q: Deployment hook/strategy me `on.failure` kya karta hai?** A: Rollout failure detection par precedent action — e.g. health check fail → rollback to old version automatically. Azure Pipelines uses `on: { failure: { steps: [...] } }` (kubernetes deployment jin me) ya Helm `--atomic` (fail par auto-rollback).
5. **Q: GitOps aur push model me farak?** A: Push = CI/CD image/state ko cluster me push karta hai (aaj ke pipelines). GitOps = git repo desired state ka single source, operator (ArgoCD/Flux) state ko pull + reconcile karta hai (self-heal). GIT ke Saath: prod stens to revert = git revert + sync — visibility + reversion.

---

## Quick Notes | Yaad Rakhna

- `environment:` block = approvals + gates ka context (UI ke through attached).
- **Same artifact → har env** — build jo test kiya wahi deploy.
- Strategies: **runOnce → rolling → blue-green → canary** (risk scale).
- Gates auto-check karte hain; approvals manual — dono milke prod safe.
- AKS service connection = kubeconfig via **workload identity** (no long-lived secrets).
- Rollout failure → auto-rollback (Helm `--atomic` / `on.failure` / `kubectl rollout undo`).
- GitOps: git = truth; operator pull + reconcile (aage Day 32 primitive).