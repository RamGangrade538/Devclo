# Day 29 — Project Build: CI/CD Pipeline (DevClo Expanded — Capstone Project)

> Project: **DeployTrack** — aaj pipeline banegi jo `main` pe push hote hi code ko **dev me deploy** karti hai, aur **approval** ke baad **prod me** pahunchati hai. Zero manual deployment.
---
## Overview | Parichay
- **Single `azure-pipelines.yml`** — multi-stage: lint → test → docker build → ACR push (commit-SHA tag) → deploy dev → **approval gate** → deploy prod.
- **K8s manifests** — Deployment + Service + Ingress + ConfigMap + Secret (Key Vault CSI se, code me kabhi nahi).
- **Blue/green deployment** — Ingress traffic switching; rollback seconds me (old service pe point karo).
- **GitOps (2026):** same manifests ek `deploytrack-gitops` repo me bhi jaayenge — ArgoCD prod ka source of truth (Day 32 full deep-dive).
---
## Project Goal | Project Ka Lakshya
- [ ] `azure-pipelines.yml` repo me hai (pipeline-as-code — portal pe stage-by-stage manual nahi banana).
- [ ] CI: lint + `pytest` pass; koi test fail → pipeline red instantly.
- [ ] Docker build + Trivy gate; image **commit-SHA tag** se ACR me (kabhi bare `latest` prod me nahi).
- [ ] `Deploy dev` stage: manifests apply, readiness gate pass hone tak wait.
- [ ] `Deploy prod` stage **manual approval** ke peeche (Environments → approvals).
- [ ] K8s: Deployment, Service, Ingress, ConfigMap, SecretProviderClass — sab `k8s/` me versioned.
- [ ] Secret kisi bhi YAML me nahi — Key Vault → CSI driver se mount.
- [ ] Blue/green: ingress se traffic switch (`switch-traffic.sh green|blue`) demo kiya.
- [ ] Pipeline history me green full run + red failure; strategy `RollingUpdate` (maxUnavailable 0, maxSurge 1).
- [ ] (Bonus) `deploytrack-gitops` repo pushed — ArgoCD ready.
---
## Step-by-Step | Kadam Dar Kadam
### Phase A — K8s manifests (pehle, pipeline se pehle)
**Step 1 — Namespace + ConfigMap (`k8s/namespace.yaml`, `k8s/configmap.yaml`):**
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: deploytrack-dev
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: deploytrack-config
  namespace: deploytrack-dev
data:
  APP_ENV: "dev"
  LOG_LEVEL: "info"
```

**Step 2 — Secret via CSI Secrets Store (`k8s/secretproviderclass.yaml`) — secret yahan tek nahi:**
```yaml
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: deploytrack-kv
  namespace: deploytrack-dev
spec:
  provider: azure
  parameters:
    usePodIdentity: "false"        # 2026: workload identity, pod identity nahi
    useVMManagedIdentity: "false"
    clientID: "<WIL-CLIENT-ID>"    # AKS workload identity client id
    keyvaultName: "kv-deploytrackdev"
    objects: |
      array:
        - objectName: db-password
          objectType: secret
    tenantId: "<TENANT-ID>"
  secretObjects:                    # k8s Secret dump ke through
    - secretName: deploytrack-secrets
      type: Opaque
      data:
        - objectName: db-password
          key: DB_PASSWORD
```

> Day 24 ka lesson yahi: pod `DB_PASSWORD` bina koi value kabhi code/yaml me dekhe use karta hai. **CSI + workload identity = golden path.**
**Step 3 — Deployment (`k8s/deployment.yaml`) — blue label + probes + limits + CSI volume:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: deploytrack-api
  namespace: deploytrack-dev
  labels: { app: deploytrack-api, version: blue }
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate: { maxUnavailable: 0, maxSurge: 1 }
  selector:
    matchLabels: { app: deploytrack-api }
  template:
    metadata:
      labels: { app: deploytrack-api, version: blue }
    spec:
      containers:
        - name: api
          image: acrdeploytrackdev.azurecr.io/deploytrack-api:<IMAGE_TAG>
          ports: [{ containerPort: 8080 }]
          envFrom:
            - configMapRef: { name: deploytrack-config }
          env:
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: deploytrack-secrets
                  key: DB_PASSWORD
          resources:
            requests: { cpu: "100m", memory: "128Mi" }
            limits:   { cpu: "500m", memory: "256Mi" }
          readinessProbe:
            httpGet: { path: /health, port: 8080 }
            initialDelaySeconds: 3
            periodSeconds: 5
          livenessProbe:
            httpGet: { path: /health, port: 8080 }
            initialDelaySeconds: 10
            periodSeconds: 10
          volumeMounts:
            - name: secrets-store
              mountPath: "/mnt/secrets"
              readOnly: true
      volumes:
        - name: secrets-store
          csi:
            driver: secrets-store.csi.k8s.io
            readOnly: true
            volumeAttributes:
              secretProviderClass: deploytrack-kv
```

