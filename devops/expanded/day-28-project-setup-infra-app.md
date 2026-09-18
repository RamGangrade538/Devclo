# Day 28 — Project Setup: Infra + App (DevClo Expanded — Capstone Project)

> Project: **DeployTrack** — ek web app jo deployments track karta hai, iske saath puri DevOps infra.
> Ye day project ka **foundation** hai: code + tests + containerization + IaC + Azure DevOps wiring.
---
## Overview | Parichay
- **App side:** Flask API (deployments tracker) + pytest tests + multi-stage Dockerfile + `docker-compose.yml` — local me ek command me sab up.
- **IaC side:** Terraform se Resource Group, VNet, **ACR**, **AKS**, **Key Vault**, **Log Analytics** — sab `main.tf`/`variables.tf` + remote state me. 2026 pattern: **Azure Verified Modules (AVM)** reference.
- **Azure DevOps side:** org + project + repo + service connections (ACR & AKS) **workload identity federation** se — koi SPN client secret nahi, no expiry panic.

Day ke end tak: **infra 1 command me recreate, app tests green, pipeline ke connections ready.**

---
## Project Goal | Project Ka Lakshya
- [ ] `deploytrack/` repo structure versioned (backend, terraform, k8s, scripts, docs).
- [ ] Backend API `pytest` 3/3 pass — `make test` green.
- [ ] `docker build` multi-stage → chhota non-root image; Trivy 0 HIGH/CRITICAL.
- [ ] `docker compose up` → `/health` HTTP 200.
- [ ] Terraform single apply: RG + VNet + ACR + Key Vault + Log Analytics + AKS.
- [ ] Terraform state **remote** locked (kabhi `.tfstate` repo me nahi).
- [ ] `az aks get-credentials` → `kubectl get nodes` 2× Ready.
- [ ] ACR login + `az acr import` successful.
- [ ] Azure DevOps org + project + repo exist; initial code pushed.
- [ ] Service connections ACR + AKS via **Workload Identity Federation**.
- [ ] Variable group `kv-deploytrack` Key Vault se linked.
- [ ] `terraform destroy` sandbox me verify (cost cleanup discipline).

---
## Step-by-Step | Kadam Dar Kadam
### Phase A — Repo + App code
**Step 1 — Skeleton + `.gitignore`:**
```bash
mkdir -p deploytrack/{backend,terraform,k8s,scripts,docs}
cd deploytrack && touch README.md Makefile azure-pipelines.yml
```
```gitignore
__pycache__/ .venv/ venv/ *.pyc
*.tfstate* .terraform/ crash.log
.env .env.* !.env.example
*.pem *.key *.crt
```

**Step 2 — `backend/app.py` (deployments tracker API):**
```python
import os, time, uuid
from flask import Flask, request, jsonify
app = Flask(__name__)
DEPLOYMENTS = {}

@app.get("/health")
def health():
    return {"status": "ok", "version": os.getenv("APP_VERSION", "dev")}

@app.post("/deployments")
def create_deployment():
    body = request.get_json(force=True)
    d = {"id": str(uuid.uuid4()), "app": body.get("app"), "env": body.get("env"),
         "sha": body.get("sha"), "status": "pending", "created_at": int(time.time())}
    DEPLOYMENTS[d["id"]] = d
    return jsonify(d), 201

@app.get("/deployments")
def list_deployments():
    return jsonify(list(DEPLOYMENTS.values()))

@app.get("/deployments/<deploy_id>")
def get_deployment(deploy_id):
    d = DEPLOYMENTS.get(deploy_id)
    return jsonify(d) if d else ({"error": "not found"}, 404)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "8080")))
```

**Step 3 — `backend/requirements.txt` + `backend/test_app.py`:**
```
Flask>=3.0
pytest>=8.0
```
```python
import pytest
from app import app

@pytest.fixture()
def client():
    return app.test_client()

def test_health_200(client):
    assert client.get("/health").status_code == 200

def test_create_and_get_deployment(client):
    r = client.post("/deployments", json={"app": "api", "env": "dev", "sha": "abc123"})
    did = r.get_json()["id"]
    assert r.status_code == 201
    assert client.get(f"/deployments/{did}").get_json()["status"] == "pending"

def test_missing_404(client):
    assert client.get("/deployments/nope").status_code == 404
```

