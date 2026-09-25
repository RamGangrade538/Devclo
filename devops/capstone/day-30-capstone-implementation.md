# Day 30: Capstone Project Implementation
📚 Topic 30: DeployTrack Full Implementation — CI/CD + K8s + Terraform + Verification
✅ Prerequisite-checklist: (review All previous Days 1-29 concepts if needed)

## Overview | Parichay

DeployTrack ka **complete implementation** - CI/CD pipelines, Kubernetes manifests, Terraform infra, monitoring, deployment scripts, sab kuch ek saath. Yahan se aap ek real-world DevOps engineer ban rahe ho.

### Implementation ka matlab — components ko jodna

Kal tak sab alag-alag tha: pipeline alag, manifests alag, infra alag. Aaj wo sab **ek connected system** bante hain — jahan `git push` se lekar production pod health check tak ka rasta automatic hai. Asli DevOps engineering yahi hai: alag tools nahi, **tools ke beech ke connections** — image kahan build hua, kaunse tag se deploy hua, wo tag manifest me kaise pahuncha, aur fail hone pe wapas kaise jaoge. Isliye is din ka focus "type karo aur chalao" nahi, **end-to-end flow verify karna** hai.

Har component ka role interview-answer me aise bolna:
- **CI** — code se image tak: lint, test, scan, build, push
- **CD** — image se pod tak: SHA tag, deploy, health check
- **IaC** — pod se infra tak: cluster, VNet, DB Terraform se
- **Observability** — serve hone ke baad: metrics, logs, alerts

Yeh 4-chapter ka flow khud ek answer hai — "pure stack kaise chalta hai" ke liye.

### CI/CD pipeline — push se production tak ka rasta

Pipeline ka frame: **build fast fail, deploy slow fail**. Pehle `ci.yml` — lint + test turant chale (minutes me), phir build + `trivy` scan, phir GHCR pe push. Deploy alag workflow me: staging auto, production me **manual approval** (GitHub environment protection). Do rules hamesha: 1) **immutable tags** — image pe `latest` kabhi mat lagao, commit SHA use karo, warna rollback ka pata nahi chalta; 2) **har stage ka exit code** matter karta hai — non-zero = pipeline turant ruk jati hai.

| Stage | Tool | Fail hone pe |
|-------|------|--------------|
| Lint/Test | flake8, pytest | build block |
| Image scan | Trivy HIGH+CRITICAL | release block |
| Push | GHCR + SHA tag | aage mat badho |
| Deploy staging | deploy.sh + rollout status | alert + ruk |
| Prod approval | environment gate | insaan decide |

Pipeline me do cheezein aur mat bhoolo: **caching** (deps layer reuse — CI speed 2x tak badh jati hai) aur **artifacts upload** (step-to-step state) — bina inke har run naye sir se chalta hai.

### Declarative everything — manifests ka fayda

`kubectl apply -f` YAML pe chalta hai — matlab cluster ka **desired state file me likha hota hai**, command me nahi. Iska matlab: version control me review hota hai, diff me pata chalta hai kya badla, aur delete+recreate se dar nahi lagta (idempotent). Manifest likhte waqt 4 cheezein hamesha: **resource requests/limits** (warna node pe dosre pods ko crush kar dete ho), **readiness vs liveness probe** (alag cheezein hain — readiness = traffic bhejo, liveness = restart maro), **labels/selectors** ka match, aur **env = ConfigMap vs Secret** ka sahi split. Ye chhoti cheezein hi production me CrashLoopBackOff se bachati hain.

Manifest hygiene checklist (har Deployment me):
- `resources.requests/limits` — node par predictable scheduling
- `readinessProbe` + `livenessProbe` — traffic aur restart ka alag control
- `imagePullPolicy` — dev me `Always`, prod me `IfNotPresent` (ya SHA pin)
- Labels + selector ka exact match — warna Service galat pods pe jaati hai