**Step 4 — Services (blue + green) + Ingress (`k8s/services.yaml`, `k8s/ingress.yaml`):**
```yaml
apiVersion: v1
kind: Service
metadata: { name: deploytrack-blue, namespace: deploytrack-dev }
spec:
  selector: { app: deploytrack-api, version: blue }
  ports: [{ port: 80, targetPort: 8080 }]
---
apiVersion: v1
kind: Service
metadata: { name: deploytrack-green, namespace: deploytrack-dev }
spec:
  selector: { app: deploytrack-api, version: green }
  ports: [{ port: 80, targetPort: 8080 }]
```
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: deploytrack-ingress
  namespace: deploytrack-dev
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
    - host: deploytrack.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: deploytrack-blue      # <-- traffic seam: blue↔green yahi switch hota hai
                port: { number: 80 }
```

**Step 5 — Manually apply + verify (pipeline se pehle):**
```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
kubectl apply -f k8s/namespace.yaml -f k8s/configmap.yaml -f k8s/secretproviderclass.yaml
kubectl apply -f k8s/deployment.yaml -f k8s/services.yaml -f k8s/ingress.yaml
kubectl rollout status deploy/deploytrack-api -n deploytrack-dev
kubectl get pods,svc,ing -n deploytrack-dev
kubectl describe pod -n deploytrack-dev -l app=deploytrack-api | grep -iA3 "secret"   # CSI mount OK?
```

### Phase B — `azure-pipelines.yml` (multi-stage, full)
**Step 6 — Trigger + variables + top skeleton:**
```yaml
trigger:
  branches: { include: ["main"] }
  paths: { exclude: ["docs/**", "*.md"] }

variables:
  - group: kv-deploytrack              # Key Vault linked — secrets sirf prod stage scope me
  - name: imageRepository
    value: deploytrack-api
  - name: dockerRegistryServiceConnection
    value: sc-acr-federated            # workload identity federation (day 28)
  - name: kubernetesServiceConnection
    value: sc-aks-dev
  - name: acrLogin
    value: acrdeploytrackdev.azurecr.io
  - name: imageTag
    value: $(Build.SourceVersion)      # full commit SHA — deterministic image id

stages:
stages:   # CI / DeployDev / DeployProd defined fully in steps 7-12
```

**Step 7 — CI job 1: lint + test:**
```yaml
      - job: lint_test
        pool: { vmImage: ubuntu-latest }
        steps:
          - checkout: self
          - task: UsePythonVersion@0
            inputs: { versionSpec: "3.12", addToPath: true }
          - script: |
              python -m pip install --upgrade pip
              pip install -r backend/requirements.txt
              pip install flake8
            displayName: "Install deps"
          - script: flake8 backend/ --max-line-length=120 --count
            displayName: "Lint"
          - script: |
              cd backend && python -m pytest -v --junitxml=../test-results.xml
            displayName: "Unit tests"
          - task: PublishTestResults@2
            inputs:
              testResultsFormat: "JUnit"
              testResultsFiles: "test-results.xml"
              failTaskOnFailedTests: true
```
Test fail → pipeline red. Feedback < 3 min. Yehi sixth "quality gate" hai.

**Step 8 — CI job 2: build + Trivy + push (SHA tag):**
```yaml
      - job: build_push
        dependsOn: lint_test
        pool: { vmImage: ubuntu-latest }
        steps:
          - checkout: self
          - task: Docker@2
            displayName: "Login to ACR (workload identity)"
            inputs:
              command: login
              containerRegistry: $(dockerRegistryServiceConnection)
          - task: Docker@2
            displayName: "Build + Push $(imageTag)"
            inputs:
              command: buildAndPush
              repository: $(imageRepository)
              dockerfile: backend/Dockerfile
              tags: |
                $(imageTag)
                $(Build.BuildId)
          - bash: |
              docker pull $(acrLogin)/$(imageRepository):$(imageTag)
              docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
                aquasec/trivy image --severity HIGH,CRITICAL \
                --exit-code 1 --no-progress \
                $(acrLogin)/$(imageRepository):$(imageTag)
            displayName: "Trivy image scan (gate: HIGH/CRITICAL)"