**Step 4 — `backend/Dockerfile` (multi-stage, non-root, distroless):**
```dockerfile
FROM python:3.12-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

FROM gcr.io/distroless/python3-debian12
WORKDIR /app
COPY --from=builder /install /usr/local
COPY app.py .
USER nonroot
EXPOSE 8080
ENV PORT=8080
CMD ["app.py"]
```

> 2026 tip: distroless = no shell/package-manager — attack surface factor-10 kam. Debug chahiye to `python:3.12-alpine`, bas healthcheck me external `wget`/`curl` mat maango.
**Step 5 — `docker-compose.yml`:**
```yaml
services:
  api:
    build: ./backend
    ports: ["8080:8080"]
    environment: [PORT=8080]
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://localhost:8080/health').status==200 else 1)"]
      interval: 5s
      timeout: 3s
      retries: 5
```

**Step 6 — `Makefile`:**
```makefile
.PHONY: install test build up down scan
install:
	cd backend && python -m venv .venv && .venv/bin/pip install -r requirements.txt
test: install
	cd backend && .venv/bin/pytest -v
build:
	docker build --target runtime -t deploytrack/api:local ./backend
up:
	docker compose up -d --build
down:
	docker compose down
scan:
	docker build -t deploytrack/api:scan ./backend
	docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image deploytrack/api:scan --severity HIGH,CRITICAL
```

**Step 7 — Local verify:**
```bash
cd backend && python -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/pytest -v                      # 3 passed
cd .. && docker compose up -d --build
curl -s localhost:8080/health            # {"status":"ok","version":"dev"}
docker compose down
```

### Phase B — Terraform (IaC)
**Step 8 — `terraform/backend.tf` (remote state — state = secret):**
```hcl
terraform {
  required_version = ">= 1.8"
  required_providers {
    azurerm = { source = "hashicorp/azurerm", version = ">= 4.0" }
  }
  backend "azurerm" {
    resource_group_name  = "rg-devclo-state"
    storage_account_name = "devclotfstate2027"
    container_name       = "tfstate"
    key                  = "deploytrack/terraform.tfstate"
  }
}
provider "azurerm" { features {} }
```
State storage pehle: `az group create -n rg-devclo-state -l eastus && az storage account create -n devclotfstate2027 -g rg-devclo-state -l eastus --sku Standard_LRS && az storage container create -n tfstate --account-name devclotfstate2027`.

**Step 9 — `variables.tf`:**
```hcl
variable "location"           { default = "eastus" }
variable "environment"        { default = "dev" }
variable "owner_email"        { default = "you@example.com" }
variable "kubernetes_version" { default = "1.31" }
variable "node_vm_size"       { default = "Standard_B2s" }
variable "db_password"        { sensitive = true }
```

**Step 10 — `main.tf` — RG + Log Analytics + ACR:**
```hcl
locals {
  name   = "deploytrack"
  region = var.location
  tags = { project = "DeployTrack", owner = var.owner_email,
           cost_code = "capstone", env = var.environment }
}

resource "azurerm_resource_group" "rg" {
  name     = "rg-${local.name}-${var.environment}"
  location = local.region
  tags     = local.tags
}

resource "azurerm_log_analytics_workspace" "la" {
  name                = "la-${local.name}-${var.environment}"
  resource_group_name = azurerm_resource_group.rg.name
  location            = local.region
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

resource "azurerm_container_registry" "acr" {
  name                = "acr${local.name}${var.environment}"
  resource_group_name = azurerm_resource_group.rg.name
  location            = local.region
  sku                 = "Standard"
  admin_enabled       = false            # koi shared admin password nahi
  tags                = local.tags
}
```

**Step 11 — Key Vault (RBAC mode, 2026):**
```hcl
data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "kv" {
  name                       = "kv-${local.name}${var.environment}"
  resource_group_name        = azurerm_resource_group.rg.name
  location                   = local.region
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  purge_protection_enabled   = true
  soft_delete_retention_days = 7
  enable_rbac_authorization  = true      # access policies nahi, RBAC hi
}

resource "azurerm_key_vault_secret" "db_password" {
  name         = "db-password"
  value        = var.db_password
  key_vault_id = azurerm_key_vault.kv.id
}
```