Isko "manifest hygiene" bol ke interview me apni team practice dikhao.

### Infrastructure as Code — Terraform ka role

Cluster, VNet, database — ye sab `az` CLI se bhi banta hai par **CLI commands history me rehte hain, state nahi**. Terraform **state file** rakhta hai ki kya bana hai, isliye `plan` dikhata hai "kya badlega" apply se pehle — review ka mauka milta hai. Rules: **remote backend** (tfstate kabhi git me nahi), **modules** se code reuse (`./modules/aks`), aur **tags** pehle se lagao (cost track). Order bhi yaad rakho: infra pehle (`terraform apply`), phir app manifests — pipeline me yahi sequencing honi chahiye.

Terraform ke 3 golden rules:
1. **State = shared truth** — remote backend + lock, taaki ek hi apply ek baar chale
2. **Plan review = PR** — har change me `terraform plan` dikhao sabko review ke liye
3. **Cattle, not pets** — resource ko haath se adjust kabhi nahi; delete/recreate sahi

### Deploy, verify, rollback — teenon ek hi unit hain

Deploy sirf tab complete nahi jab pod Running dikhe — **health check pass** hone pe complete hai. Isliye `deploy.sh` me: `kubectl set image` → `rollout status --timeout` → `curl /api/health` → fail = `rollout undo`. Ye **fail-fast loop** asli production skill hai. Rollback bhi automation ka part hai, manual panic nahi: `rollout history` se versions dekho, `rollout undo` se wapas. Interview me yahi bolo: "deploy ke baad health check hota hai, fail pe automatic rollback aur alert" — ye line senior signal deti hai.

Rollback ke 2 levels samjho:
- **App rollback** — purana SHA wapas: `rollout undo` ya old image tag
- **Infra rollback** — `terraform` se pehle worked state pe: destroy/re-apply

Dono ko mix mat karo — app version revert karne ka matlab cluster ko gira dena nahi hai.

### Observability — deploy ke baad ki nigrani

Pipeline green ho gaya par user dekh rahe hain errors — to kya fayda? Isliye saath me **Prometheus scrape config** (app ka `/metrics` endpoint) aur **Grafana dashboard** chahiye, taki rollout ke turant baad latency/error rate dikhe. Minimal setup: app me Counter/latency histogram, `prometheus.yml` me target, dashboard me QPS + p95 + error rate. Alerts ka rule: **symptom pe alert** (error rate badha), cause pe nahi (pod restart) — kyunki symptom hi user ko affect karta hai.

Minimum production visibility kya dikhna chahiye:
- **RED** — Rate (QPS), Errors, Duration (p95/p99)
- **Alerts** — error rate threshold 5 min cross → Slack/email
- **Logs** — request logs with `correlation_id` — trace hi problem dekhne ka raasta

Ye teen line hi "production observability" ka proof ban jati hai.

### Interview angle — poora flow ek breath me

"Ek app production me kaise laoge?" ka answer frame: **commit → CI (lint/test/scan) → image (SHA tag, GHCR) → staging auto → approval → prod → rollout status → health check → rollback if fail → dashboards par nazar**. Sath me bolo ki infra `Terraform` se hai, config `ConfigMap/Secret` me hai, state Git me. Ye 6-7 link ka chain bolna hi end-to-end samajh dikhata hai — tools ka naam sirf uske aage jodna.

Bonus: ek **Go/No-Go criteria** banao — deploy ke baad "sahi hai kaise pata chalega" (health 200, error rate under 1%, p95 budget me). Ye Go/No-Go threshold bolna hi reliability ka difference hai juniors se.

## What You'll Learn | Aaj Ki Seekh