```
> **2026 supply-chain:** digest bhi capture karo: `docker inspect --format='{{index .RepoDigests 0}}'` — deploy time pe digest-pinned image use kar sakte ho. Trivy gate critical hai: Trivy gate critical hai — image **push se pehle** hi vulnerability fail (shift-left). SBOM/cosign signing extras (Day 48). Gist: bina clean scan ke ACR me koi image nahi.
**Step 9 — Deploy Dev stage (apply + rollout readiness gate):**
```yaml
  - stage: DeployDev
    displayName: "CD -> Deploy Dev"
    dependsOn: CI
    condition: succeeded()
    jobs:
      - deployment: Dev
        environment: dev
        strategy:
          runOnce:
            deploy:
              steps:
                - checkout: self
                - task: KubernetesManifest@1
                  displayName: "Apply base manifests"
                  inputs:
                    action: create
                    namespace: deploytrack-dev
                    manifests: |
                      k8s/namespace.yaml
                      k8s/configmap.yaml
                      k8s/secretproviderclass.yaml
                - task: KubernetesManifest@1
                  displayName: "Apply deployment (blue, SHA tag)"
                  inputs:
                    action: create
                    manifests: k8s/deployment.yaml
                    containers: "$(acrLogin)/$(imageRepository):$(imageTag)"
                - task: Kubernetes@1
                  displayName: "Wait for rollout (readiness gate)"
                  inputs:
                    command: rollout
                    arguments: status deployment/deploytrack-api -n deploytrack-dev --timeout=240s
                    kubernetesServiceConnection: $(kubernetesServiceConnection)
```
**Step 10 — Dev smoke test:** `kubectl port-forward svc/deploytrack-blue -n deploytrack-dev 8080:80 &` → `curl -s localhost:8080/health` → POST `/deployments` with a sample body. /health 200 ho toh dev verified.

**Step 11 — Prod approvals (human gate):** Environments → `prod` → Approvals and checks → **Approvals** (owner/resource group, timeout 12h) + **post-deployment gate**: Log Analytics health check (HTTP 5xx count = 0).

**Step 12 — Deploy Prod stage (blue/green):**
```yaml
  - stage: DeployProd
    displayName: "CD -> Deploy PROD (manual approval)"
    dependsOn: DeployDev
    condition: succeeded()
    variables:
      - group: kv-deploytrack         # prod secrets yahin scope — least privilege
    jobs:
      - deployment: Prod
        environment: prod             # approvals & checks isi environment se
        strategy:
          blueGreen:
            deploy:
              steps:
                - checkout: self
                - task: PowerShell@2
                  inputs:
                    targetType: inline
                    script: |
                      $c = Get-Content k8s/deployment.yaml -Raw
                      $c = $c -replace '<IMAGE_TAG>', '$(imageTag)'
                      $c = $c -replace 'version: blue', 'version: green'
                      $c | Set-Content k8s/deployment-green.yaml
                - task: Kubernetes@1
                  displayName: "Apply green deployment"
                  inputs:
                    command: apply
                    arguments: -f k8s/deployment-green.yaml -n deploytrack-dev
                    kubernetesServiceConnection: $(kubernetesServiceConnection)
                - task: Kubernetes@1
                  displayName: "Wait green rollout"
                  inputs:
                    command: rollout
                    arguments: status deployment/deploytrack-api -n deploytrack-dev --timeout=300s
                    kubernetesServiceConnection: $(kubernetesServiceConnection)
                - script: echo "GREEN deployed. Smoke check, then switch ingress."
                  displayName: "Blue/green deployed"