**Step 12 — AKS (CSI driver + Container Insights on) + identity RBAC:**
```hcl
resource "azurerm_kubernetes_cluster" "aks" {
  name                = "aks-${local.name}-${var.environment}"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  dns_prefix          = "${local.name}${var.environment}"
  kubernetes_version  = var.kubernetes_version

  default_node_pool {
    name                = "system"
    vm_size             = var.node_vm_size
    enable_auto_scaling = true
    min_count           = 1
    max_count           = 3
    node_count          = 2
  }
  identity { type = "SystemAssigned" }

  key_vault_secrets_provider { secret_rotation_enabled = true }
  oms_agent { log_analytics_workspace_id = azurerm_log_analytics_workspace.la.id }
  network_profile { network_plugin = "azure"; network_policy = "azure" }
  tags = local.tags
}

# AKS ko ACR se pull + KV se secrets padhne ki identity permission
resource "azurerm_role_assignment" "aks_acr" {
  scope                = azurerm_container_registry.acr.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_kubernetes_cluster.aks.identity[0].principal_id
}
resource "azurerm_role_assignment" "aks_kv" {
  scope                = azurerm_key_vault.kv.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_kubernetes_cluster.aks.identity[0].principal_id
}
```

> **AVM note (2026):** prod me `azurerm_kubernetes_cluster` ko `Azure/avm-res-containerservice-managedcluster/azurerm` (Azure Verified Modules) se replace karo — best-practice defaults + policy-ready outputs. Is capstone me raw resource thik hai; interview me bolo *"I know AVM exists, would use it for prod; here raw to learn internals."*
**Step 13 — `outputs.tf` + apply:**
```hcl
output "aks_name"      { value = azurerm_kubernetes_cluster.aks.name }
output "acr_login"     { value = azurerm_container_registry.acr.login_server }
output "key_vault_uri" { value = azurerm_key_vault.kv.vault_uri }
output "connect_k8s"   { value = "az aks get-credentials -n ${azurerm_kubernetes_cluster.aks.name} -g ${azurerm_resource_group.rg.name} --overwrite-existing" }
```
```bash
cd terraform && terraform init && terraform validate
export TF_VAR_db_password='SuperS3cret!'
terraform plan -out deploytrack.tfplan && terraform apply deploytrack.tfplan
az aks get-credentials -n aks-deploytrack-dev -g rg-deploytrack-dev --overwrite-existing
kubectl get nodes                          # 2 nodes Ready
az acr import --name acrdeploytrackdev --source docker.io/library/nginx:1.27 --image nginx:1.27
```

### Phase C — Azure DevOps wiring
**Step 14 — Org + project:**
```bash
az extension add --name azure-devops
az devops configure --defaults organization=https://dev.azure.com/<YOU> project=DeployTrack
az devops project create --name DeployTrack --source-control git \
  --process Agile --description "DeployTrack: Azure DevOps -> AKS"
```

**Step 15 — Repo + push:**
```bash
az repos create --name deploytrack --project DeployTrack
git init && git add . && git commit -m "chore: day28 scaffold + flask app + terraform"
git remote add origin $(az repos show --repository deploytrack --query remoteUrl -o tsv)
git push -u origin main
```

**Step 16 — ACR service connection via workload identity federation** (2026 default, no SPN secret):
```bash
az ad app create --display-name "sc-acr-federated"                     # federated credential identity
az role assignment create --assignee <appId> --role AcrPush \
  --scope /subscriptions/<sub>/resourceGroups/rg-deploytrack-dev/providers/Microsoft.ContainerRegistry/registries/acrdeploytrackdev
# Azure DevOps -> New service connection -> Auth type "Workload Identity Federation"
# appId / tenantId / scope fill karo
```
> Microsoft Docs ke hisaab se: Azure DevOps me **Auth type = "Workload Identity Federation"** — Docker/Kubernetes tasks federated token automatically use karte hain. Koi secret rotation nahi. Interview me yahi highlight karna.
**Step 17 — AKS service connection + Key Vault variable group:**
```bash
az devops service-endpoint list --project DeployTrack -o table   # ACR + AKS dono dikhne chahiye
```
Project → Library → Variable group `kv-deploytrack` → *Link secrets from Azure key vault* → link `db-password`. Kal pipeline `$()` me ise use karegi — secret sirf Key Vault me.

**Step 18 — Day-28 smoke test + push:**
```bash
make test                       # 3 passed
make scan                       # 0 HIGH/CRITICAL
terraform plan -out /dev/null   # idempotent = "1 command recreate" ka proof
git add . && git commit -m "docs: day 28 complete" && git push
```
Cleanup drill (optional, discipline): `terraform destroy -auto-approve` sandbox me → waapas `apply` — recreate ki dam dikhi.