- [ ] GitHub Actions se CI/CD pipeline banana (lint + test + build + scan)
- [ ] Docker images build karna aur GHCR pe push karna
- [ ] Kubernetes manifests likhna (Namespace, Deployment, Service, ConfigMap, Secrets)
- [ ] Terraform se Azure infra provision karna (AKS, VNet, PostgreSQL)
- [ ] deploy.sh aur rollback.sh scripts chalana
- [ ] Health check automation setup karna
- [ ] Prometheus + Grafana monitoring add karna
- [ ] Poora DeployTrack end-to-end deploy karna aur verify karna

---

## Diagram | Dekho Kaise Kaam Karta Hai

### Mermaid - CI/CD + Deploy Flow

```mermaid
graph LR
    DEV["Developer"] -->|"git push"| GH["GitHub Repo"]
    GH -->|"trigger"| CI["CI Pipeline"]
    CI -->|"lint + test"| LINT["Lint & Test"]
    LINT -->|"pass"| BUILD["Build Docker Images"]
    BUILD -->|"security scan"| TRIVY["Trivy Scan"]
    TRIVY -->|"clean"| PUSH["Push to GHCR"]
    PUSH -->|"auto deploy"| STG["Deploy to Staging"]
    STG -->|"manual approval"| PROD["Deploy to Production"]
    PROD -->|"kubectl set image"| AKS["Azure AKS"]
    AKS -->|"rollout status"| HC["Health Check"]
    HC -->|"pass"| DONE["Deploy Complete"]
    HC -->|"fail"| RB["Rollback Script"]
```

### Reference Images