```
> **Blue/green kyu prod me?** Rolling in-place hai — purani pods real-time log pe kati jati hain. Blue/green me **purana blue abhi bhi live** jab tak ingress switch na ho — zero-downtime + instant rollback. Senior sentence: *"Naya version green pe validated hai, traffic abhi bhi blue pe sirf email-summary users ko mil raha hai."*
**Step 13 — `scripts/switch-traffic.sh` (commit karo, chmod +x):**
```bash
#!/usr/bin/env bash
set -euo pipefail
TARGET=${1:?usage: switch-traffic.sh green|blue}
sed -i "s/name: deploytrack-\(blue\|green\)/name: deploytrack-${TARGET}/" k8s/ingress.yaml
kubectl apply -f k8s/ingress.yaml -n deploytrack-dev
kubectl get ingress deploytrack-ingress -n deploytrack-dev -w
```

### Phase C — Run + GitOps ready
**Step 14 — GitOps repo (2026 bonus):**
```bash
az repos create --name deploytrack-gitops --project DeployTrack
git clone <remoteUrl> && cp -r k8s deploytrack-gitops/prod-manifests
cd deploytrack-gitops && git add . && git commit -m "prod manifests from deploytrack" && git push
```
(mention only — Day 32 me): ArgoCD Application is repo pe, `automated` + `selfHeal` — GitOps pull model; push-deploy bhi aur GitOps bhi explain kar sakte ho.

**Step 15 — Run end-to-end:**
```bash
git add -A && git commit -m "feat: multi-stage pipeline + k8s manifests" && git push origin main
```
**Step 16 — Failure drill (sabse zyada seekh):** ek flaky test daalo (`assert False`), push, dekho pipeline kahan red hua (log kholo, kis step me error), phir fix + push. Red build ka screenshot documentation me. `kubectl get events -n deploytrack-dev --sort-by=.lastTimestamp | tail -20` practise roj.
---
## Architecture | Architecture Diagram
```
Dev (git push) ──► Azure Repos ──► Azure Pipelines
                  ├─ CI: lint → pytest → build → trivy → ACR (SHA tag)
                  └─ CD: DeployDev (rollout gate) → Ingress → /health
                        DeployProd ──(human approval)──► blue/green → ingress switch
                   Key Vault ──(CSI Secrets Store)──► pod DB_PASSWORD
                   Azure Monitor ──► metrics/logs (Day 30)    GitOps: ArgoCD (2026)
```
---
## Verification Checklist | Project Verify Karo
- [ ] `azure-pipelines.yml` repo me; pipeline portal pe automatically registry ho gayi
- [ ] Run #1: Lint green + `3 passed` (JUnit uploaded)
- [ ] Image `deploytrack-api:<SHA>` in ACR — SHA tag, not `latest`; Trivy gate passing
- [ ] `DeployDev` pods `Running` + `rollout status` success (readiness gate)
- [ ] Red run documented (flaky test / stuck rollout) — log screenshot
- [ ] Prod stage **"Waiting for approval"** screenshot, approval → prod `Running`
- [ ] Trafik switch: `switch-traffic.sh green` proven, wapas blue
- [ ] `DB_PASSWORD` kahin repo/logs me nahi (search karke prove); pod CSI mount OK
- [ ] `kubectl get pods,svc,ing` — sab desired state
- [ ] (Bonus) GitOps repo `deploytrack-gitops` exists
---
## Deliverables | Submit Kya Karo
- `azure-pipelines.yml` — multi-stage, approvals + gates (repo me)
- `k8s/` — namespace, configmap, secretproviderclass, deployment, services, ingress
- `scripts/switch-traffic.sh` (chmod +x committed)
- Pipeline screenshots (green / approval / red) + `docs/day29-log.md`
- Release tag: `git tag v0.1.0` (DORA-style traceability)
---
## Interview Talk Track | Interview Me Kaise Bolna
**Problem (30 sec):** *"Har deploy manual tha — koi trail nahi. DeployTrack: code push → pipeline sab kuch → prod pe approval gate. Git SHA har jagah."*
**Architecture (1 min):** *"Ek yaml, teen parts: CI (lint, pytest, docker build+scan+push ACR with SHA tag), CD dev (kubectl apply + rollout status readiness gate), CD prod (manual approval → blue/green)."*
**Meri role (1 min):** *"Manifests se pipeline tak sab likha — SecretProviderClass, deployments, ingress traffic switching, environment approvals, blue/green design. ACR pull + Key Vault — identity se."*
**Challenges (2 min):**
- *"Trivy pehle base image ki vulnerabilities me fail — distroless base switch kiya."*
- *"Pod me secret mount nahi hota tha — SecretProviderClass ke `clientID` workload identity client id chahiye thi, VMMI nahi. CSI + OIDC samajhna pada."*
- *"Rollout 240s timeout me ready nahi hua — readiness probe ka initialDelay tune kiya."*
**Mistakes + fixes (1 min):** *"Ek baar `latest` tag prod chala diya demo me — ab SHA hi, deterministic. Ek baar ingress blue hi reh gayi green deploy ke baad — isliye `switch-traffic.sh` commit ki."*
**Metrics (1 min):** *"Push→dev ~6-7 min; push→prod (approval exclude) ~9 min. Change-failure rate ghati as gates improved. Rollback = ingress switch, seconds me."*
**Closer (30 sec):** *"Manifests GitOps-ready, ArgoCD repo me bhi. Aage SLO-based canary + progressive delivery."*

> **Senior tip:** "Pipeline banayi" mat bolo — *"code → ACR → gated CD"* ki journey story. Numbers do (timeouts, image, approvals); har claim ke saath screenshot ready.