---
## Architecture | Architecture Diagram
```
Dev (VS Code + az CLI)
        │ push
        ▼
Azure Repos (DeployTrack) ──► Azure Pipelines (CI: lint → test → build → ACR push)
        │                            │
        │ azure-pipelines.yml        │ image: acrdeploytrackdev/deploytrack-api:SHA
        ▼                            ▼
   Terraform (remote state)    ACR  ──►  AKS (AcrPull identity)
                                              │
                                              ├──► CSI Secrets Store ──► Key Vault (db-password)
                                              └──► Azure Monitor (Container Insights + Logs)
                                                      │
   Dev ─► Azure Repos ─► Pipelines(CI) ─► ACR ─► AKS ◄─── ── Kal ka CD: approval + blue/green
```

Flow: **code push** → pipeline **build + test** → **image ACR me (SHA tag)** → **AKS pull** (identity, no secret) → runtime secrets **Key Vault → CSI driver** → **Azure Monitor** sab dekh raha hai. Har hop identity/code se; hardcoded secret zero.

---
## Verification Checklist | Project Verify Karo
- [ ] `make test` → `3 passed` (screenshot save)
- [ ] `curl localhost:8080/health` → `{"status":"ok"}` with compose up
- [ ] Trivy output `HIGH: 0, CRITICAL: 0`
- [ ] `terraform apply` → `Apply complete!` (RG, ACR, AKS, KV, LA)
- [ ] State sirf remote me — `az storage blob list` me `terraform.tfstate` dikha
- [ ] `kubectl get nodes` → 2× Ready
- [ ] `az acr repository list` → `nginx` imported
- [ ] Azure DevOps: project `DeployTrack` + repo `deploytrack` + initial push
- [ ] Service connections ACR + AKS, dono **Workload Identity Federation** type
- [ ] Variable group `kv-deploytrack` KV-linked
- [ ] `.gitignore` blocks `.tfstate`, `.env`, `*.pem` — `git status` clean
- [ ] Local repo = Azure repo (push bina error)

---
## Deliverables | Submit Kya Karo
- **Repo link** — tag `day28` pe (`git tag day28 && git push --tags`)
- `terraform/` — main.tf, variables.tf, outputs.tf, backend.tf (state NOT in repo)
- `backend/` — app.py, requirements.txt, test_app.py
- `Dockerfile` + `docker-compose.yml` + `Makefile`
- `docs/day28-log.md` — kya banaya / kya error aaya / kaise fix kiya
- Screenshots: `kubectl get nodes`, `az devops service-endpoint list`

---
## Interview Talk Track | Interview Me Kaise Bolna
**Problem (30 sec):** *"Teams ke paas deployments ka koi trail nahi — kya deploy hua, kaunsi sha, kis env, kya status — sab chat pe. DeployTrack ise track karta hai aur poori lifecycle automate karta hai."*
**Architecture (1 min):** *"Code Azure Repos me; pipelines image ko ACR me SHA-tag se push karti hain; AKS deploy karta hai. Secrets Key Vault me, CSI driver pod me laata hai — code me kabhi nahi. Infra Terraform + remote locked state; monitoring Azure Monitor + Log Analytics."*
**Meri role (1 min):** *"End-to-end banaya — app code, tests, Dockerfile, Terraform, pipeline, monitoring, rollback drill. Matlab ek tool nahi, poori chain samajhta hoon."*
**Challenges (2 min):**
- *"Service connection pehle SPN secret se tha, expire hota — workload identity federation switch: koi secret nahi, token auto-refresh."*
- *"AKS ko KV secret nahi milta tha — root cause CSI driver + RBAC; `Key Vault Secrets User` assignment fixed."*
- *"Image 1GB tha — multi-stage + distroless se ~100MB, non-root."*
**Mistakes + fixes (1 min):** *"Ek baar `.tfstate` commit kar diya — turant .gitignore + remote backend. Ek baar container up hi nahi hua (CMD path) — distroless logs padhke samjha."*
**Metrics (1 min):** *"Push→dev ~6 min; prod gated approval ~9 min. Change-failure rate 0 after fix-forward. Rollback MTTR ~2 min."*
**Closer (30 sec):** *"Repo public GitHub pe, screenshots + postmortem README me. Aage ArgoCD GitOps + SLO alerting pe le ja raha hoon."*

> **Senior tip:** Proof ke bina kuch na bolo. Har number ke paas README me screenshot ho. *"Ye raha output"* — baaki sab bakwas.