![GitHub Actions CI/CD Workflow](assets/img/gh-actions-hero.svg)
*GitHub Actions - CI/CD automation platform. [Source: GitHub Docs](https://docs.github.com/en/actions)*

![Azure DevOps Pipeline Architecture](assets/img/azure-pipeline-schema.svg)
*Azure Pipelines - build, test, deploy workflow. [Source: Microsoft Learn](https://learn.microsoft.com/en-us/azure/devops/pipelines/)*

---

## CI/CD Pipeline

**1. ci.yml** (Lint + Test + Security):
```yaml
name: CI
on:
  push: {branches: [main, develop]}
  pull_request: {branches: [main]}
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: {python-version: '3.11'}
      - name: Lint
        run: |
          pip install flake8 bandit
          flake8 backend/app/
          bandit -r backend/app/

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: {python-version: '3.11'}
      - name: Test
        run: |
          pip install -r backend/requirements.txt
          pip install pytest
          cd backend && pytest tests/ -v

  build:
    needs: [lint, test]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build images
        run: |
          docker build -t backend:${{ github.sha }} ./backend
          docker build -t frontend:${{ github.sha }} ./frontend
      - name: Scan (Trivy)
        run: |
          docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
            aquasec/trivy image --severity HIGH,CRITICAL backend:${{ github.sha }}
      - name: Push GHCR
        run: |
          echo ${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin
          docker tag backend:${{ github.sha }} ghcr.io/${{ github.repository }}/backend:${{ github.sha }}
          docker push ghcr.io/${{ github.repository }}/backend:${{ github.sha }}
```

**2. deploy.yml** (Staging auto + prod manual approval):
```yaml
name: Deploy
on:
  workflow_run:
    workflows: ["CI"]
    types: [completed]
jobs:
  staging:
    if: github.event.workflow_run.conclusion == 'success'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy staging
        run: ./scripts/deploy.sh staging ${{ github.sha }}

  prod:
    needs: staging
    runs-on: ubuntu-latest
    environment: production
    steps:
      - run: ./scripts/deploy.sh production ${{ github.sha }}
```

---

## Kubernetes Manifests

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata: {name: deploytrack}
```

```yaml
# k8s/backend.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: deploytrack
spec:
  replicas: 3
  selector: {matchLabels: {app: backend}}
  template:
    metadata: {labels: {app: backend}}
    spec:
      containers:
      - name: backend
        image: ghcr.io/your-org/deploytrack-backend:latest
        ports: [{containerPort: 5000}]
        env:
        - name: DATABASE_URL
          valueFrom: {secretKeyRef: {name: app-secrets, key: database-url}}
        - name: REDIS_URL
          valueFrom: {configMapKeyRef: {name: app-config, key: redis-url}}
        resources:
          requests: {memory: "128Mi", cpu: "250m"}
          limits: {memory: "256Mi", cpu: "500m"}
        readinessProbe:
          httpGet: {path: /api/health, port: 5000}
          initialDelaySeconds: 10
        livenessProbe:
          httpGet: {path: /api/health, port: 5000}
          initialDelaySeconds: 30
---
# k8s/backend-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: deploytrack
spec:
  selector: {app: backend}
  ports: [{port: 5000, targetPort: 5000}]
  type: ClusterIP
```

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata: {name: app-config, namespace: deploytrack}
data:
  redis-url: "redis://redis-service:6379/0"
  log-level: "info"
---
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata: {name: app-secrets, namespace: deploytrack}
type: Opaque
stringData:
  database-url: "postgresql://deploy:secret@postgres-service:5432/deploytrack"
```

---

## Terraform

```hcl
# terraform/main.tf
terraform {
  backend "azurerm" {
    resource_group_name  = "rg-tfstate"
    storage_account_name = "deploytracktf2027"
    container_name       = "tfstate"
    key                  = "prod/terraform.tfstate"
  }
}
provider "azurerm" { features {} }

resource "azurerm_resource_group" "rg" {
  name     = "rg-deploytrack"
  location = var.azure_location
}

resource "azurerm_virtual_network" "vnet" {
  name                = "vnet-deploytrack"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
}

module "aks" {
  source = "./modules/aks"
  # AKS (Azure Kubernetes Service) - managed K8s
}

module "postgres" {
  source = "./modules/postgres"
  # Flexible Server (managed Postgres)
}

resource "azurerm_storage_account" "artifacts" {
  name                     = "deploytrackartifacts"
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = azurerm_resource_group.rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}
```

---

## Deployment & Rollback Scripts

```bash
#!/bin/bash
# scripts/deploy.sh
set -euo pipefail
ENV=${1:-staging}
VERSION=${2:-latest}
NS="deploytrack"

echo "Deploying DeployTrack v${VERSION} to ${ENV}..."
kubectl set image deployment/backend backend=ghcr.io/org/deploytrack-backend:${VERSION} -n ${NS}
kubectl set image deployment/frontend frontend=ghcr.io/org/deploytrack-frontend:${VERSION} -n ${NS}

kubectl rollout status deployment/backend -n ${NS} --timeout=300s
kubectl rollout status deployment/frontend -n ${NS} --timeout=300s

sleep 10
if [ "$(curl -s -o /dev/null -w "%{http_code}" http://deploytrack/api/health)" = "200" ]; then
    echo "Deploy OK"
else
    echo "Health check failed - rolling back"
    kubectl rollout undo deployment/backend -n ${NS}
    kubectl rollout undo deployment/frontend -n ${NS}
    exit 1
fi
```

```bash
#!/bin/bash
# scripts/rollback.sh
kubectl rollout undo deployment/backend -n deploytrack
kubectl rollout undo deployment/frontend -n deploytrack
kubectl rollout status deployment/backend -n deploytrack --timeout=300s
echo "Rolled back"
```

```bash
#!/bin/bash
# scripts/health-check.sh
URL=${1:-http://localhost}
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $URL/api/health)
[ "$STATUS" = "200" ] && echo "[PASS] API health" || { echo "[FAIL] $STATUS"; exit 1; }
curl -s $URL/api/services && echo ""
echo "All checks passed"
```

---

## Makefile

```makefile
build:            ## docker-compose build
	 docker-compose build
up:               ## start local
	 docker-compose up -d
down:
	 docker-compose down
test:
	 cd backend && pytest tests/ -v
deploy-staging:
	 ./scripts/deploy.sh staging $(VERSION)
rollback-staging:
	 ./scripts/rollback.sh staging
health:
	 ./scripts/health-check.sh $(URL)
```

---

## Demo | Copy-Paste Karke Chalao

Step 1 - K8s manifests apply karo (AKS cluster mein):
```bash
# Pehle AKS cluster se connect karo
az aks get-credentials --resource-group rg-deploytrack --name aks-deploytrack

# Namespace + Config + Secrets apply
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml

# Backend deploy karo
kubectl apply -f k8s/backend.yaml
kubectl get pods -n deploytrack -w     # pods aane ka wait karo
```

Step 2 - Deploy script chalao:
```bash
chmod +x scripts/*.sh
# <org> = tumhara GitHub org/username, <sha> = commit SHA
./scripts/deploy.sh staging <sha>
curl http://deploytrack-staging.example.com/api/health
curl http://deploytrack-staging.example.com/api/services
```

Step 3 - Rollback test karo:
```bash
./scripts/rollback.sh
kubectl rollout history deployment/backend -n deploytrack
kubectl rollout undo deployment/backend -n deploytrack
```

Step 4 - Health check verify karo:
```bash
./scripts/health-check.sh http://deploytrack.example.com
# Expected: [PASS] API health + services list
```

---

## Monitoring (quick add-on)

```yaml
# monitoring/prometheus.yml
scrape_configs:
  - job_name: 'app'
    static_configs:
      - targets: ['backend-service:5000']
```
Flask mein add karo:
```python
from prometheus_client import start_http_server, Counter
start_http_server(9100)
```

---

## Real-Life Example | Zindagi Se

**Ek aur real-life example - Flipkart/Amazon delivery system:**

| DeployTrack Concept | Real-Life Equivalent |
|---------------------|---------------------|
| CI Pipeline | Factory mein product banna + quality check |
| GHCR (image registry) | Warehouse mein stock rakhna |
| Staging deploy | Pehle ek chhote store mein bechna (test) |
| Production deploy | Poore India mein launch karna |
| Health check | Delivery boy se "order delivered?" confirm karna |
| Rollback | Customer ne return kiya toh previous batch se replace |
| Monitoring (Prometheus/Grafana) | Real-time sales dashboard dekhna |
| Terraform (Infrastructure) | Naya warehouse banana automatic machines se |

**Key takeaway:** Chahe koi bhi system ho - metro, food delivery, e-commerce - agar usme **tracking + automation + monitoring** hai, toh usme DevOps lagta hai. DeployTrack yehi sikhaata hai - ek simple app ko production-grade banao!

---

## Final Verification Checklist

- [ ] CI pipeline pass (lint, test, build, scan)
- [ ] Images GHCR par push
- [ ] Docker images deploy hui
- [ ] K8s pods running (kubectl get pods)
- [ ] Ingress routes correctly (frontend + /api)
- [ ] DB + Redis connected
- [ ] Deploy/rollback scripts kaam karte
- [ ] Prometheus metrics + Grafana dashboard
- [ ] Logs ELK mein
- [ ] Security scans no critical
- [ ] README complete

---

## Congratulations!

**DevClo 2027 - DevOps in 30 Days complete!**

Aapne ab practical experience kar li hai:
- Linux + scripting + Git
- CI/CD (Actions + Jenkins)
- Docker + Docker Compose
- Kubernetes (deploy/scale/rollback)
- Terraform + IaC (Azure)
- Azure services (VM, Storage, VNet, AKS)
- Prometheus/Grafana monitoring
- ELK logging
- DevSecOps security
- SRE principles

**Aage kya karein:**
1. GitHub portfolio (DeployTrack ko public karo)
2. Certifications: Azure DevOps Engineer Expert (AZ-400), CKA, Docker Associate
3. Open source mein contribute karo
4. Naya project banao aur CI/CD add karo
5. Linux/Cloud communities join karo

---

*DevClo 2027 - Aapka DevOps journey yahin tabhi shuru hua hai!*
